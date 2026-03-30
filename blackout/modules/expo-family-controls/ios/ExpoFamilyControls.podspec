require 'json'

absolute_react_native_path = ''
if !ENV['REACT_NATIVE_PATH'].nil?
  absolute_react_native_path = File.expand_path(ENV['REACT_NATIVE_PATH'], Pod::Config.instance.project_root)
else
  absolute_react_native_path = File.dirname(`node --print "require.resolve('react-native/package.json')"`)
end

unless defined?(install_modules_dependencies)
  # `install_modules_dependencies` is defined in react_native_pods.rb.
  # When running with `pod ipc spec`, it's not defined and we have to require manually.
  require File.join(absolute_react_native_path, 'scripts/react_native_pods')
end

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
package_owners = package['author'] || package['authors'] || { 'ExpoFamilyControls' => 'dev@localhost' }
package_homepage = package['homepage'] || 'https://github.com/cmcejas/Blackout'

Pod::Spec.new do |s|
  s.name           = 'ExpoFamilyControls'
  # Ensure the compiled Swift module name matches what expo-modules-autolinking
  # generates in ExpoModulesProvider.swift (i.e. `import ExpoFamilyControls`).
  s.module_name    = 'ExpoFamilyControls'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license'] || 'MIT'
  s.author         = package_owners
  s.homepage       = package_homepage
  s.platforms      = { :ios => '18.0' }
  s.swift_version  = '5.9'
  # This pod is shipped with the app as a local path dependency, but CocoaPods
  # still validates that `source` contains a tag for git sources.
  s.source         = { :git => 'https://github.com/expo/expo.git', :tag => "sdk-54.0.0" }
  s.static_framework = true
  s.header_dir     = 'ExpoFamilyControls'

  s.dependency 'ExpoModulesCore'
  install_modules_dependencies(s)

  # Apple frameworks required for Screen Time / Family Controls.
  s.frameworks = 'SwiftUI', 'UIKit', 'FamilyControls', 'ManagedSettings', 'DeviceActivity'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '*.{h,m,mm,swift}'
  s.exclude_files = 'BlackoutMonitor/**/*'
end
