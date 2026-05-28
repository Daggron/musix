#pragma once

#include <cstdint>
#include <string>

namespace musix {

class FlacDecoder {
public:
  FlacDecoder();
  ~FlacDecoder();

  FlacDecoder(const FlacDecoder &) = delete;
  FlacDecoder &operator=(const FlacDecoder &) = delete;

  bool open(const std::string &filePath);
  void close();

  uint64_t readFrames(float *buffer, uint64_t framesToRead);
  bool seekToFrame(uint64_t frameIndex);

  bool isOpen() const { return flac_ != nullptr; }
  uint32_t sampleRate() const { return sampleRate_; }
  uint32_t channels() const { return channels_; }
  uint64_t totalFrames() const { return totalFrames_; }
  double durationMs() const;

private:
  void *flac_ = nullptr;
  uint32_t sampleRate_ = 0;
  uint32_t channels_ = 0;
  uint64_t totalFrames_ = 0;
};

} // namespace musix
