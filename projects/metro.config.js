// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
    // [Web-only] The following is required to post-process CSS
    isCSSEnabled: true,
});

// Mock 'burnt' to avoid "Unable to resolve" error when native="mobile" is not used but the library imports it.
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
};

const { withTamagui } = require('@tamagui/metro-plugin');
module.exports = withTamagui(config, {
    components: ['tamagui'],
    config: './tamagui.config.ts',
    outputCSS: './tamagui.css',
});
