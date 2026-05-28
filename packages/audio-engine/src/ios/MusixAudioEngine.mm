#import "MusixAudioEngine.h"

#import <AVFoundation/AVFoundation.h>
#import <atomic>
#import <mutex>

#include "FlacDecoder.h"

static const UInt32 kRenderFrameCount = 512;

@implementation MusixAudioEngine {
  AVAudioEngine *_engine;
  AVAudioSourceNode *_sourceNode;
  musix::FlacDecoder _decoder;
  std::mutex _decoderMutex;
  std::atomic<bool> _playing;
  std::atomic<uint64_t> _currentFrame;
  std::atomic<bool> _trackEnded;
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
    _playing.store(false);
    _currentFrame.store(0);
    _trackEnded.store(false);
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
  [self stop];

  std::lock_guard<std::mutex> lock(_decoderMutex);
  if (!_decoder.open(std::string([filePath UTF8String]))) {
    return NO;
  }

  _currentFrame.store(0);
  _trackEnded.store(false);

  [self rebuildSourceNode];
  return YES;
}

- (void)rebuildSourceNode {
  if (_sourceNode) {
    [_engine disconnectNodeOutput:_sourceNode];
    [_engine detachNode:_sourceNode];
    _sourceNode = nil;
  }

  uint32_t sampleRate = _decoder.sampleRate();
  uint32_t channels = _decoder.channels();
  if (sampleRate == 0 || channels == 0) return;

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
  [_engine connect:_sourceNode
                to:_engine.mainMixerNode
            format:format];
}

- (OSStatus)renderFrames:(AVAudioFrameCount)frameCount
                    into:(AudioBufferList *)outputData
               isSilence:(BOOL *)isSilence {
  if (!_playing.load()) {
    *isSilence = YES;
    for (UInt32 i = 0; i < outputData->mNumberBuffers; i++) {
      memset(outputData->mBuffers[i].mData, 0,
             outputData->mBuffers[i].mDataByteSize);
    }
    return noErr;
  }

  float *outBuffer = (float *)outputData->mBuffers[0].mData;

  // dr_flac is not lock-free, but for the hello-sound slice this is acceptable.
  // Phase 3.1 replaces this with a proper lock-free ring buffer.
  std::unique_lock<std::mutex> lock(_decoderMutex, std::try_to_lock);
  if (!lock.owns_lock()) {
    *isSilence = YES;
    memset(outBuffer, 0, frameCount * _decoder.channels() * sizeof(float));
    return noErr;
  }

  uint64_t framesRead = _decoder.readFrames(outBuffer, frameCount);
  _currentFrame.fetch_add(framesRead);

  if (framesRead < frameCount) {
    uint32_t ch = _decoder.channels();
    memset(outBuffer + framesRead * ch, 0,
           (frameCount - framesRead) * ch * sizeof(float));
    if (framesRead == 0) {
      _playing.store(false);
      _trackEnded.store(true);
    }
  }

  *isSilence = NO;
  return noErr;
}

- (void)play {
  if (!_decoder.isOpen()) return;

  NSError *error = nil;
  if (!_engine.isRunning) {
    [_engine startAndReturnError:&error];
    if (error) {
      NSLog(@"[MusixAudioEngine] start error: %@", error);
      return;
    }
  }

  _playing.store(true);
  [self startPositionTimer];
}

- (void)pause {
  _playing.store(false);
  [self stopPositionTimer];
}

- (void)stop {
  _playing.store(false);
  [self stopPositionTimer];

  if (_engine.isRunning) {
    [_engine stop];
  }

  std::lock_guard<std::mutex> lock(_decoderMutex);
  _decoder.close();
  _currentFrame.store(0);
}

- (void)seekToMs:(double)positionMs {
  if (!_decoder.isOpen()) return;

  uint64_t targetFrame =
      (uint64_t)(positionMs / 1000.0 * (double)_decoder.sampleRate());

  std::lock_guard<std::mutex> lock(_decoderMutex);
  if (_decoder.seekToFrame(targetFrame)) {
    _currentFrame.store(targetFrame);
  }
}

- (double)positionMs {
  uint32_t sr = _decoder.sampleRate();
  if (sr == 0) return 0.0;
  return (double)_currentFrame.load() / (double)sr * 1000.0;
}

- (double)durationMs {
  return _decoder.durationMs();
}

- (BOOL)isPlaying {
  return _playing.load();
}

#pragma mark - Position Timer

- (void)startPositionTimer {
  [self stopPositionTimer];
  __weak MusixAudioEngine *weakSelf = self;
  _positionTimer =
      [NSTimer scheduledTimerWithTimeInterval:0.25
                                      repeats:YES
                                        block:^(NSTimer *timer) {
                                          __strong MusixAudioEngine *s = weakSelf;
                                          if (!s) return;
                                          if (s->_trackEnded.exchange(false)) {
                                            s->_playing.store(false);
                                            [s stopPositionTimer];
                                            if (s.onTrackEnd) s.onTrackEnd();
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
