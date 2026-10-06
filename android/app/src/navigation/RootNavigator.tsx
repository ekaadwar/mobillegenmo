import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {useAuth} from '../contexts/AuthContext';
import {colors} from '../theme/colors';

import {AuthNavigator} from './AuthNavigator';
import {AppDrawerNavigator} from './AppDrawerNavigator';

export function RootNavigator() {
  const {
    isAuthenticated,
    isBootstrapping,
  } = useAuth();

  if (isBootstrapping) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <AppDrawerNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});