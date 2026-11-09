const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
  },
};

module.exports = mergeConfig(defaultConfig, config);
