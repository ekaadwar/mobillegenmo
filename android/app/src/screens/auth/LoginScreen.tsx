import React, {
  useRef,
  useState,
} from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInputInstance,
  View,
} from 'react-native';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faLock } from '@fortawesome/free-solid-svg-icons/faLock';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';

import { AppIcon } from '../../components/ui/AppIcon';
import {
  AppButton,
} from '../../components/ui/AppButton';

import {
  AppTextInput,
} from '../../components/ui/AppTextInput';

import { useAuth } from '../../contexts/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';

import {
  ApiError,
} from '../../services/authService';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface LoginErrors {
  username?: string;
  password?: string;
  form?: string;
}

interface LoginIconProps {
  color: string;
  size: number;
}

function UsernameIcon({ color, size }: LoginIconProps) {
  return <AppIcon icon={faUser} size={size} color={color} />;
}

function PasswordIcon({ color, size }: LoginIconProps) {
  return <AppIcon icon={faLock} size={size} color={color} />;
}

function LoginArrowIcon({ color, size }: LoginIconProps) {
  return <AppIcon icon={faArrowRight} size={size} color={color} />;
}

export function LoginScreen() {
  const { login } = useAuth();

  const {
    height,
    r,
    contentWidth,
  } = useResponsive();

  const insets = useSafeAreaInsets();

  const passwordRef =
    useRef<TextInputInstance>(null);

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [errors, setErrors] =
    useState<LoginErrors>({});

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const validate = () => {
    const nextErrors: LoginErrors = {};

    if (!username.trim()) {
      nextErrors.username =
        'Username wajib diisi.';
    }

    if (!password) {
      nextErrors.password =
        'Password wajib diisi.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (isSubmitting) {
      return;
    }

    const valid = validate();

    if (!valid) {
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await login({
        username: username.trim(),
        password,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          form: error.message,
        });

        return;
      }

      setErrors({
        form:
          'Terjadi kesalahan. Silakan coba kembali.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
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
              borderRadius: r(18),
              paddingHorizontal: r(20),
              paddingVertical: r(20),
            },
          ]}>
          <Text
            style={[
              styles.title,
              {
                fontSize: r(27),
              },
            ]}>
            Login
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                fontSize: r(14),
                lineHeight: r(21),
                marginTop: r(4),
                marginBottom: r(34),
              },
            ]}>
            Masuk untuk mengelola katalog dan data
            {'\n'}
            Mobil Legend
          </Text>

          <AppTextInput
            label="USERNAME"
            required
            value={username}
            placeholder="Masukkan username"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            error={errors.username}
            onChangeText={value => {
              setUsername(value);

              if (errors.username || errors.form) {
                setErrors(current => ({
                  ...current,
                  username: undefined,
                  form: undefined,
                }));
              }
            }}
            onSubmitEditing={() => {
              passwordRef.current?.focus();
            }}
            leftIcon={UsernameIcon}
          />

          <View
            style={{
              height: r(20),
            }}
          />

          <AppTextInput
            ref={passwordRef}
            label="PASSWORD"
            required
            password
            value={password}
            placeholder="Masukkan password"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            error={errors.password}
            onChangeText={value => {
              setPassword(value);

              if (errors.password || errors.form) {
                setErrors(current => ({
                  ...current,
                  password: undefined,
                  form: undefined,
                }));
              }
            }}
            onSubmitEditing={handleLogin}
            leftIcon={PasswordIcon}
          />

          {errors.form ? (
            <Text
              style={[
                styles.formError,
                {
                  fontSize: r(12),
                  marginTop: r(12),
                },
              ]}>
              {errors.form}
            </Text>
          ) : null}

          <View
            style={{
              height: r(32),
            }}
          />

          <AppButton
            title="Masuk"
            variant="primary"
            width="full"
            loading={isSubmitting}
            onPress={handleLogin}
            rightIcon={LoginArrowIcon}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: colors.background,
  },

  card: {
    backgroundColor: colors.background,
    elevation: 10,
    boxShadow: [
      // Drop Shadow 1
      {
        offsetX: -6,
        offsetY: -6,
        blurRadius: 25,
        spreadDistance: 0,
        color: '#FFFFFF',
      },
      // Drop Shadow 2
      {
        offsetX: -4,
        offsetY: -4,
        blurRadius: 6,
        spreadDistance: 0,
        color: '#FFFFFF',
      },
      // Drop Shadow 3
      {
        offsetX: 4,
        offsetY: 4,
        blurRadius: 4,
        spreadDistance: 0,
        color: 'rgba(0, 0, 0, 0.2)',
      },
    ]
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

  formError: {
    color: colors.error,
    fontFamily: typography.regular,
    textAlign: 'center',
  },
});