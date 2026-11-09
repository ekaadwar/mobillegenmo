import React, { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { variants } from '../../theme/boxShadowCustom';
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
      ...variants[variant]
    };
  }; 7

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