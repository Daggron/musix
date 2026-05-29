package com.musix.audioengine

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.musix.audioengine.NativeEQModuleSpec

class MusixEQModule(context: ReactApplicationContext) :
    NativeEQModuleSpec(context) {

    override fun getName() = NAME

    override fun setEnabled(enabled: Boolean) {
        AudioEngineJNI.nativeSetEQEnabled(enabled)
    }

    override fun setBandGains(gains: ReadableArray) {
        val arr = FloatArray(gains.size()) { gains.getDouble(it).toFloat() }
        AudioEngineJNI.nativeSetBandGains(arr)
    }

    override fun getBandGains(): WritableArray {
        val native = AudioEngineJNI.nativeGetBandGains()
        val result = Arguments.createArray()
        for (v in native) result.pushDouble(v.toDouble())
        return result
    }

    companion object {
        const val NAME = "MusixEQModule"
    }
}
