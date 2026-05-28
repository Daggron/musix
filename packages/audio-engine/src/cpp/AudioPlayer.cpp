#include "AudioPlayer.h"
#include <algorithm>
#include <cstring>

namespace musix {

static constexpr uint32_t kDecodeChunkFrames = 1024;

AudioPlayer::AudioPlayer() = default;

AudioPlayer::~AudioPlayer() {
  stop();
  stopDecodeThread();
}

bool AudioPlayer::loadTrack(const std::string &filePath) {
  stop();
  stopDecodeThread();

  if (!decoder_.open(filePath)) {
    return false;
  }

  trackLoaded_.store(true);
  trackEnded_.store(false);
  framesRead_.store(0);
  seekRequested_.store(false);

  rebuildRingBuffer();
  startDecodeThread();
  return true;
}

void AudioPlayer::play() {
  if (!trackLoaded_.load())
    return;
  playing_.store(true, std::memory_order_release);
  decodeCv_.notify_one();
}

void AudioPlayer::pause() {
  playing_.store(false, std::memory_order_release);
}

void AudioPlayer::stop() {
  playing_.store(false, std::memory_order_release);
  stopDecodeThread();

  if (ring_) {
    ring_->reset();
  }
  decoder_.close();
  trackLoaded_.store(false);
  trackEnded_.store(false);
  framesRead_.store(0);
}

bool AudioPlayer::seekToMs(double positionMs) {
  if (!trackLoaded_.load())
    return false;

  uint64_t targetFrame =
      static_cast<uint64_t>(positionMs / 1000.0 *
                            static_cast<double>(decoder_.sampleRate()));
  seekTargetFrame_.store(targetFrame);
  seekRequested_.store(true, std::memory_order_release);
  decodeCv_.notify_one();
  return true;
}

uint32_t AudioPlayer::pullAudio(float *buffer, uint32_t frames) {
  if (!ring_ || !playing_.load(std::memory_order_acquire)) {
    return 0;
  }

  uint32_t read = ring_->read(buffer, frames);

  if (read == 0 && trackEnded_.load(std::memory_order_acquire)) {
    playing_.store(false, std::memory_order_release);
  }

  return read;
}

void AudioPlayer::rebuildRingBuffer() {
  uint32_t ch = decoder_.channels();
  if (ch == 0)
    ch = 2;
  ring_ = std::make_unique<RingBuffer>(kRingBufferFrames, ch);
}

void AudioPlayer::startDecodeThread() {
  threadRunning_.store(true);
  decodeThread_ = std::thread([this] { decodeThreadLoop(); });
}

void AudioPlayer::stopDecodeThread() {
  threadRunning_.store(false, std::memory_order_release);
  decodeCv_.notify_one();
  if (decodeThread_.joinable()) {
    decodeThread_.join();
  }
}

void AudioPlayer::decodeThreadLoop() {
  std::vector<float> chunk(kDecodeChunkFrames * decoder_.channels());

  while (threadRunning_.load(std::memory_order_acquire)) {
    // Handle seek request
    if (seekRequested_.exchange(false, std::memory_order_acq_rel)) {
      uint64_t target = seekTargetFrame_.load(std::memory_order_relaxed);
      decoder_.seekToFrame(target);
      ring_->reset();
      framesRead_.store(target, std::memory_order_relaxed);
      trackEnded_.store(false);
    }

    // Fill ring buffer
    if (ring_->availableWrite() >= kDecodeChunkFrames) {
      uint64_t decoded =
          decoder_.readFrames(chunk.data(), kDecodeChunkFrames);

      if (decoded > 0) {
        ring_->write(chunk.data(), static_cast<uint32_t>(decoded));
      }

      if (decoded < kDecodeChunkFrames) {
        trackEnded_.store(true, std::memory_order_release);
      }

      if (decoded > 0) {
        continue;
      }
    }

    // Sleep until woken: buffer has space or state changed
    std::unique_lock<std::mutex> lock(decodeMutex_);
    decodeCv_.wait_for(lock, std::chrono::milliseconds(10), [this] {
      return !threadRunning_.load(std::memory_order_acquire) ||
             seekRequested_.load(std::memory_order_acquire) ||
             (ring_ && ring_->availableWrite() >= kDecodeChunkFrames);
    });
  }
}

} // namespace musix
