package com.musix.audioengine

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class MusixAudioEnginePackage : TurboReactPackage() {

    override fun getModule(name: String, context: ReactApplicationContext): NativeModule? {
        return when (name) {
            MusixPlayerModule.NAME -> MusixPlayerModule(context)
            MusixEQModule.NAME -> MusixEQModule(context)
            MusixScannerModule.NAME -> MusixScannerModule(context)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
        mapOf(
            MusixPlayerModule.NAME to ReactModuleInfo(
                MusixPlayerModule.NAME,
                MusixPlayerModule.NAME,
                false, false, false, true
            ),
            MusixEQModule.NAME to ReactModuleInfo(
                MusixEQModule.NAME,
                MusixEQModule.NAME,
                false, false, false, true
            ),
            MusixScannerModule.NAME to ReactModuleInfo(
                MusixScannerModule.NAME,
                MusixScannerModule.NAME,
                false, false, false, true
            ),
        )
    }
}
