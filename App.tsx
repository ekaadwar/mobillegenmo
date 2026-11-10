import React from 'react';
import { StyleSheet } from 'react-native';

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
      style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;