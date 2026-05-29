#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface MusixAudioEngine : NSObject

+ (instancetype)shared;

- (BOOL)loadTrack:(NSString *)filePath;
- (BOOL)preloadNext:(NSString *)filePath;
- (void)play;
- (void)pause;
- (void)stop;
- (void)seekToMs:(double)positionMs;

- (double)positionMs;
- (double)durationMs;
- (BOOL)isPlaying;

- (BOOL)hasTrackEnded;
- (void)clearTrackEnded;
- (BOOL)hasTrackTransitioned;
- (void)clearTrackTransitioned;
- (BOOL)wasInterrupted;
- (void)clearInterrupted;

- (void)setEQEnabled:(BOOL)enabled;
- (void)setEQBandGains:(const float *)gains count:(int)count;
- (void)getEQBandGains:(float *)out count:(int)count;

- (void)setNowPlayingTitle:(NSString *)title
                    artist:(NSString *)artist
                     album:(NSString *)album
                  duration:(double)durationSec;
- (void)updateNowPlayingElapsed:(double)elapsedSec
                           rate:(float)rate;

- (BOOL)hasRemotePlay;
- (void)clearRemotePlay;
- (BOOL)hasRemotePause;
- (void)clearRemotePause;
- (BOOL)hasRemoteNext;
- (void)clearRemoteNext;
- (BOOL)hasRemotePrev;
- (void)clearRemotePrev;
- (BOOL)hasRemoteSeek;
- (void)clearRemoteSeek;
- (double)remoteSeekPositionMs;

@end

NS_ASSUME_NONNULL_END
