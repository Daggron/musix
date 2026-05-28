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

@end

NS_ASSUME_NONNULL_END
