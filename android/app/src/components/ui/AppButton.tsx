import React, { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useResponsive } from '../../hooks/useResponsive';

export type ButtonVariant =
  | 'primary'
  | 'danger'
  | 'warning'
  | 'success'
  | 'info'
  | 'neutral'
  | 'primary-outline'
  | 'danger-outline'
  | 'warning-outline'
  | 'success-outline'
  | 'info-outline'
  | 'neutral-outline';

export type ButtonWidth = 'auto' | 'full';

type IconRenderer = (props: {
  color: string;
  size: number;
}) => ReactNode;

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  width?: ButtonWidth;

  leftIcon?: IconRenderer;
  rightIcon?: IconRenderer;

  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  iconOnly?: boolean;
  size?: 32 | 48;
  responsive?: boolean;
}

interface VariantStyle {
  backgroundColor: string;
  color: string;
  // border: string;
  hoverBackground: string;
  hoverText: string;
  borderWidth?: number;
  borderColor?: string;
  boxShadow?: Array<{
    offsetX: number;
    offsetY: number;
    blurRadius: number;
    spreadDistance: number;
    color: string;
    inset: boolean;
  }>;
  activeBackground: string;
  activeText: string;
}

const variants: Record<ButtonVariant, VariantStyle> = {
  primary: {
    backgroundColor: colors.primary,
    color: colors.white,
    hoverBackground: colors.primaryHover,
    hoverText: colors.white,
    activeBackground: colors.primaryActive,
    activeText: colors.white,
    borderWidth: 1,
    borderColor: 'transparent',
    boxShadow: [
      {
        offsetX: -2,
        offsetY: -2,
        blurRadius: 4,
        spreadDistance: 0,
        color: 'rgba(0, 0, 0, 0.25)',
        inset: true,
      },
      {
        offsetX: 2,
        offsetY: 2,
        blurRadius: 4,
        spreadDistance: 0,
        color: '#653ff3',
        inset: true,
      },
      {
        offsetX: -2,
        offsetY: -2,
        blurRadius: 7,
        spreadDistance: 0,
        color: 'rgba(39, 9, 150, 0.2)',
        inset: false,
      },
      {
        offsetX: 4,
        offsetY: 4,
        blurRadius: 8,
        spreadDistance: 0,
        color: 'rgba(0, 0, 0, 0.25)',
        inset: false,
      },
      {
        offsetX: 1,
        offsetY: 1,
        blurRadius: 2,
        spreadDistance: 0,
        color: 'rgba(0, 0, 0, 0.5)',
        inset: false,
      },
    ]
  },

  danger: {
    backgroundColor: colors.danger,
    color: colors.white,
    // border: 'transparent',
    hoverBackground: colors.dangerHover,
    hoverText: colors.white,
    activeBackground: colors.dangerActive,
    activeText: colors.white,
  },

  warning: {
    backgroundColor: colors.warning,
    color: colors.white,
    // border: 'transparent',
    hoverBackground: colors.warningHover,
    hoverText: colors.warningHoverText,
    activeBackground: colors.warningActive,
    activeText: colors.white,
  },

  success: {
    backgroundColor: colors.success,
    color: colors.white,
    // border: 'transparent',
    hoverBackground: colors.successHover,
    hoverText: colors.successHoverText,
    activeBackground: colors.successActive,
    activeText: colors.white,
  },

  info: {
    backgroundColor: colors.info,
    color: colors.white,
    // border: 'transparent',
    hoverBackground: colors.infoHover,
    hoverText: colors.white,
    activeBackground: colors.infoActive,
    activeText: colors.white,
  },

  neutral: {
    backgroundColor: colors.neutral,
    color: colors.white,
    // border: 'transparent',
    hoverBackground: colors.neutralHover,
    hoverText: colors.white,
    activeBackground: colors.neutralActive,
    activeText: colors.white,
  },

  'primary-outline': {
    backgroundColor: colors.primaryOutlineBackground,
    color: colors.primary,
    // border: colors.primary,
    hoverBackground: colors.primaryHover,
    hoverText: colors.white,
    activeBackground: colors.primaryActive,
    activeText: colors.white,
  },

  'danger-outline': {
    backgroundColor: colors.dangerOutlineBackground,
    color: colors.danger,
    // border: colors.danger,
    hoverBackground: colors.dangerHover,
    hoverText: colors.white,
    activeBackground: colors.dangerActive,
    activeText: colors.white,
  },

  'warning-outline': {
    backgroundColor: colors.warningOutlineBackground,
    color: colors.warningActive,
    // border: colors.warningActive,
    hoverBackground: colors.warningHover,
    hoverText: colors.warningHoverText,
    activeBackground: colors.warningActive,
    activeText: colors.white,
  },

  'success-outline': {
    backgroundColor: colors.successOutlineBackground,
    color: colors.successActive,
    // border: colors.successActive,
    hoverBackground: colors.successHover,
    hoverText: colors.successHoverText,
    activeBackground: colors.successActive,
    activeText: colors.white,
  },

  'info-outline': {
    backgroundColor: colors.infoOutlineBackground,
    color: colors.infoOutline,
    // border: colors.infoOutline,
    hoverBackground: colors.infoHover,
    hoverText: colors.white,
    activeBackground: colors.infoActive,
    activeText: colors.white,
  },

  'neutral-outline': {
    backgroundColor: colors.neutralOutlineBackground,
    color: colors.neutral,
    // border: colors.neutral,
    hoverBackground: colors.neutralHover,
    hoverText: colors.white,
    activeBackground: colors.neutralActive,
    activeText: colors.white,
  },
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  width = 'full',
  leftIcon,
  rightIcon,
  disabled = false,
  loading = false,
  compact = false,
  iconOnly = false,
  size = 48,
  responsive = true,
}: AppButtonProps) {
  const { r } = useResponsive();
  const measure = responsive ? r : (value: number) => value;
  const [hovered, setHovered] = useState(false);

  const variantStyle = variants[variant];

  const getStateStyle = (pressed: boolean) => {
    if (pressed) {
      return {
        backgroundColor: variantStyle.activeBackground,
        color: variantStyle.activeText,
        borderWidth: 1,
        borderColor: 'transparent',
        boxShadow: [
          {
            offsetX: 2,
            offsetY: 2,
            blurRadius: 5,
            spreadDistance: 0,
            color: '#bbc4e4',
            inset: false,
          },
          {
            offsetX: -4,
            offsetY: -4,
            blurRadius: 8,
            spreadDistance: 0,
            color: '#FFFFFF',
            inset: false,
          },
        ],
      };
    }

    if (hovered) {
      return {
        backgroundColor: variantStyle.hoverBackground,
        color: variantStyle.hoverText,
      };
    }

    return {
      // backgroundColor: variantStyle.background,
      // color: variantStyle.text,
      ...variants[variant]
    };
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      hitSlop={iconOnly ? 6 : undefined}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => {
        const state = getStateStyle(pressed);

        return [
          styles.button,
          {
            ...state,
            minHeight: measure(48),
            paddingVertical: measure(10),
            paddingHorizontal: measure(compact ? 8 : 20),
            borderRadius: measure(8),
          },
          width === 'full' ? styles.full : styles.auto,
          iconOnly && {
            width: size, height: size, minHeight: size,
            paddingHorizontal: 0, paddingVertical: 0, borderRadius: size / 2,
          },
          (disabled || loading) && styles.disabled,
        ] as ViewStyle[];
      }}>
      {({ pressed }) => {
        const state = getStateStyle(pressed);
        const iconSize = measure(16);

        return (
          <View style={[styles.content, { gap: measure(compact ? 4 : 10) }]}>
            {loading ? (
              <ActivityIndicator size="small" color={state.color} />
            ) : (
              <>
                {leftIcon?.({
                  color: state.color,
                  size: iconSize,
                })}

                {!iconOnly && <Text
                  style={[
                    styles.text,
                    {
                      color: state.color,
                      fontSize: measure(compact ? 12 : 14),
                    },
                  ]}>
                  {title}
                </Text>}

                {rightIcon?.({
                  color: state.color,
                  size: iconSize,
                })}
              </>
            )}
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  full: {
    width: '100%',
  },

  auto: {
    alignSelf: 'flex-start',
  },

  content: {
    flexDirection: 'row',
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  text: {
    fontFamily: typography.medium,
    flexShrink: 1,
    textAlign: 'center',
  },

  disabled: {
    opacity: 0.55,
  },
});