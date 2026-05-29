cmake_minimum_required(VERSION 3.22)
project(musix-audio-engine)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(oboe REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
find_package(ReactAndroid REQUIRED CONFIG)

set(CPP_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../src/cpp")

add_library(musix_audio_engine_jni SHARED
    ${CPP_DIR}/AudioPlayer.cpp
    ${CPP_DIR}/FlacDecoder.cpp
    ${CPP_DIR}/BiquadEQ.cpp
    src/main/cpp/MusixAudioEngineAndroid.cpp
    src/main/cpp/MusixAudioEngineJNI.cpp
)

target_include_directories(musix_audio_engine_jni PRIVATE
    ${CPP_DIR}
    src/main/cpp
)

target_link_libraries(musix_audio_engine_jni
    oboe::oboe
    fbjni::fbjni
    ReactAndroid::reactnative
    android
    log
)
