#pragma once

#include "FlacDecoder.h"
#include "RingBuffer.h"

#include <atomic>
#include <condition_variable>
#include <cstdint>
#include <memory>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

namespace musix {

static constexpr uint32_t kTrackRingFrames = 192000 / 5; // ~200ms at 192kHz
static constexpr uint32_t kDecodeChunk = 1024;

struct TrackBuffer {
  FlacDecoder decoder;
  std::unique_ptr<RingBuffer> ring;

  std::thread thread;
  std::mutex mutex;
  std::condition_variable cv;

  std::atomic<bool> running{false};
  std::atomic<bool> eof{false};
  std::atomic<bool> seekRequested{false};
  std::atomic<uint64_t> seekTarget{0};
  std::atomic<uint64_t> framesDecoded{0};

  bool open(const std::string &filePath) {
    if (!decoder.open(filePath))
      return false;
    ring = std::make_unique<RingBuffer>(kTrackRingFrames, decoder.channels());
    eof.store(false);
    framesDecoded.store(0);
    seekRequested.store(false);
    return true;
  }

  void startThread() {
    running.store(true);
    thread = std::thread([this] { decodeLoop(); });
  }

  void stopThread() {
    running.store(false, std::memory_order_release);
    cv.notify_one();
    if (thread.joinable())
      thread.join();
  }

  void close() {
    stopThread();
    if (ring)
      ring->reset();
    decoder.close();
    eof.store(false);
    framesDecoded.store(0);
  }

  void decodeLoop() {
    uint32_t ch = decoder.channels();
    if (ch == 0)
      ch = 2;
    std::vector<float> chunk(kDecodeChunk * ch);

    while (running.load(std::memory_order_acquire)) {
      if (seekRequested.exchange(false, std::memory_order_acq_rel)) {
        uint64_t target = seekTarget.load(std::memory_order_relaxed);
        decoder.seekToFrame(target);
        ring->reset();
        framesDecoded.store(target, std::memory_order_relaxed);
        eof.store(false);
      }

      if (ring->availableWrite() >= kDecodeChunk) {
        uint64_t n = decoder.readFrames(chunk.data(), kDecodeChunk);
        if (n > 0) {
          ring->write(chunk.data(), static_cast<uint32_t>(n));
          framesDecoded.fetch_add(n, std::memory_order_relaxed);
        }
        if (n < kDecodeChunk) {
          eof.store(true, std::memory_order_release);
        }
        if (n > 0)
          continue;
      }

      std::unique_lock<std::mutex> lock(mutex);
      cv.wait_for(lock, std::chrono::milliseconds(10), [this] {
        return !running.load(std::memory_order_acquire) ||
               seekRequested.load(std::memory_order_acquire) ||
               (ring && ring->availableWrite() >= kDecodeChunk);
      });
    }
  }
};

} // namespace musix
