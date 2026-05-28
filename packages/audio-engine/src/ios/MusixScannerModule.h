#import <Foundation/Foundation.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <MusixAudioEngineSpec/MusixAudioEngineSpec.h>
@interface MusixScannerModule : NativeScannerModuleSpecBase <NativeScannerModuleSpec>
#else
#import <React/RCTBridgeModule.h>
@interface MusixScannerModule : NSObject <RCTBridgeModule>
#endif

@end
