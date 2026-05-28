#pragma once

#include <atomic>
#include <cstdint>
#include <cstring>
#include <vector>

namespace musix {

// Lock-free single-producer single-consumer ring buffer for float samples.
// Producer: decode thread writes interleaved samples.
// Consumer: audio render callback reads interleaved samples.
class RingBuffer {
public:
  explicit RingBuffer(uint32_t capacityFrames, uint32_t channels)
      : channels_(channels),
        capacitySamples_(capacityFrames * channels),
        buffer_(capacitySamples_),
        head_(0),
        tail_(0) {}

  uint32_t channels() const { return channels_; }
  uint32_t capacityFrames() const { return capacitySamples_ / channels_; }

  // Available frames to read (consumer calls this).
  uint32_t availableRead() const {
    uint32_t h = head_.load(std::memory_order_acquire);
    uint32_t t = tail_.load(std::memory_order_relaxed);
    uint32_t samples = (h >= t) ? (h - t) : (capacitySamples_ - t + h);
    return samples / channels_;
  }

  // Available frames of free space to write (producer calls this).
  uint32_t availableWrite() const {
    uint32_t h = head_.load(std::memory_order_relaxed);
    uint32_t t = tail_.load(std::memory_order_acquire);
    uint32_t used = (h >= t) ? (h - t) : (capacitySamples_ - t + h);
    uint32_t free = capacitySamples_ - used - channels_;
    return free / channels_;
  }

  // Write interleaved frames into the buffer. Returns frames actually written.
  // Called by producer (decode thread) only.
  uint32_t write(const float *src, uint32_t frames) {
    uint32_t avail = availableWrite();
    uint32_t toWrite = (frames < avail) ? frames : avail;
    if (toWrite == 0)
      return 0;

    uint32_t samples = toWrite * channels_;
    uint32_t h = head_.load(std::memory_order_relaxed);

    uint32_t firstChunk = capacitySamples_ - h;
    if (firstChunk >= samples) {
      std::memcpy(&buffer_[h], src, samples * sizeof(float));
    } else {
      std::memcpy(&buffer_[h], src, firstChunk * sizeof(float));
      std::memcpy(&buffer_[0], src + firstChunk,
                   (samples - firstChunk) * sizeof(float));
    }

    uint32_t newHead = (h + samples) % capacitySamples_;
    head_.store(newHead, std::memory_order_release);
    return toWrite;
  }

  // Read interleaved frames from the buffer. Returns frames actually read.
  // Called by consumer (audio render callback) only.
  uint32_t read(float *dst, uint32_t frames) {
    uint32_t avail = availableRead();
    uint32_t toRead = (frames < avail) ? frames : avail;
    if (toRead == 0)
      return 0;

    uint32_t samples = toRead * channels_;
    uint32_t t = tail_.load(std::memory_order_relaxed);

    uint32_t firstChunk = capacitySamples_ - t;
    if (firstChunk >= samples) {
      std::memcpy(dst, &buffer_[t], samples * sizeof(float));
    } else {
      std::memcpy(dst, &buffer_[t], firstChunk * sizeof(float));
      std::memcpy(dst + firstChunk, &buffer_[0],
                   (samples - firstChunk) * sizeof(float));
    }

    uint32_t newTail = (t + samples) % capacitySamples_;
    tail_.store(newTail, std::memory_order_release);
    return toRead;
  }

  void reset() {
    head_.store(0, std::memory_order_relaxed);
    tail_.store(0, std::memory_order_relaxed);
  }

private:
  uint32_t channels_;
  uint32_t capacitySamples_;
  std::vector<float> buffer_;
  alignas(64) std::atomic<uint32_t> head_;
  alignas(64) std::atomic<uint32_t> tail_;
};

} // namespace musix
