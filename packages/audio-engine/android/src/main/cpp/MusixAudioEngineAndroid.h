#pragma once

#include "AudioPlayer.h"
#include <oboe/Oboe.h>
#include <atomic>
#include <memory>
#include <mutex>
#include <string>

namespace musix {

class MusixAudioEngineAndroid : public oboe::AudioStreamDataCallback,
                                 public oboe::AudioStreamErrorCallback {
public:
  static MusixAudioEngineAndroid &shared();

  bool loadTrack(const std::string &filePath);
  bool preloadNext(const std::string &filePath);
  void play();
  void pause();
  void stop();
  void seekToMs(double positionMs);

  double positionMs() const { return player_.positionMs(); }
  double durationMs() const { return player_.durationMs(); }
  bool isPlaying() const { return player_.isPlaying(); }
  bool isTrackLoaded() const { return player_.isTrackLoaded(); }

  bool hasTrackEnded() const { return player_.hasTrackEnded(); }
  void clearTrackEnded() { player_.clearTrackEnded(); }
  bool hasTrackTransitioned() const { return player_.hasTrackTransitioned(); }
  void clearTrackTransitioned() { player_.clearTrackTransitioned(); }

  bool wasInterrupted() const { return interrupted_.load(); }
  void clearInterrupted() { interrupted_.store(false); }

  BiquadEQ &eq() { return player_.eq(); }

  bool hasRemotePlay() const { return remotePlay_.load(); }
  void clearRemotePlay() { remotePlay_.store(false); }
  bool hasRemotePause() const { return remotePause_.load(); }
  void clearRemotePause() { remotePause_.store(false); }
  bool hasRemoteNext() const { return remoteNext_.load(); }
  void clearRemoteNext() { remoteNext_.store(false); }
  bool hasRemotePrev() const { return remotePrev_.load(); }
  void clearRemotePrev() { remotePrev_.store(false); }
  bool hasRemoteSeek() const { return remoteSeek_.load(); }
  void clearRemoteSeek() { remoteSeek_.store(false); }
  double remoteSeekPositionMs() const { return remoteSeekMs_.load(); }

  void setRemotePlay() { remotePlay_.store(true); }
  void setRemotePause() { remotePause_.store(true); }
  void setRemoteNext() { remoteNext_.store(true); }
  void setRemotePrev() { remotePrev_.store(true); }
  void setRemoteSeek(double ms) {
    remoteSeekMs_.store(ms);
    remoteSeek_.store(true);
  }

  void setInterrupted() {
    if (player_.isPlaying()) {
      player_.pause();
      interrupted_.store(true);
    }
  }

  oboe::DataCallbackResult onAudioReady(oboe::AudioStream *stream,
                                         void *audioData,
                                         int32_t numFrames) override;

  void onErrorAfterClose(oboe::AudioStream *stream,
                         oboe::Result error) override;

private:
  MusixAudioEngineAndroid() = default;

  void rebuildStream();
  void closeStream();

  AudioPlayer player_;
  std::shared_ptr<oboe::AudioStream> stream_;
  std::mutex streamMutex_;

  std::atomic<bool> interrupted_{false};
  std::atomic<bool> remotePlay_{false};
  std::atomic<bool> remotePause_{false};
  std::atomic<bool> remoteNext_{false};
  std::atomic<bool> remotePrev_{false};
  std::atomic<bool> remoteSeek_{false};
  std::atomic<double> remoteSeekMs_{0.0};
};

} // namespace musix
