package com.musix.audioengine

object AudioEngineJNI {
    init {
        System.loadLibrary("musix_audio_engine_jni")
    }

    @JvmStatic external fun nativeLoadTrack(filePath: String): Boolean
    @JvmStatic external fun nativePreloadNext(filePath: String): Boolean
    @JvmStatic external fun nativePlay()
    @JvmStatic external fun nativePause()
    @JvmStatic external fun nativeStop()
    @JvmStatic external fun nativeSeekTo(positionMs: Double)
    @JvmStatic external fun nativeGetPositionMs(): Double
    @JvmStatic external fun nativeGetDurationMs(): Double
    @JvmStatic external fun nativeGetIsPlaying(): Boolean
    @JvmStatic external fun nativeHasTrackEnded(): Boolean
    @JvmStatic external fun nativeClearTrackEnded()
    @JvmStatic external fun nativeHasTrackTransitioned(): Boolean
    @JvmStatic external fun nativeClearTrackTransitioned()
    @JvmStatic external fun nativeWasInterrupted(): Boolean
    @JvmStatic external fun nativeClearInterrupted()
    @JvmStatic external fun nativeSetInterrupted()

    @JvmStatic external fun nativeSetEQEnabled(enabled: Boolean)
    @JvmStatic external fun nativeSetBandGains(gains: FloatArray)
    @JvmStatic external fun nativeGetBandGains(): FloatArray

    @JvmStatic external fun nativeHasRemotePlay(): Boolean
    @JvmStatic external fun nativeClearRemotePlay()
    @JvmStatic external fun nativeHasRemotePause(): Boolean
    @JvmStatic external fun nativeClearRemotePause()
    @JvmStatic external fun nativeHasRemoteNext(): Boolean
    @JvmStatic external fun nativeClearRemoteNext()
    @JvmStatic external fun nativeHasRemotePrev(): Boolean
    @JvmStatic external fun nativeClearRemotePrev()
    @JvmStatic external fun nativeHasRemoteSeek(): Boolean
    @JvmStatic external fun nativeClearRemoteSeek()
    @JvmStatic external fun nativeRemoteSeekPositionMs(): Double

    @JvmStatic external fun nativeSetRemotePlay()
    @JvmStatic external fun nativeSetRemotePause()
    @JvmStatic external fun nativeSetRemoteNext()
    @JvmStatic external fun nativeSetRemotePrev()
    @JvmStatic external fun nativeSetRemoteSeek(ms: Double)
}
