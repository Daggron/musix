#include "BiquadEQ.h"
#include <algorithm>
#include <cstring>

namespace musix {

BiquadEQ::BiquadEQ() {
  gains_.fill(0.0f);
  for (int i = 0; i < kNumBands; ++i) {
    currentCoeffs_[i] = {1.0f, 0.0f, 0.0f, 0.0f, 0.0f};
    targetCoeffs_[i] = currentCoeffs_[i];
    rampStartCoeffs_[i] = currentCoeffs_[i];
    state_[i][0].reset();
    state_[i][1].reset();
  }
}

void BiquadEQ::setSampleRate(uint32_t sampleRate) {
  sampleRate_ = sampleRate;
  updateCoefficients();
}

void BiquadEQ::setEnabled(bool enabled) {
  bool wasEnabled = enabled_.load(std::memory_order_acquire);
  if (wasEnabled == enabled)
    return;

  if (!enabled) {
    // Ramp to bypass (all-pass) coefficients to avoid click
    std::lock_guard<std::mutex> lock(coeffMutex_);
    rampStartCoeffs_ = currentCoeffs_;
    for (int i = 0; i < kNumBands; ++i)
      targetCoeffs_[i] = {1.0f, 0.0f, 0.0f, 0.0f, 0.0f};
    rampRemaining_ = kRampFrames;
    disabling_ = true;
  } else {
    // Re-enable: ramp from bypass to current gains
    std::lock_guard<std::mutex> lock(coeffMutex_);
    for (int i = 0; i < kNumBands; ++i)
      rampStartCoeffs_[i] = {1.0f, 0.0f, 0.0f, 0.0f, 0.0f};
    for (int i = 0; i < kNumBands; ++i)
      targetCoeffs_[i] =
          computePeakingEQ(kBandFrequencies[i], gains_[i], kDefaultQ,
                           static_cast<float>(sampleRate_));
    rampRemaining_ = kRampFrames;
    disabling_ = false;
    enabled_.store(true, std::memory_order_release);
  }
}

void BiquadEQ::setBandGain(int band, float gainDb) {
  if (band < 0 || band >= kNumBands)
    return;
  gainDb = std::clamp(gainDb, -12.0f, 12.0f);

  {
    std::lock_guard<std::mutex> lock(coeffMutex_);
    gains_[band] = gainDb;
    targetCoeffs_[band] =
        computePeakingEQ(kBandFrequencies[band], gainDb, kDefaultQ,
                         static_cast<float>(sampleRate_));
    makeupGain_ = computeMakeupGain();
  }
  coeffsDirty_.store(true, std::memory_order_release);
}

void BiquadEQ::setBandGains(const float *gains, int count) {
  int n = std::min(count, kNumBands);
  {
    std::lock_guard<std::mutex> lock(coeffMutex_);
    for (int i = 0; i < n; ++i) {
      gains_[i] = std::clamp(gains[i], -12.0f, 12.0f);
      targetCoeffs_[i] =
          computePeakingEQ(kBandFrequencies[i], gains_[i], kDefaultQ,
                           static_cast<float>(sampleRate_));
    }
    makeupGain_ = computeMakeupGain();
  }
  coeffsDirty_.store(true, std::memory_order_release);
}

void BiquadEQ::getBandGains(float *out, int count) const {
  int n = std::min(count, kNumBands);
  for (int i = 0; i < n; ++i)
    out[i] = gains_[i];
}

BiquadCoeffs BiquadEQ::computePeakingEQ(float freq, float gainDb, float q,
                                         float sampleRate) {
  if (std::abs(gainDb) < 0.01f)
    return {1.0f, 0.0f, 0.0f, 0.0f, 0.0f};

  float A = std::pow(10.0f, gainDb / 40.0f);
  float w0 = 2.0f * static_cast<float>(M_PI) * freq / sampleRate;
  float sinW0 = std::sin(w0);
  float cosW0 = std::cos(w0);
  float alpha = sinW0 / (2.0f * q);

  float b0 = 1.0f + alpha * A;
  float b1 = -2.0f * cosW0;
  float b2 = 1.0f - alpha * A;
  float a0 = 1.0f + alpha / A;
  float a1 = -2.0f * cosW0;
  float a2 = 1.0f - alpha / A;

  float invA0 = 1.0f / a0;
  return {b0 * invA0, b1 * invA0, b2 * invA0, a1 * invA0, a2 * invA0};
}

float BiquadEQ::computeMakeupGain() const {
  float maxBoost = 0.0f;
  for (int i = 0; i < kNumBands; ++i) {
    if (gains_[i] > maxBoost)
      maxBoost = gains_[i];
  }
  if (maxBoost <= 0.0f)
    return 1.0f;
  return std::pow(10.0f, -maxBoost / 20.0f);
}

void BiquadEQ::updateCoefficients() {
  std::lock_guard<std::mutex> lock(coeffMutex_);
  for (int i = 0; i < kNumBands; ++i) {
    targetCoeffs_[i] =
        computePeakingEQ(kBandFrequencies[i], gains_[i], kDefaultQ,
                         static_cast<float>(sampleRate_));
  }
  makeupGain_ = computeMakeupGain();
  coeffsDirty_.store(true, std::memory_order_release);
}

void BiquadEQ::process(float *buffer, uint32_t frames, uint32_t channels) {
  if (!enabled_.load(std::memory_order_acquire) && !disabling_)
    return;

  if (frames == 0 || channels == 0 || channels > 2)
    return;

  // Snapshot target coefficients under lock if dirty
  std::array<BiquadCoeffs, kNumBands> localTarget;
  std::array<BiquadCoeffs, kNumBands> localStart;
  int rampAtStart;

  if (coeffsDirty_.exchange(false, std::memory_order_acq_rel)) {
    std::lock_guard<std::mutex> lock(coeffMutex_);
    rampStartCoeffs_ = currentCoeffs_;
    rampRemaining_ = kRampFrames;
  }

  {
    std::lock_guard<std::mutex> lock(coeffMutex_);
    localTarget = targetCoeffs_;
  }
  localStart = rampStartCoeffs_;
  rampAtStart = rampRemaining_;

  float gain = makeupGain_;

  for (int band = 0; band < kNumBands; ++band) {
    BiquadCoeffs c;
    BiquadCoeffs start = localStart[band];
    BiquadCoeffs target = localTarget[band];
    int ramp = rampAtStart;

    for (uint32_t f = 0; f < frames; ++f) {
      if (ramp > 0) {
        float t = 1.0f - static_cast<float>(ramp) /
                             static_cast<float>(kRampFrames);
        c.b0 = start.b0 + (target.b0 - start.b0) * t;
        c.b1 = start.b1 + (target.b1 - start.b1) * t;
        c.b2 = start.b2 + (target.b2 - start.b2) * t;
        c.a1 = start.a1 + (target.a1 - start.a1) * t;
        c.a2 = start.a2 + (target.a2 - start.a2) * t;
        --ramp;
      } else {
        c = target;
      }

      for (uint32_t ch = 0; ch < channels; ++ch) {
        auto &s = state_[band][ch];
        float x = buffer[f * channels + ch];
        float y = c.b0 * x + c.b1 * s.x1 + c.b2 * s.x2 - c.a1 * s.y1 -
                  c.a2 * s.y2;
        s.x2 = s.x1;
        s.x1 = x;
        s.y2 = s.y1;
        s.y1 = y;
        buffer[f * channels + ch] = y;
      }
    }

    currentCoeffs_[band] = c;
  }

  // Update shared ramp counter
  rampRemaining_ = std::max(0, rampAtStart - static_cast<int>(frames));

  // If we finished ramping to bypass, fully disable
  if (disabling_ && rampRemaining_ == 0) {
    enabled_.store(false, std::memory_order_release);
    disabling_ = false;
  }

  // Fixed makeup gain based on max boost — no per-block pumping
  if (gain < 1.0f) {
    uint32_t totalSamples = frames * channels;
    for (uint32_t i = 0; i < totalSamples; ++i) {
      buffer[i] *= gain;
    }
  }
}

} // namespace musix
