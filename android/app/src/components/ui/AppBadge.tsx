import React, {ReactNode} from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {ButtonVariant} from './AppButton';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {useResponsive} from '../../hooks/useResponsive';

interface AppBadgeProps {
  label: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
}

const badgeColors: Record<ButtonVariant, {background: string; text: string; border: string}> = {
  primary: {background: colors.primary, text: colors.white, border: colors.primary},
  danger: {background: colors.danger, text: colors.white, border: colors.danger},
  warning: {background: colors.warning, text: colors.white, border: colors.warning},
  success: {background: colors.success, text: colors.white, border: colors.success},
  info: {background: colors.info, text: colors.white, border: colors.info},
  neutral: {background: colors.neutral, text: colors.white, border: colors.neutral},
  'primary-outline': {background: colors.surface, text: colors.primary, border: colors.primary},
  'danger-outline': {background: colors.dangerOutlineBackground, text: colors.danger, border: colors.danger},
  'warning-outline': {background: colors.warningOutlineBackground, text: colors.warningActive, border: colors.warningActive},
  'success-outline': {background: colors.successOutlineBackground, text: colors.successActive, border: colors.successActive},
  'info-outline': {background: colors.infoOutlineBackground, text: colors.infoOutline, border: colors.infoOutline},
  'neutral-outline': {background: colors.neutralOutlineBackground, text: colors.neutral, border: colors.neutral},
};

export function AppBadge({
  label,
  variant = 'neutral',
  icon,
}: AppBadgeProps) {
  const {r} = useResponsive();
  const palette = badgeColors[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          borderRadius: r(8),
          paddingHorizontal: r(12),
          paddingVertical: r(4),
          gap: r(5),
        },
      ]}>
      {icon}
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {color: palette.text, fontSize: r(12)},
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontFamily: typography.medium,
  },
});