#import "MusixPlayerModule.h"
#import "MusixAudioEngine.h"

@implementation MusixPlayerModule

RCT_EXPORT_MODULE(MusixPlayerModule)

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (void)loadTrack:(NSString *)filePath
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject {
  BOOL success = [[MusixAudioEngine shared] loadTrack:filePath];
  resolve(@(success));
}

- (void)preloadNext:(NSString *)filePath
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
  BOOL success = [[MusixAudioEngine shared] preloadNext:filePath];
  resolve(@(success));
}

- (void)play {
  [[MusixAudioEngine shared] play];
}

- (void)pause {
  [[MusixAudioEngine shared] pause];
}

- (void)stop {
  [[MusixAudioEngine shared] stop];
}

- (void)seekTo:(double)positionMs {
  [[MusixAudioEngine shared] seekToMs:positionMs];
}

- (NSNumber *)getPositionMs {
  return @([[MusixAudioEngine shared] positionMs]);
}

- (NSNumber *)getDurationMs {
  return @([[MusixAudioEngine shared] durationMs]);
}

- (NSNumber *)getIsPlaying {
  return @([[MusixAudioEngine shared] isPlaying]);
}

- (NSNumber *)hasTrackEnded {
  return @([[MusixAudioEngine shared] hasTrackEnded]);
}

- (void)clearTrackEnded {
  [[MusixAudioEngine shared] clearTrackEnded];
}

- (NSNumber *)hasTrackTransitioned {
  return @([[MusixAudioEngine shared] hasTrackTransitioned]);
}

- (void)clearTrackTransitioned {
  [[MusixAudioEngine shared] clearTrackTransitioned];
}

- (NSNumber *)wasInterrupted {
  return @([[MusixAudioEngine shared] wasInterrupted]);
}

- (void)clearInterrupted {
  [[MusixAudioEngine shared] clearInterrupted];
}

- (NSString *)getDocumentsPath {
  NSArray *paths = NSSearchPathForDirectoriesInDomains(
      NSDocumentDirectory, NSUserDomainMask, YES);
  return paths.firstObject ?: @"";
}

- (void)setNowPlaying:(NSString *)title
               artist:(NSString *)artist
                album:(NSString *)album
          durationSec:(double)durationSec {
  [[MusixAudioEngine shared] setNowPlayingTitle:title
                                         artist:artist
                                          album:album
                                       duration:durationSec];
}

- (void)updateNowPlayingElapsed:(double)elapsedSec rate:(double)rate {
  [[MusixAudioEngine shared] updateNowPlayingElapsed:elapsedSec rate:(float)rate];
}

- (NSNumber *)hasRemotePlay { return @([[MusixAudioEngine shared] hasRemotePlay]); }
- (void)clearRemotePlay { [[MusixAudioEngine shared] clearRemotePlay]; }
- (NSNumber *)hasRemotePause { return @([[MusixAudioEngine shared] hasRemotePause]); }
- (void)clearRemotePause { [[MusixAudioEngine shared] clearRemotePause]; }
- (NSNumber *)hasRemoteNext { return @([[MusixAudioEngine shared] hasRemoteNext]); }
- (void)clearRemoteNext { [[MusixAudioEngine shared] clearRemoteNext]; }
- (NSNumber *)hasRemotePrev { return @([[MusixAudioEngine shared] hasRemotePrev]); }
- (void)clearRemotePrev { [[MusixAudioEngine shared] clearRemotePrev]; }
- (NSNumber *)hasRemoteSeek { return @([[MusixAudioEngine shared] hasRemoteSeek]); }
- (void)clearRemoteSeek { [[MusixAudioEngine shared] clearRemoteSeek]; }
- (NSNumber *)remoteSeekPositionMs { return @([[MusixAudioEngine shared] remoteSeekPositionMs]); }

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativePlayerModuleSpecJSI>(params);
}

@end
