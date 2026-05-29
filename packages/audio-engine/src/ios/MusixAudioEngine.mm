#import "MusixAudioEngine.h"

#import <AVFoundation/AVFoundation.h>
#import <MediaPlayer/MediaPlayer.h>
#import <cstring>
#import <vector>

#include "AudioPlayer.h"

@implementation MusixAudioEngine {
  AVAudioEngine *_engine;
  AVAudioSourceNode *_sourceNode;
  musix::AudioPlayer _player;
  BOOL _interrupted;
  BOOL _playingBeforeInterruption;

  BOOL _remotePlay;
  BOOL _remotePause;
  BOOL _remoteNext;
  BOOL _remotePrev;
  BOOL _remoteSeek;
  double _remoteSeekPositionMs;
}

+ (instancetype)shared {
  static MusixAudioEngine *instance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [[MusixAudioEngine alloc] init];
  });
  return instance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _interrupted = NO;
    _playingBeforeInterruption = NO;
    _remotePlay = NO;
    _remotePause = NO;
    _remoteNext = NO;
    _remotePrev = NO;
    _remoteSeek = NO;
    _remoteSeekPositionMs = 0;
    [self configureAudioSession];
    [self setupEngine];
    [self observeNotifications];
    [self registerRemoteCommands];
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)configureAudioSession {
  NSError *error = nil;
  AVAudioSession *session = [AVAudioSession sharedInstance];
  [session setCategory:AVAudioSessionCategoryPlayback
                  mode:AVAudioSessionModeDefault
               options:0
                 error:&error];
  [session setActive:YES error:&error];
}

- (void)setupEngine {
  _engine = [[AVAudioEngine alloc] init];
}

- (BOOL)loadTrack:(NSString *)filePath {
  [self stopPlayback];

  if (!_player.loadTrack(std::string([filePath UTF8String]))) {
    return NO;
  }

  [self rebuildSourceNode];
  return YES;
}

- (BOOL)preloadNext:(NSString *)filePath {
  return _player.preloadNext(std::string([filePath UTF8String]));
}

- (void)rebuildSourceNode {
  if (_sourceNode) {
    [_engine disconnectNodeOutput:_sourceNode];
    [_engine detachNode:_sourceNode];
    _sourceNode = nil;
  }

  uint32_t sampleRate = _player.sampleRate();
  uint32_t channels = _player.channels();
  if (sampleRate == 0 || channels == 0)
    return;

  AVAudioFormat *format = [[AVAudioFormat alloc]
      initWithCommonFormat:AVAudioPCMFormatFloat32
                sampleRate:(double)sampleRate
                  channels:channels
               interleaved:NO];

  __weak MusixAudioEngine *weakSelf = self;

  _sourceNode = [[AVAudioSourceNode alloc]
      initWithFormat:format
         renderBlock:^OSStatus(
             BOOL *_Nonnull isSilence,
             const AudioTimeStamp *_Nonnull timestamp,
             AVAudioFrameCount frameCount,
             AudioBufferList *_Nonnull outputData) {
           __strong MusixAudioEngine *strongSelf = weakSelf;
           if (!strongSelf) {
             *isSilence = YES;
             return noErr;
           }
           return [strongSelf renderFrames:frameCount
                                      into:outputData
                                 isSilence:isSilence
                                  channels:channels];
         }];

  [_engine attachNode:_sourceNode];
  [_engine connect:_sourceNode to:_engine.mainMixerNode format:format];
}

- (OSStatus)renderFrames:(AVAudioFrameCount)frameCount
                    into:(AudioBufferList *)outputData
               isSilence:(BOOL *)isSilence
                channels:(uint32_t)channels {
  // pullAudio returns interleaved data; deinterleave into the output buffers
  std::vector<float> interleaved(frameCount * channels);
  uint32_t framesRead = _player.pullAudio(interleaved.data(), frameCount);

  if (framesRead == 0) {
    for (uint32_t ch = 0; ch < outputData->mNumberBuffers; ch++) {
      std::memset(outputData->mBuffers[ch].mData, 0,
                  frameCount * sizeof(float));
    }
    *isSilence = YES;
    return noErr;
  }

  for (uint32_t ch = 0; ch < outputData->mNumberBuffers && ch < channels;
       ch++) {
    float *dst = (float *)outputData->mBuffers[ch].mData;
    for (uint32_t f = 0; f < framesRead; f++) {
      dst[f] = interleaved[f * channels + ch];
    }
    if (framesRead < frameCount) {
      std::memset(dst + framesRead, 0,
                  (frameCount - framesRead) * sizeof(float));
    }
  }

  *isSilence = NO;
  return noErr;
}

- (void)play {
  if (!_player.isTrackLoaded())
    return;

  NSError *error = nil;
  if (!_engine.isRunning) {
    [_engine startAndReturnError:&error];
    if (error) {
      NSLog(@"[MusixAudioEngine] start error: %@", error);
      return;
    }
  }

  _player.play();
}

- (void)pause {
  _player.pause();
}

- (void)stop {
  [self stopPlayback];
}

- (void)stopPlayback {
  _player.stop();

  if (_engine.isRunning) {
    [_engine stop];
  }
}

- (void)seekToMs:(double)positionMs {
  _player.seekToMs(positionMs);
}

- (double)positionMs {
  return _player.positionMs();
}

- (double)durationMs {
  return _player.durationMs();
}

- (BOOL)isPlaying {
  return _player.isPlaying();
}

- (BOOL)hasTrackEnded {
  return _player.hasTrackEnded();
}

- (void)clearTrackEnded {
  _player.clearTrackEnded();
}

- (BOOL)hasTrackTransitioned {
  return _player.hasTrackTransitioned();
}

- (void)clearTrackTransitioned {
  _player.clearTrackTransitioned();
}

- (BOOL)wasInterrupted {
  return _interrupted;
}

- (void)clearInterrupted {
  _interrupted = NO;
}

#pragma mark - Audio Session Notifications

- (void)observeNotifications {
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc addObserver:self
         selector:@selector(handleInterruption:)
             name:AVAudioSessionInterruptionNotification
           object:nil];
  [nc addObserver:self
         selector:@selector(handleRouteChange:)
             name:AVAudioSessionRouteChangeNotification
           object:nil];
}

- (void)handleInterruption:(NSNotification *)notification {
  NSDictionary *info = notification.userInfo;
  AVAudioSessionInterruptionType type =
      (AVAudioSessionInterruptionType)[info[AVAudioSessionInterruptionTypeKey] unsignedIntegerValue];

  if (type == AVAudioSessionInterruptionTypeBegan) {
    _playingBeforeInterruption = _player.isPlaying();
    if (_playingBeforeInterruption) {
      _player.pause();
      _interrupted = YES;
    }
  } else if (type == AVAudioSessionInterruptionTypeEnded) {
    AVAudioSessionInterruptionOptions options =
        (AVAudioSessionInterruptionOptions)[info[AVAudioSessionInterruptionOptionKey] unsignedIntegerValue];
    if (_playingBeforeInterruption &&
        (options & AVAudioSessionInterruptionOptionShouldResume)) {
      NSError *error = nil;
      [[AVAudioSession sharedInstance] setActive:YES error:&error];
      if (!_engine.isRunning) {
        [_engine startAndReturnError:&error];
      }
      _player.play();
      _interrupted = NO;
    }
  }
}

- (void)setEQEnabled:(BOOL)enabled {
  _player.eq().setEnabled(enabled);
}

- (void)setEQBandGains:(const float *)gains count:(int)count {
  _player.eq().setBandGains(gains, count);
}

- (void)getEQBandGains:(float *)out count:(int)count {
  _player.eq().getBandGains(out, count);
}

- (void)handleRouteChange:(NSNotification *)notification {
  NSDictionary *info = notification.userInfo;
  AVAudioSessionRouteChangeReason reason =
      (AVAudioSessionRouteChangeReason)[info[AVAudioSessionRouteChangeReasonKey] unsignedIntegerValue];

  if (reason == AVAudioSessionRouteChangeReasonOldDeviceUnavailable) {
    if (_player.isPlaying()) {
      _player.pause();
      _interrupted = YES;
    }
  }
}

#pragma mark - Remote Commands

- (void)registerRemoteCommands {
  MPRemoteCommandCenter *cc = [MPRemoteCommandCenter sharedCommandCenter];

  [cc.playCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    self->_remotePlay = YES;
    return MPRemoteCommandHandlerStatusSuccess;
  }];

  [cc.pauseCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    self->_remotePause = YES;
    return MPRemoteCommandHandlerStatusSuccess;
  }];

  [cc.togglePlayPauseCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    if (self->_player.isPlaying()) {
      self->_remotePause = YES;
    } else {
      self->_remotePlay = YES;
    }
    return MPRemoteCommandHandlerStatusSuccess;
  }];

  [cc.nextTrackCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    self->_remoteNext = YES;
    return MPRemoteCommandHandlerStatusSuccess;
  }];

  [cc.previousTrackCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    self->_remotePrev = YES;
    return MPRemoteCommandHandlerStatusSuccess;
  }];

  [cc.changePlaybackPositionCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    MPChangePlaybackPositionCommandEvent *posEvent = (MPChangePlaybackPositionCommandEvent *)event;
    self->_remoteSeekPositionMs = posEvent.positionTime * 1000.0;
    self->_remoteSeek = YES;
    return MPRemoteCommandHandlerStatusSuccess;
  }];
}

#pragma mark - Now Playing Info

- (void)setNowPlayingTitle:(NSString *)title
                    artist:(NSString *)artist
                     album:(NSString *)album
                  duration:(double)durationSec {
  NSMutableDictionary *info = [NSMutableDictionary dictionary];
  info[MPMediaItemPropertyTitle] = title ?: @"";
  info[MPMediaItemPropertyArtist] = artist ?: @"";
  info[MPMediaItemPropertyAlbumTitle] = album ?: @"";
  info[MPMediaItemPropertyPlaybackDuration] = @(durationSec);
  info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = @(0);
  info[MPNowPlayingInfoPropertyPlaybackRate] = @(_player.isPlaying() ? 1.0 : 0.0);
  [MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo = info;
}

- (void)updateNowPlayingElapsed:(double)elapsedSec rate:(float)rate {
  NSMutableDictionary *info =
      [[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo mutableCopy];
  if (!info) return;
  info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = @(elapsedSec);
  info[MPNowPlayingInfoPropertyPlaybackRate] = @(rate);
  [MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo = info;
}

#pragma mark - Remote Command Flags

- (BOOL)hasRemotePlay { return _remotePlay; }
- (void)clearRemotePlay { _remotePlay = NO; }
- (BOOL)hasRemotePause { return _remotePause; }
- (void)clearRemotePause { _remotePause = NO; }
- (BOOL)hasRemoteNext { return _remoteNext; }
- (void)clearRemoteNext { _remoteNext = NO; }
- (BOOL)hasRemotePrev { return _remotePrev; }
- (void)clearRemotePrev { _remotePrev = NO; }
- (BOOL)hasRemoteSeek { return _remoteSeek; }
- (void)clearRemoteSeek { _remoteSeek = NO; }
- (double)remoteSeekPositionMs { return _remoteSeekPositionMs; }

@end
