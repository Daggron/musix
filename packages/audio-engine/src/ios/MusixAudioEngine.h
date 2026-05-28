#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^MusixTrackEndCallback)(void);
typedef void (^MusixTrackTransitionCallback)(void);
typedef void (^MusixPositionCallback)(double positionMs);

@interface MusixAudioEngine : NSObject

@property (nonatomic, copy, nullable) MusixTrackEndCallback onTrackEnd;
@property (nonatomic, copy, nullable) MusixTrackTransitionCallback onTrackTransition;
@property (nonatomic, copy, nullable) MusixPositionCallback onPositionUpdate;

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

@end

NS_ASSUME_NONNULL_END
