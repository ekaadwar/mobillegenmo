import React, { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ButtonVariant } from './AppButton';
import { typography } from '../../theme/typography';
import { useResponsive } from '../../hooks/useResponsive';
import { variants } from '../../theme/boxShadowEmerge';

interface AppBadgeProps {
  label: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
}

export function AppBadge({
  label,
  variant = 'neutral',
  icon,
}: AppBadgeProps) {
  const { r } = useResponsive();
  const palette = variants[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          borderRadius: r(8),
          paddingHorizontal: r(12),
          paddingVertical: r(4),
          gap: r(5),
          boxShadow: palette.boxShadow,
        },
      ]}>
      {icon}
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          { color: palette.color, fontSize: r(12) },
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
  },
  label: {
    fontFamily: typography.medium,
  },
});