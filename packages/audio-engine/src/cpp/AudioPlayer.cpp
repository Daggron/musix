#include "AudioPlayer.h"
#include <cstring>

namespace musix {

AudioPlayer::AudioPlayer() = default;

AudioPlayer::~AudioPlayer() { stop(); }

bool AudioPlayer::loadTrack(const std::string &filePath) {
  stop();

  auto buf = std::make_unique<TrackBuffer>();
  if (!buf->open(filePath)) {
    return false;
  }

  buf->startThread();
  current_ = std::move(buf);
  framesConsumed_.store(0);
  trackEnded_.store(false);
  trackTransitioned_.store(false);
  return true;
}

bool AudioPlayer::preloadNext(const std::string &filePath) {
  auto buf = std::make_unique<TrackBuffer>();
  if (!buf->open(filePath)) {
    return false;
  }

  buf->startThread();

  std::lock_guard<std::mutex> lock(nextMutex_);
  if (next_) {
    next_->close();
  }
  next_ = std::move(buf);
  return true;
}

void AudioPlayer::play() {
  if (!current_)
    return;
  playing_.store(true, std::memory_order_release);
  current_->cv.notify_one();
}

void AudioPlayer::pause() {
  playing_.store(false, std::memory_order_release);
}

void AudioPlayer::stop() {
  playing_.store(false, std::memory_order_release);

  if (current_) {
    current_->close();
    current_.reset();
  }

  {
    std::lock_guard<std::mutex> lock(nextMutex_);
    if (next_) {
      next_->close();
      next_.reset();
    }
  }

  trackEnded_.store(false);
  trackTransitioned_.store(false);
  framesConsumed_.store(0);
}

bool AudioPlayer::seekToMs(double positionMs) {
  if (!current_ || !current_->decoder.isOpen())
    return false;

  uint64_t targetFrame = static_cast<uint64_t>(
      positionMs / 1000.0 *
      static_cast<double>(current_->decoder.sampleRate()));
  current_->seekTarget.store(targetFrame);
  current_->seekRequested.store(true, std::memory_order_release);
  current_->cv.notify_one();

  framesConsumed_.store(targetFrame);
  return true;
}

uint32_t AudioPlayer::pullAudio(float *buffer, uint32_t frames) {
  if (!current_ || !playing_.load(std::memory_order_acquire)) {
    return 0;
  }

  uint32_t totalRead = 0;

  // Read from current track
  if (current_->ring) {
    totalRead = current_->ring->read(buffer, frames);
    framesConsumed_.fetch_add(totalRead, std::memory_order_relaxed);
  }

  // If current buffer drained and track is at EOF, attempt gapless swap
  if (totalRead < frames &&
      current_->eof.load(std::memory_order_acquire)) {

    std::unique_lock<std::mutex> lock(nextMutex_, std::try_to_lock);
    if (lock.owns_lock() && next_) {
      // Swap next → current
      current_->close();
      current_ = std::move(next_);
      framesConsumed_.store(0);
      trackTransitioned_.store(true, std::memory_order_release);

      // Fill remainder from new current track
      if (current_->ring) {
        uint32_t remaining = frames - totalRead;
        uint32_t extra =
            current_->ring->read(buffer + totalRead * current_->decoder.channels(),
                                 remaining);
        framesConsumed_.fetch_add(extra, std::memory_order_relaxed);
        totalRead += extra;
      }
    } else if (!next_) {
      // No next track — track ended
      if (totalRead == 0) {
        playing_.store(false, std::memory_order_release);
        trackEnded_.store(true, std::memory_order_release);
      }
    }
  }

  return totalRead;
}

} // namespace musix
