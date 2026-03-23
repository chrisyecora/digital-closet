const { withXcodeProject } = require('expo/config-plugins');

module.exports = function withDisableUserScriptSandboxing(config) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const buildConfigurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const uuid in buildConfigurations) {
      const configuration = buildConfigurations[uuid];
      if (typeof configuration === 'object' && configuration.buildSettings) {
        configuration.buildSettings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO';
      }
    }
    return config;
  });
};