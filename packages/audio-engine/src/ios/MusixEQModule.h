#import <Foundation/Foundation.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <MusixAudioEngineSpec/MusixAudioEngineSpec.h>
@interface MusixEQModule : NativeEQModuleSpecBase <NativeEQModuleSpec>
#else
#import <React/RCTBridgeModule.h>
@interface MusixEQModule : NSObject <RCTBridgeModule>
#endif

@end
