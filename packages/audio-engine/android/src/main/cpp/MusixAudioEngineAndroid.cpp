#include "MusixAudioEngineAndroid.h"
#include <android/log.h>
#include <cstring>

#define LOG_TAG "MusixAudioEngine"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace musix {

MusixAudioEngineAndroid &MusixAudioEngineAndroid::shared() {
  static MusixAudioEngineAndroid instance;
  return instance;
}

bool MusixAudioEngineAndroid::loadTrack(const std::string &filePath) {
  closeStream();
  if (!player_.loadTrack(filePath)) {
    return false;
  }
  rebuildStream();
  return true;
}

bool MusixAudioEngineAndroid::preloadNext(const std::string &filePath) {
  return player_.preloadNext(filePath);
}

void MusixAudioEngineAndroid::play() {
  if (!player_.isTrackLoaded()) return;

  player_.play();

  std::lock_guard<std::mutex> lock(streamMutex_);
  if (stream_) {
    stream_->requestStart();
  }
}

void MusixAudioEngineAndroid::pause() {
  player_.pause();

  std::lock_guard<std::mutex> lock(streamMutex_);
  if (stream_) {
    stream_->requestPause();
  }
}

void MusixAudioEngineAndroid::stop() {
  player_.stop();
  closeStream();
}

void MusixAudioEngineAndroid::seekToMs(double positionMs) {
  player_.seekToMs(positionMs);
}

void MusixAudioEngineAndroid::rebuildStream() {
  std::lock_guard<std::mutex> lock(streamMutex_);

  if (stream_) {
    stream_->close();
    stream_.reset();
  }

  uint32_t sampleRate = player_.sampleRate();
  uint32_t channels = player_.channels();
  if (sampleRate == 0 || channels == 0) return;

  oboe::AudioStreamBuilder builder;
  builder.setDirection(oboe::Direction::Output)
      ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
      ->setSharingMode(oboe::SharingMode::Exclusive)
      ->setFormat(oboe::AudioFormat::Float)
      ->setChannelCount(static_cast<int>(channels))
      ->setSampleRate(static_cast<int>(sampleRate))
      ->setSampleRateConversionQuality(
          oboe::SampleRateConversionQuality::High)
      ->setDataCallback(this)
      ->setErrorCallback(this);

  oboe::Result result = builder.openStream(stream_);
  if (result != oboe::Result::OK) {
    LOGE("Failed to open stream: %s", oboe::convertToText(result));
    stream_.reset();
  }
}

void MusixAudioEngineAndroid::closeStream() {
  std::lock_guard<std::mutex> lock(streamMutex_);
  if (stream_) {
    stream_->close();
    stream_.reset();
  }
}

oboe::DataCallbackResult
MusixAudioEngineAndroid::onAudioReady(oboe::AudioStream *stream,
                                       void *audioData, int32_t numFrames) {
  auto *buffer = static_cast<float *>(audioData);
  uint32_t channels = stream->getChannelCount();
  uint32_t framesRead =
      player_.pullAudio(buffer, static_cast<uint32_t>(numFrames));

  if (framesRead < static_cast<uint32_t>(numFrames)) {
    std::memset(buffer + framesRead * channels, 0,
                (numFrames - framesRead) * channels * sizeof(float));
  }

  return oboe::DataCallbackResult::Continue;
}

void MusixAudioEngineAndroid::onErrorAfterClose(oboe::AudioStream *stream,
                                                  oboe::Result error) {
  LOGE("Stream error: %s — rebuilding", oboe::convertToText(error));
  if (player_.isPlaying()) {
    rebuildStream();
    std::lock_guard<std::mutex> lock(streamMutex_);
    if (stream_) {
      stream_->requestStart();
    }
  }
}

} // namespace musix
