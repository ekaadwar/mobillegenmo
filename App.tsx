import React from 'react';

import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import {
  AuthProvider,
} from './android/app/src/contexts/AuthContext';

import {
  RootNavigator,
} from './android/app/src/navigation/RootNavigator';

function App() {
  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
      }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;