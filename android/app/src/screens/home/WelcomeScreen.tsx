import React, {useState} from 'react';

import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  AppButton,
} from '../../components/ui/AppButton';

import {useAuth} from '../../contexts/AuthContext';
import {useResponsive} from '../../hooks/useResponsive';

import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';

export function WelcomeScreen() {
  const {logout} = useAuth();

  const {
    height,
    r,
    contentWidth,
  } = useResponsive();

  const insets = useSafeAreaInsets();

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);

      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.screen,
          {
            minHeight:
              height -
              insets.top -
              insets.bottom,

            paddingTop:
              insets.top + r(16),

            paddingBottom:
              insets.bottom + r(16),
          },
        ]}>
        <View
          style={[
            styles.card,
            {
              width: contentWidth,

              borderRadius: r(8),

              paddingHorizontal: r(20),
              paddingVertical: r(34),
            },
          ]}>
          <Text
            style={[
              styles.title,
              {
                fontSize: r(27),
              },
            ]}>
            Selamat!
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                marginTop: r(4),
                marginBottom: r(28),

                fontSize: r(14),
              },
            ]}>
            Anda telah berhasil Login.
          </Text>

          <AppButton
            title="Logout"
            variant="primary"
            width="full"
            loading={isLoggingOut}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: colors.background,
  },

  card: {
    backgroundColor: colors.surface,

    elevation: 10,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },

  title: {
    textAlign: 'center',

    color: colors.textPrimary,

    fontFamily: typography.bold,
  },

  subtitle: {
    textAlign: 'center',

    color: colors.textSecondary,

    fontFamily: typography.regular,
  },
});