const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

// Fix para AWS SDK v3 + Expo
config.resolver.unstable_enablePackageExports = false;
config.resolver.sourceExts = [...config.resolver.sourceExts, "cjs"];

module.exports = config;
