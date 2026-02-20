const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// expo-sqlite web support requires .wasm files to be treated as assets
config.resolver.assetExts.push('wasm');

module.exports = withNativeWind(config, { input: "./app/global.css" });
