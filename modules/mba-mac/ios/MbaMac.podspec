Pod::Spec.new do |s|
  s.name           = 'MbaMac'
  s.version        = '1.0.0'
  s.summary        = 'isiOSAppOnMac for 92MBA'
  s.homepage       = 'https://github.com/mohamadalhabib92/92mba'
  s.license        = 'MIT'
  s.author         = '92MBA'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '*.swift'
end
