import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  faBars,
} from '@fortawesome/free-solid-svg-icons/faBars';
import {
  faBell,
} from '@fortawesome/free-solid-svg-icons/faBell';
import {
  faUser,
} from '@fortawesome/free-solid-svg-icons/faUser';

import {AppIcon} from '../ui/AppIcon';
import {colors} from '../../theme/colors';
import {useResponsive} from '../../hooks/useResponsive';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export function AppHeader() {
  const {r} = useResponsive();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, {height: r(64) + insets.top, paddingTop: 10 + insets.top, paddingHorizontal: r(12)}]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Menu"
        accessibilityState={{disabled: true}}
        disabled
        style={styles.touchTarget}>
        <AppIcon icon={faBars} size={r(20)} color={colors.textPrimary} />
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifikasi"
          accessibilityState={{disabled: true}}
          disabled
          style={styles.touchTarget}>
          <AppIcon icon={faBell} size={r(22)} color={colors.textPrimary} />
          <View style={[styles.notificationDot, {backgroundColor: colors.warning}]} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profil, foto belum tersedia"
          accessibilityState={{disabled: true}}
          disabled
          style={[styles.avatar, {width: r(32), height: r(32), borderRadius: r(16)}]}>
          <AppIcon icon={faUser} size={r(16)} color={colors.textSecondary} />
          <View style={[styles.onlineDot, {backgroundColor: colors.info}]} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  touchTarget: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  notificationDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 6,
    right: 7,
  },
  onlineDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    right: -1,
    bottom: -1,
    borderWidth: 1,
    borderColor: colors.surface,
  },
});