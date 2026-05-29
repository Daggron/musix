#import "MusixEQModule.h"
#import "MusixAudioEngine.h"

@implementation MusixEQModule

RCT_EXPORT_MODULE(MusixEQModule)

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (void)setEnabled:(BOOL)enabled {
  [[MusixAudioEngine shared] setEQEnabled:enabled];
}

- (void)setBandGains:(NSArray *)gains {
  float values[10] = {};
  NSInteger count = MIN(gains.count, 10);
  for (NSInteger i = 0; i < count; i++) {
    values[i] = [gains[i] floatValue];
  }
  [[MusixAudioEngine shared] setEQBandGains:values count:(int)count];
}

- (NSArray *)getBandGains {
  float values[10] = {};
  [[MusixAudioEngine shared] getEQBandGains:values count:10];
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:10];
  for (int i = 0; i < 10; i++) {
    [result addObject:@(values[i])];
  }
  return result;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeEQModuleSpecJSI>(params);
}

@end
