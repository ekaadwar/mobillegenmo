import React, {PropsWithChildren} from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {colors} from '../../theme/colors';

export function AppCard({children, style}: PropsWithChildren<{style?: StyleProp<ViewStyle>}>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    elevation: 1,
    shadowColor: colors.textPrimary,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
});