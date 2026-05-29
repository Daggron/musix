#pragma once

#include <array>
#include <atomic>
#include <cmath>
#include <cstdint>
#include <mutex>

namespace musix {

static constexpr int kNumBands = 10;
static constexpr float kBandFrequencies[kNumBands] = {
    32.0f, 64.0f, 125.0f, 250.0f, 500.0f,
    1000.0f, 2000.0f, 4000.0f, 8000.0f, 16000.0f};
static constexpr float kDefaultQ = 1.41f;
static constexpr int kRampFrames = 480; // ~10ms at 48kHz

struct BiquadCoeffs {
  float b0 = 1.0f, b1 = 0.0f, b2 = 0.0f;
  float a1 = 0.0f, a2 = 0.0f;
};

struct BiquadState {
  float x1 = 0.0f, x2 = 0.0f;
  float y1 = 0.0f, y2 = 0.0f;

  void reset() { x1 = x2 = y1 = y2 = 0.0f; }
};

class BiquadEQ {
public:
  BiquadEQ();

  void setSampleRate(uint32_t sampleRate);
  void setEnabled(bool enabled);
  bool isEnabled() const { return enabled_.load(std::memory_order_acquire); }

  void setBandGain(int band, float gainDb);
  void setBandGains(const float *gains, int count);
  void getBandGains(float *out, int count) const;

  // Process interleaved audio in-place. Called from real-time thread.
  void process(float *buffer, uint32_t frames, uint32_t channels);

private:
  static BiquadCoeffs computePeakingEQ(float freq, float gainDb, float q,
                                       float sampleRate);
  float computeMakeupGain() const;

  void updateCoefficients();

  std::atomic<bool> enabled_{false};
  bool disabling_{false};
  uint32_t sampleRate_{44100};

  std::array<float, kNumBands> gains_{};
  std::array<BiquadCoeffs, kNumBands> currentCoeffs_{};
  std::array<BiquadCoeffs, kNumBands> targetCoeffs_{};
  std::array<std::array<BiquadState, 2>, kNumBands> state_{};

  int rampRemaining_{0};
  std::array<BiquadCoeffs, kNumBands> rampStartCoeffs_{};
  float makeupGain_{1.0f};

  std::mutex coeffMutex_;
  std::atomic<bool> coeffsDirty_{false};
};

} // namespace musix
