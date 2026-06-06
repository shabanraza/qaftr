const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");
const path = require("path");

const monorepoRoot = path.resolve(__dirname, "..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Watch the shared workspace package so hot-reload works across packages
config.watchFolders = [monorepoRoot];

// Let Metro resolve @zatca/shared from the monorepo packages dir
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Alias @zatca/shared -> packages/shared/src
// Alias invoice-app -> invoice-app root (for TRPCRouter type import)
config.resolver.extraNodeModules = {
  "@zatca/shared": path.resolve(monorepoRoot, "packages/shared/src"),
  "invoice-app": path.resolve(monorepoRoot, "invoice-app"),
};

module.exports = withNativewind(config, {
  // inline variables break PlatformColor in CSS variables
  inlineVariables: false,
  globalClassNamePolyfill: false,
});
