#import "MusixAudioEngine.h"

#import <AVFoundation/AVFoundation.h>
#import <cstring>

#include "AudioPlayer.h"

@implementation MusixAudioEngine {
  AVAudioEngine *_engine;
  AVAudioSourceNode *_sourceNode;
  musix::AudioPlayer _player;
  NSTimer *_positionTimer;
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
    [self configureAudioSession];
    [self setupEngine];
  }
  return self;
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
               interleaved:YES];

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
                                 isSilence:isSilence];
         }];

  [_engine attachNode:_sourceNode];
  [_engine connect:_sourceNode to:_engine.mainMixerNode format:format];
}

- (OSStatus)renderFrames:(AVAudioFrameCount)frameCount
                    into:(AudioBufferList *)outputData
               isSilence:(BOOL *)isSilence {
  float *outBuffer = (float *)outputData->mBuffers[0].mData;

  uint32_t framesRead = _player.pullAudio(outBuffer, frameCount);

  if (framesRead < frameCount) {
    uint32_t ch = _player.channels();
    if (ch == 0) ch = 1;
    std::memset(outBuffer + framesRead * ch, 0,
                (frameCount - framesRead) * ch * sizeof(float));
  }

  *isSilence = (framesRead == 0);
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
  [self startPositionTimer];
}

- (void)pause {
  _player.pause();
  [self stopPositionTimer];
}

- (void)stop {
  [self stopPlayback];
}

- (void)stopPlayback {
  _player.stop();
  [self stopPositionTimer];

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

#pragma mark - Position Timer

- (void)startPositionTimer {
  [self stopPositionTimer];
  __weak MusixAudioEngine *weakSelf = self;
  _positionTimer = [NSTimer
      scheduledTimerWithTimeInterval:0.25
                             repeats:YES
                               block:^(NSTimer *timer) {
                                 __strong MusixAudioEngine *s = weakSelf;
                                 if (!s)
                                   return;
                                 if (s->_player.hasTrackEnded()) {
                                   s->_player.clearTrackEnded();
                                   [s stopPositionTimer];
                                   if (s.onTrackEnd)
                                     s.onTrackEnd();
                                   return;
                                 }
                                 if (s.onPositionUpdate) {
                                   s.onPositionUpdate([s positionMs]);
                                 }
                               }];
}

- (void)stopPositionTimer {
  [_positionTimer invalidate];
  _positionTimer = nil;
}

@end
