import React, {
  forwardRef,
  ReactNode,
  useState,
} from 'react';

import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputInstance,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import {faEye} from '@fortawesome/free-solid-svg-icons/faEye';
import {faEyeSlash} from '@fortawesome/free-solid-svg-icons/faEyeSlash';

import {AppIcon} from './AppIcon';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {useResponsive} from '../../hooks/useResponsive';

type IconRenderer = (props: {
  color: string;
  size: number;
}) => ReactNode;

interface AppTextInputProps
  extends Omit<TextInputProps, 'secureTextEntry' | 'style'> {
  label?: string;

  required?: boolean;
  disabled?: boolean;

  error?: string;

  leftIcon?: IconRenderer;
  rightIcon?: IconRenderer;
  rightAction?: {label: string; onPress: () => void};

  password?: boolean;

  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const AppTextInput = forwardRef<
  TextInputInstance,
  AppTextInputProps
>(
  (
    {
      label,
      required = false,
      disabled = false,
      error,
      leftIcon,
      rightIcon,
      rightAction,
      password = false,
      containerStyle,
      inputStyle,
      ...textInputProps
    },
    ref,
  ) => {
    const {r} = useResponsive();

    const [passwordVisible, setPasswordVisible] =
      useState(false);

    const iconSize = r(16);

    const renderRightIcon = () => {
      if (password) {
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              passwordVisible
                ? 'Sembunyikan password'
                : 'Tampilkan password'
            }
            hitSlop={r(10)}
            onPress={() =>
              setPasswordVisible(current => !current)
            }>
            <AppIcon
              icon={passwordVisible ? faEyeSlash : faEye}
              size={iconSize}
              color={colors.textSecondary}
            />
          </Pressable>
        );
      }

      if (rightAction && rightIcon) {
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rightAction.label}
            accessibilityState={{disabled}}
            disabled={disabled}
            hitSlop={r(10)}
            onPress={rightAction.onPress}>
            {rightIcon({color: colors.textSecondary, size: iconSize})}
          </Pressable>
        );
      }

      if (rightIcon) {
        return rightIcon({
          color: colors.textSecondary,
          size: iconSize,
        });
      }

      return null;
    };

    return (
      <View style={containerStyle}>
        {label ? (
          <Text
            style={[
              styles.label,
              {
                fontSize: r(14),
                marginBottom: r(6),
              },
            ]}>
            {label}

            {required ? (
              <Text style={styles.required}> *</Text>
            ) : null}
          </Text>
        ) : null}

        <View
          style={[
            styles.inputContainer,
            {
              minHeight: r(48),
              borderRadius: r(8),
              paddingHorizontal: r(14),
              gap: r(12),
            },
            Boolean(error) && styles.errorBorder,
          ]}>
          {leftIcon?.({
            color: colors.textSecondary,
            size: iconSize,
          })}

          <TextInput
            ref={ref}
            {...textInputProps}
            editable={!disabled && textInputProps.editable !== false}
            secureTextEntry={
              password && !passwordVisible
            }
            placeholderTextColor={colors.textSecondary}
            underlineColorAndroid="transparent"
            style={[
              styles.input,
              {
                fontSize: r(14),
              },
              inputStyle,
            ]}
          />

          {renderRightIcon()}
        </View>

        {error ? (
          <Text
            style={[
              styles.error,
              {
                marginTop: r(5),
                fontSize: r(12),
              },
            ]}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

AppTextInput.displayName = 'AppTextInput';

const styles = StyleSheet.create({
  label: {
    color: colors.textPrimary,
    fontFamily: typography.semiBold,
  },

  required: {
    color: colors.required,
  },

  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: colors.inputBackground,

    borderWidth: 1,
    borderColor: colors.inputBorder,
  },

  errorBorder: {
    borderColor: colors.error,
  },

  input: {
    flex: 1,

    color: colors.textPrimary,
    fontFamily: typography.regular,

    paddingVertical: 0,
  },

  error: {
    color: colors.error,
    fontFamily: typography.regular,
  },
});