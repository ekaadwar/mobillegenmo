module.exports = {
  preset: '@react-native/jest-preset',
  resolver: 'react-native-reanimated/jest/resolver',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@fortawesome|react-native-gesture-handler|react-native-reanimated|react-native-worklets|react-native-safe-area-context|react-native-screens|react-native-keychain|react-native-drawer-layout)/)',
  ],
};
