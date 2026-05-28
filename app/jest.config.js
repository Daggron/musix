module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|@react-native|react-native|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-reanimated|react-native-worklets|react-native-mmkv|@op-engineering|@shopify/react-native-skia)/)',
  ],
};
