import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons/faCalendarDays';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';

import { AppIcon } from '../ui/AppIcon';
import { CarListParams } from '../../types/car';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useResponsive } from '../../hooks/useResponsive';

type YearRange = Pick<CarListParams, 'start_year' | 'end_year'> | null;

export function normalizeYearRange(
  firstYear: number,
  secondYear: number,
): YearRange {
  return {
    start_year: Math.min(firstYear, secondYear),
    end_year: Math.max(firstYear, secondYear),
  };
}

interface YearRangeFilterProps {
  value: YearRange;
  disabled?: boolean;
  onChange: (range: YearRange) => void;
}

export function YearRangeFilter({
  value,
  disabled = false,
  onChange,
}: YearRangeFilterProps) {
  const { r } = useResponsive();
  const [visible, setVisible] = useState(false);
  const [firstYear, setFirstYear] = useState<number | null>(null);
  const currentYear = new Date().getFullYear();
  const minimumYear = 1900;
  const years = Array.from(
    { length: currentYear - minimumYear + 1 },
    (_, index) => currentYear - index,
  );
  const label = value
    ? `${value.start_year} - ${value.end_year}`
    : firstYear
    ? `${firstYear} - Pilih tahun`
    : 'Pilih rentang tahun';

  const selectYear = (year: number) => {
    if (firstYear === null) {
      setFirstYear(year);
      return;
    }
    onChange(normalizeYearRange(firstYear, year));
    setFirstYear(null);
    setVisible(false);
  };

  return (
    <>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Filter tahun, ${label}`}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={() => setVisible(true)}
          style={[styles.trigger, { height: r(36), paddingHorizontal: r(12) }]}
        >
          <AppIcon icon={faCalendarDays} size={r(14)} color={colors.primary} />
          <Text
            numberOfLines={1}
            style={[styles.triggerText, { fontSize: r(11) }]}
          >
            {label}
          </Text>
          <AppIcon
            icon={faChevronDown}
            size={r(12)}
            color={colors.textSecondary}
          />
        </Pressable>
        {value || firstYear !== null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hapus filter tahun"
            disabled={disabled}
            onPress={() => {
              setFirstYear(null);
              onChange(null);
            }}
            hitSlop={8}
            style={styles.clear}
          >
            <Text style={styles.clearText}>Hapus</Text>
          </Pressable>
        ) : null}
      </View>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={[styles.dialog, { padding: r(16) }]}>
            <Text style={[styles.title, { fontSize: r(17) }]}>
              {firstYear === null ? 'Pilih tahun pertama' : 'Pilih tahun kedua'}
            </Text>
            <FlatList
              data={years}
              keyExtractor={year => String(year)}
              numColumns={4}
              initialNumToRender={16}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Tahun ${item}`}
                  onPress={() => selectYear(item)}
                  style={[styles.year, { height: r(44) }]}
                >
                  <Text style={styles.yearText}>{item}</Text>
                </Pressable>
              )}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setFirstYear(null);
                setVisible(false);
              }}
              style={styles.cancel}
            >
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  triggerText: {
    flex: 1,
    color: colors.neutral,
    fontFamily: typography.regular,
  },
  clear: { padding: 8 },
  clearText: {
    color: colors.danger,
    fontFamily: typography.medium,
    fontSize: 12,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.modalOverlay,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    maxHeight: '78%',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.bold,
    marginBottom: 12,
  },
  year: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  yearText: { color: colors.textPrimary, fontFamily: typography.medium },
  cancel: { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 10 },
  cancelText: { color: colors.primary, fontFamily: typography.semiBold },
});
