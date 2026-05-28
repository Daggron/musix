#define DR_FLAC_IMPLEMENTATION
#include "dr_flac.h"

#include "FlacDecoder.h"

namespace musix {

FlacDecoder::FlacDecoder() = default;

FlacDecoder::~FlacDecoder() { close(); }

bool FlacDecoder::open(const std::string &filePath) {
  close();

  auto *f = drflac_open_file(filePath.c_str(), nullptr);
  if (!f) {
    return false;
  }

  flac_ = f;
  sampleRate_ = f->sampleRate;
  channels_ = f->channels;
  totalFrames_ = f->totalPCMFrameCount;
  return true;
}

void FlacDecoder::close() {
  if (flac_) {
    drflac_close(static_cast<drflac *>(flac_));
    flac_ = nullptr;
    sampleRate_ = 0;
    channels_ = 0;
    totalFrames_ = 0;
  }
}

uint64_t FlacDecoder::readFrames(float *buffer, uint64_t framesToRead) {
  if (!flac_) {
    return 0;
  }
  return drflac_read_pcm_frames_f32(static_cast<drflac *>(flac_), framesToRead,
                                    buffer);
}

bool FlacDecoder::seekToFrame(uint64_t frameIndex) {
  if (!flac_) {
    return false;
  }
  return drflac_seek_to_pcm_frame(static_cast<drflac *>(flac_), frameIndex) ==
         DRFLAC_TRUE;
}

double FlacDecoder::durationMs() const {
  if (sampleRate_ == 0) {
    return 0.0;
  }
  return static_cast<double>(totalFrames_) / static_cast<double>(sampleRate_) *
         1000.0;
}

} // namespace musix
