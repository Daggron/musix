#include "MusixAudioEngineAndroid.h"
#include <jni.h>
#include <string>

using Engine = musix::MusixAudioEngineAndroid;

static std::string jstringToStd(JNIEnv *env, jstring jstr) {
  if (!jstr) return "";
  const char *chars = env->GetStringUTFChars(jstr, nullptr);
  std::string result(chars);
  env->ReleaseStringUTFChars(jstr, chars);
  return result;
}

extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeLoadTrack(JNIEnv *env,
                                                           jclass,
                                                           jstring filePath) {
  return Engine::shared().loadTrack(jstringToStd(env, filePath));
}

JNIEXPORT jboolean JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativePreloadNext(JNIEnv *env,
                                                             jclass,
                                                             jstring filePath) {
  return Engine::shared().preloadNext(jstringToStd(env, filePath));
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativePlay(JNIEnv *, jclass) {
  Engine::shared().play();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativePause(JNIEnv *, jclass) {
  Engine::shared().pause();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeStop(JNIEnv *, jclass) {
  Engine::shared().stop();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeSeekTo(JNIEnv *, jclass,
                                                        jdouble positionMs) {
  Engine::shared().seekToMs(positionMs);
}

JNIEXPORT jdouble JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeGetPositionMs(JNIEnv *,
                                                               jclass) {
  return Engine::shared().positionMs();
}

JNIEXPORT jdouble JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeGetDurationMs(JNIEnv *,
                                                               jclass) {
  return Engine::shared().durationMs();
}

JNIEXPORT jboolean JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeGetIsPlaying(JNIEnv *,
                                                              jclass) {
  return Engine::shared().isPlaying();
}

JNIEXPORT jboolean JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeHasTrackEnded(JNIEnv *,
                                                               jclass) {
  return Engine::shared().hasTrackEnded();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeClearTrackEnded(JNIEnv *,
                                                                 jclass) {
  Engine::shared().clearTrackEnded();
}

JNIEXPORT jboolean JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeHasTrackTransitioned(
    JNIEnv *, jclass) {
  return Engine::shared().hasTrackTransitioned();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeClearTrackTransitioned(
    JNIEnv *, jclass) {
  Engine::shared().clearTrackTransitioned();
}

JNIEXPORT jboolean JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeWasInterrupted(JNIEnv *,
                                                                jclass) {
  return Engine::shared().wasInterrupted();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeClearInterrupted(JNIEnv *,
                                                                  jclass) {
  Engine::shared().clearInterrupted();
}

// EQ

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeSetEQEnabled(JNIEnv *,
                                                              jclass,
                                                              jboolean enabled) {
  Engine::shared().eq().setEnabled(enabled);
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeSetBandGains(JNIEnv *env,
                                                              jclass,
                                                              jfloatArray gains) {
  jsize len = env->GetArrayLength(gains);
  auto *data = env->GetFloatArrayElements(gains, nullptr);
  Engine::shared().eq().setBandGains(data, static_cast<int>(len));
  env->ReleaseFloatArrayElements(gains, data, JNI_ABORT);
}

JNIEXPORT jfloatArray JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeGetBandGains(JNIEnv *env,
                                                              jclass) {
  float out[10] = {};
  Engine::shared().eq().getBandGains(out, 10);
  jfloatArray result = env->NewFloatArray(10);
  env->SetFloatArrayRegion(result, 0, 10, out);
  return result;
}

// Remote command flags

JNIEXPORT jboolean JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeHasRemotePlay(JNIEnv *,
                                                               jclass) {
  return Engine::shared().hasRemotePlay();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeClearRemotePlay(JNIEnv *,
                                                                 jclass) {
  Engine::shared().clearRemotePlay();
}

JNIEXPORT jboolean JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeHasRemotePause(JNIEnv *,
                                                                jclass) {
  return Engine::shared().hasRemotePause();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeClearRemotePause(JNIEnv *,
                                                                  jclass) {
  Engine::shared().clearRemotePause();
}

JNIEXPORT jboolean JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeHasRemoteNext(JNIEnv *,
                                                               jclass) {
  return Engine::shared().hasRemoteNext();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeClearRemoteNext(JNIEnv *,
                                                                 jclass) {
  Engine::shared().clearRemoteNext();
}

JNIEXPORT jboolean JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeHasRemotePrev(JNIEnv *,
                                                               jclass) {
  return Engine::shared().hasRemotePrev();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeClearRemotePrev(JNIEnv *,
                                                                 jclass) {
  Engine::shared().clearRemotePrev();
}

JNIEXPORT jboolean JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeHasRemoteSeek(JNIEnv *,
                                                               jclass) {
  return Engine::shared().hasRemoteSeek();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeClearRemoteSeek(JNIEnv *,
                                                                 jclass) {
  Engine::shared().clearRemoteSeek();
}

JNIEXPORT jdouble JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeRemoteSeekPositionMs(
    JNIEnv *, jclass) {
  return Engine::shared().remoteSeekPositionMs();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeSetInterrupted(JNIEnv *,
                                                                jclass) {
  Engine::shared().setInterrupted();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeSetRemotePlay(JNIEnv *,
                                                               jclass) {
  Engine::shared().setRemotePlay();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeSetRemotePause(JNIEnv *,
                                                                jclass) {
  Engine::shared().setRemotePause();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeSetRemoteNext(JNIEnv *,
                                                               jclass) {
  Engine::shared().setRemoteNext();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeSetRemotePrev(JNIEnv *,
                                                               jclass) {
  Engine::shared().setRemotePrev();
}

JNIEXPORT void JNICALL
Java_com_musix_audioengine_AudioEngineJNI_nativeSetRemoteSeek(JNIEnv *,
                                                               jclass,
                                                               jdouble ms) {
  Engine::shared().setRemoteSeek(ms);
}

} // extern "C"
