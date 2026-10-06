import 'react-native-gesture-handler/jestSetup';

// Reanimated's UI-runtime bindings call into native-only worklets APIs that
// are not implemented for the web/test runtime, so stub the installer out.
jest.mock(
  'react-native-gesture-handler/src/handlers/gestures/installUIRuntimeBindings',
  () => ({installUIRuntimeBindings: () => {}}),
);
jest.mock(
  'react-native-gesture-handler/lib/module/handlers/gestures/installUIRuntimeBindings',
  () => ({installUIRuntimeBindings: () => {}}),
);

require('react-native-reanimated').setUpTests();
