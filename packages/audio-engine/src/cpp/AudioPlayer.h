#pragma once

#include "BiquadEQ.h"
#include "TrackBuffer.h"

#include <atomic>
#include <functional>
#include <memory>
#include <mutex>
#include <string>

namespace musix {

class AudioPlayer {
public:
  using TrackTransitionCallback = std::function<void()>;

  AudioPlayer();
  ~AudioPlayer();

  AudioPlayer(const AudioPlayer &) = delete;
  AudioPlayer &operator=(const AudioPlayer &) = delete;

  bool loadTrack(const std::string &filePath);
  bool preloadNext(const std::string &filePath);
  void play();
  void pause();
  void stop();
  bool seekToMs(double positionMs);

  // Called by audio render callback (real-time thread).
  // Returns frames read. Handles gapless transition internally.
  uint32_t pullAudio(float *buffer, uint32_t frames);

  bool isPlaying() const { return playing_.load(std::memory_order_acquire); }
  bool isTrackLoaded() const { return current_ && current_->decoder.isOpen(); }

  // Set to true after gapless transition or track end with no next track.
  bool hasTrackEnded() const { return trackEnded_.load(); }
  void clearTrackEnded() { trackEnded_.store(false); }

  // Set to true after a gapless swap. Cleared by caller.
  bool hasTrackTransitioned() const { return trackTransitioned_.load(); }
  void clearTrackTransitioned() { trackTransitioned_.store(false); }

  uint32_t sampleRate() const {
    return current_ ? current_->decoder.sampleRate() : 0;
  }
  uint32_t channels() const {
    return current_ ? current_->decoder.channels() : 0;
  }
  double durationMs() const {
    return current_ ? current_->decoder.durationMs() : 0.0;
  }

  double positionMs() const {
    if (!current_ || current_->decoder.sampleRate() == 0)
      return 0.0;
    return static_cast<double>(
               framesConsumed_.load(std::memory_order_relaxed)) /
           static_cast<double>(current_->decoder.sampleRate()) * 1000.0;
  }

  BiquadEQ &eq() { return eq_; }

private:
  std::unique_ptr<TrackBuffer> current_;
  std::unique_ptr<TrackBuffer> next_;
  std::mutex nextMutex_;

  std::atomic<bool> playing_{false};
  std::atomic<bool> trackEnded_{false};
  std::atomic<bool> trackTransitioned_{false};
  std::atomic<uint64_t> framesConsumed_{0};

  BiquadEQ eq_;
};

} // namespace musix
