#pragma once

#include "FlacDecoder.h"
#include "RingBuffer.h"

#include <atomic>
#include <condition_variable>
#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <thread>

namespace musix {

// ~200ms of buffer at 192kHz stereo
static constexpr uint32_t kRingBufferFrames = 192000 / 5;

class AudioPlayer {
public:
  AudioPlayer();
  ~AudioPlayer();

  AudioPlayer(const AudioPlayer &) = delete;
  AudioPlayer &operator=(const AudioPlayer &) = delete;

  bool loadTrack(const std::string &filePath);
  void play();
  void pause();
  void stop();
  bool seekToMs(double positionMs);

  // Called by the audio render callback (real-time thread).
  // Reads interleaved float32 frames from the ring buffer.
  // Returns frames actually read. Caller must zero-fill remainder.
  uint32_t pullAudio(float *buffer, uint32_t frames);

  bool isPlaying() const { return playing_.load(std::memory_order_acquire); }
  bool isTrackLoaded() const { return trackLoaded_.load(); }
  bool hasTrackEnded() const { return trackEnded_.load(); }
  void clearTrackEnded() { trackEnded_.store(false); }

  uint32_t sampleRate() const { return decoder_.sampleRate(); }
  uint32_t channels() const { return decoder_.channels(); }
  double durationMs() const { return decoder_.durationMs(); }

  double positionMs() const {
    uint32_t sr = decoder_.sampleRate();
    if (sr == 0)
      return 0.0;
    return static_cast<double>(framesRead_.load(std::memory_order_relaxed)) /
           static_cast<double>(sr) * 1000.0;
  }

private:
  void decodeThreadLoop();
  void startDecodeThread();
  void stopDecodeThread();
  void rebuildRingBuffer();

  FlacDecoder decoder_;
  std::unique_ptr<RingBuffer> ring_;

  std::thread decodeThread_;
  std::mutex decodeMutex_;
  std::condition_variable decodeCv_;

  std::atomic<bool> playing_{false};
  std::atomic<bool> trackLoaded_{false};
  std::atomic<bool> trackEnded_{false};
  std::atomic<bool> threadRunning_{false};
  std::atomic<bool> seekRequested_{false};
  std::atomic<uint64_t> seekTargetFrame_{0};
  std::atomic<uint64_t> framesRead_{0};
};

} // namespace musix
