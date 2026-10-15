import React, {ReactNode, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {useResponsive} from '../../hooks/useResponsive';

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
  background: string;
  text: string;
  border: string;

  hoverBackground: string;
  hoverText: string;

  activeBackground: string;
  activeText: string;
}

const variants: Record<ButtonVariant, VariantStyle> = {
  primary: {
    background: colors.primary,
    text: colors.white,
    border: 'transparent',
    hoverBackground: colors.primaryHover,
    hoverText: colors.white,
    activeBackground: colors.primaryActive,
    activeText: colors.white,
  },

  danger: {
    background: colors.danger,
    text: colors.white,
    border: 'transparent',
    hoverBackground: colors.dangerHover,
    hoverText: colors.white,
    activeBackground: colors.dangerActive,
    activeText: colors.white,
  },

  warning: {
    background: colors.warning,
    text: colors.white,
    border: 'transparent',
    hoverBackground: colors.warningHover,
    hoverText: colors.warningHoverText,
    activeBackground: colors.warningActive,
    activeText: colors.white,
  },

  success: {
    background: colors.success,
    text: colors.white,
    border: 'transparent',
    hoverBackground: colors.successHover,
    hoverText: colors.successHoverText,
    activeBackground: colors.successActive,
    activeText: colors.white,
  },

  info: {
    background: colors.info,
    text: colors.white,
    border: 'transparent',
    hoverBackground: colors.infoHover,
    hoverText: colors.white,
    activeBackground: colors.infoActive,
    activeText: colors.white,
  },

  neutral: {
    background: colors.neutral,
    text: colors.white,
    border: 'transparent',
    hoverBackground: colors.neutralHover,
    hoverText: colors.white,
    activeBackground: colors.neutralActive,
    activeText: colors.white,
  },

  'primary-outline': {
    background: colors.primaryOutlineBackground,
    text: colors.primary,
    border: colors.primary,
    hoverBackground: colors.primaryHover,
    hoverText: colors.white,
    activeBackground: colors.primaryActive,
    activeText: colors.white,
  },

  'danger-outline': {
    background: colors.dangerOutlineBackground,
    text: colors.danger,
    border: colors.danger,
    hoverBackground: colors.dangerHover,
    hoverText: colors.white,
    activeBackground: colors.dangerActive,
    activeText: colors.white,
  },

  'warning-outline': {
    background: colors.warningOutlineBackground,
    text: colors.warningActive,
    border: colors.warningActive,
    hoverBackground: colors.warningHover,
    hoverText: colors.warningHoverText,
    activeBackground: colors.warningActive,
    activeText: colors.white,
  },

  'success-outline': {
    background: colors.successOutlineBackground,
    text: colors.successActive,
    border: colors.successActive,
    hoverBackground: colors.successHover,
    hoverText: colors.successHoverText,
    activeBackground: colors.successActive,
    activeText: colors.white,
  },

  'info-outline': {
    background: colors.infoOutlineBackground,
    text: colors.infoOutline,
    border: colors.infoOutline,
    hoverBackground: colors.infoHover,
    hoverText: colors.white,
    activeBackground: colors.infoActive,
    activeText: colors.white,
  },

  'neutral-outline': {
    background: colors.neutralOutlineBackground,
    text: colors.neutral,
    border: colors.neutral,
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
  const {r} = useResponsive();
  const measure = responsive ? r : (value: number) => value;
  const [hovered, setHovered] = useState(false);

  const variantStyle = variants[variant];

  const getStateStyle = (pressed: boolean) => {
    if (pressed) {
      return {
        backgroundColor: variantStyle.activeBackground,
        color: variantStyle.activeText,
      };
    }

    if (hovered) {
      return {
        backgroundColor: variantStyle.hoverBackground,
        color: variantStyle.hoverText,
      };
    }

    return {
      backgroundColor: variantStyle.background,
      color: variantStyle.text,
    };
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      hitSlop={iconOnly ? 6 : undefined}
      accessibilityState={{disabled: disabled || loading}}
      disabled={disabled || loading}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({pressed}) => {
        const state = getStateStyle(pressed);

        return [
          styles.button,
          {
            minHeight: measure(48),
            paddingVertical: measure(10),
            paddingHorizontal: measure(compact ? 8 : 20),
            borderRadius: measure(8),
            backgroundColor: state.backgroundColor,
            borderColor: variantStyle.border,
          },
          width === 'full' ? styles.full : styles.auto,
          iconOnly && {
            width: size, height: size, minHeight: size,
            paddingHorizontal: 0, paddingVertical: 0, borderRadius: size / 2,
          },
          (disabled || loading) && styles.disabled,
        ] as ViewStyle[];
      }}>
      {({pressed}) => {
        const state = getStateStyle(pressed);
        const iconSize = measure(16);

        return (
          <View style={[styles.content, {gap: measure(compact ? 4 : 10)}]}>
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