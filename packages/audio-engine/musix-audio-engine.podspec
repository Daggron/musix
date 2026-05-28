require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name            = "musix-audio-engine"
  s.version         = package["version"]
  s.summary         = "Native audio engine for Musix"
  s.homepage        = "https://github.com/musix/audio-engine"
  s.license         = "MIT"
  s.author          = "Musix"
  s.platforms       = { :ios => "15.1" }
  s.source          = { :git => "https://github.com/musix/audio-engine.git", :tag => s.version }
  s.source_files    = "src/ios/**/*.{h,m,mm}", "src/cpp/**/*.{h,cpp}"
  s.frameworks      = "AVFoundation", "AudioToolbox"

  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/src/cpp\""
  }

  install_modules_dependencies(s)
end
