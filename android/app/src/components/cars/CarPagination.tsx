import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  faChevronLeft,
} from '@fortawesome/free-solid-svg-icons/faChevronLeft';
import {
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons/faChevronRight';

import {AppIcon} from '../ui/AppIcon';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {useResponsive} from '../../hooks/useResponsive';

interface CarPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perpage: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

export function CarPagination({page, totalPages, total, perpage, disabled = false, onPageChange}: CarPaginationProps) {
  const {r} = useResponsive();
  const first = total === 0 ? 0 : (page - 1) * perpage + 1;
  const last = Math.min(page * perpage, total);
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <View style={[styles.container, {paddingVertical: r(12)}]}>
      <Text style={[styles.summary, {fontSize: r(10)}]}>
        Menampilkan {first}-{last} dari {total} mobil
      </Text>
      <View style={[styles.controls, {height: r(48), paddingHorizontal: r(8)}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Halaman sebelumnya"
          accessibilityState={{disabled: disabled || page <= 1}}
          disabled={disabled || page <= 1}
          onPress={() => onPageChange(Math.max(1, page - 1))}
          style={styles.arrow}>
          <AppIcon icon={faChevronLeft} size={r(15)} color={page <= 1 ? colors.textSecondary : colors.textPrimary} />
        </Pressable>
        <Text accessibilityLabel={`Halaman ${page} dari ${safeTotalPages}`} style={[styles.currentPage, {width: r(36), height: r(36)}]}>
          {page}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Halaman berikutnya"
          accessibilityState={{disabled: disabled || page >= safeTotalPages}}
          disabled={disabled || page >= safeTotalPages}
          onPress={() => onPageChange(Math.min(safeTotalPages, page + 1))}
          style={styles.arrow}>
          <AppIcon icon={faChevronRight} size={r(15)} color={page >= safeTotalPages ? colors.textSecondary : colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {alignItems: 'center'},
  summary: {color: colors.textPrimary, fontFamily: typography.regular, marginBottom: 8},
  controls: {flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 24},
  arrow: {minWidth: 36, minHeight: 40, justifyContent: 'center', alignItems: 'center'},
  currentPage: {overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', borderRadius: 20, color: colors.white, backgroundColor: colors.primary, fontFamily: typography.medium},
});