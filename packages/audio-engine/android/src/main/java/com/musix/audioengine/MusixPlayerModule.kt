package com.musix.audioengine

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.musix.audioengine.NativePlayerModuleSpec

class MusixPlayerModule(context: ReactApplicationContext) :
    NativePlayerModuleSpec(context) {

    override fun getName() = NAME

    override fun loadTrack(filePath: String, promise: Promise) {
        val ok = AudioEngineJNI.nativeLoadTrack(filePath)
        promise.resolve(ok)
    }

    override fun preloadNext(filePath: String, promise: Promise) {
        val ok = AudioEngineJNI.nativePreloadNext(filePath)
        promise.resolve(ok)
    }

    override fun play() = AudioEngineJNI.nativePlay()
    override fun pause() = AudioEngineJNI.nativePause()
    override fun stop() = AudioEngineJNI.nativeStop()
    override fun seekTo(positionMs: Double) = AudioEngineJNI.nativeSeekTo(positionMs)

    override fun getPositionMs(): Double = AudioEngineJNI.nativeGetPositionMs()
    override fun getDurationMs(): Double = AudioEngineJNI.nativeGetDurationMs()
    override fun getIsPlaying(): Boolean = AudioEngineJNI.nativeGetIsPlaying()

    override fun hasTrackEnded(): Boolean = AudioEngineJNI.nativeHasTrackEnded()
    override fun clearTrackEnded() = AudioEngineJNI.nativeClearTrackEnded()
    override fun hasTrackTransitioned(): Boolean = AudioEngineJNI.nativeHasTrackTransitioned()
    override fun clearTrackTransitioned() = AudioEngineJNI.nativeClearTrackTransitioned()
    override fun wasInterrupted(): Boolean = AudioEngineJNI.nativeWasInterrupted()
    override fun clearInterrupted() = AudioEngineJNI.nativeClearInterrupted()

    override fun getDocumentsPath(): String {
        return reactApplicationContext.getExternalFilesDir(null)?.absolutePath ?: ""
    }

    override fun setNowPlaying(title: String, artist: String, album: String, durationSec: Double) {
        // Android MediaSession handled separately if needed
    }

    override fun updateNowPlayingElapsed(elapsedSec: Double, rate: Double) {
        // Android MediaSession handled separately if needed
    }

    override fun hasRemotePlay(): Boolean = AudioEngineJNI.nativeHasRemotePlay()
    override fun clearRemotePlay() = AudioEngineJNI.nativeClearRemotePlay()
    override fun hasRemotePause(): Boolean = AudioEngineJNI.nativeHasRemotePause()
    override fun clearRemotePause() = AudioEngineJNI.nativeClearRemotePause()
    override fun hasRemoteNext(): Boolean = AudioEngineJNI.nativeHasRemoteNext()
    override fun clearRemoteNext() = AudioEngineJNI.nativeClearRemoteNext()
    override fun hasRemotePrev(): Boolean = AudioEngineJNI.nativeHasRemotePrev()
    override fun clearRemotePrev() = AudioEngineJNI.nativeClearRemotePrev()
    override fun hasRemoteSeek(): Boolean = AudioEngineJNI.nativeHasRemoteSeek()
    override fun clearRemoteSeek() = AudioEngineJNI.nativeClearRemoteSeek()
    override fun remoteSeekPositionMs(): Double = AudioEngineJNI.nativeRemoteSeekPositionMs()

    companion object {
        const val NAME = "MusixPlayerModule"
    }
}
