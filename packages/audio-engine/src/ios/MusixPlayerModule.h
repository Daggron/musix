#import <Foundation/Foundation.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <MusixAudioEngineSpec/MusixAudioEngineSpec.h>
@interface MusixPlayerModule : NativePlayerModuleSpecBase <NativePlayerModuleSpec>
#else
#import <React/RCTBridgeModule.h>
@interface MusixPlayerModule : NSObject <RCTBridgeModule>
#endif

@end
