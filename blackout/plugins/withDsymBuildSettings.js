const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Expo config plugin that sets DEBUG_INFORMATION_FORMAT to 'dwarf-with-dsym'
 * for all build configurations in the Xcode project and all Pod targets.
 *
 * This ensures dSYM files are generated for React.framework,
 * ReactNativeDependencies.framework, and hermes.framework, preventing
 * "Upload Symbols Failed" warnings when submitting to App Store Connect.
 */
const withDsymBuildSettings = (config) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;

    // Apply to all build configurations in the main project
    const buildConfigurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in buildConfigurations) {
      const buildConfig = buildConfigurations[key];
      if (buildConfig && buildConfig.buildSettings) {
        buildConfig.buildSettings['DEBUG_INFORMATION_FORMAT'] = '"dwarf-with-dsym"';
      }
    }

    return config;
  });
};

module.exports = withDsymBuildSettings;
