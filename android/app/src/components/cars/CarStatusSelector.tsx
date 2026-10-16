import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {faCircle} from '@fortawesome/free-solid-svg-icons/faCircle';
import {AppIcon} from '../ui/AppIcon';
import {CAR_STATUS_OPTIONS, CarStatus} from '../../utils/carForm';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';

const tones: Record<CarStatus, {text: string; background: string}> = {
  ready: {text: colors.success, background: colors.successOutlineBackground},
  reserve: {text: colors.warningActive, background: colors.warningOutlineBackground},
  sold: {text: colors.danger, background: colors.dangerOutlineBackground},
  pending: {text: colors.info, background: colors.infoOutlineBackground},
};

interface CarStatusSelectorProps {
  value: CarStatus | '';
  onChange: (status: CarStatus) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export function CarStatusSelector({value, onChange, required = false, disabled = false, error}: CarStatusSelectorProps) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Status Unit">
      <Text style={styles.label}>
        Status Unit{required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={styles.grid}>
        {CAR_STATUS_OPTIONS.map(option => {
          const selected = option.value === value;
          const tone = selected ? tones[option.value] : {text: colors.neutral, background: colors.neutralOutlineBackground};
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={`Status ${option.label}`}
              accessibilityState={{selected, disabled}}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={[styles.option, {backgroundColor: tone.background}]}>
              <AppIcon icon={faCircle} size={6} color={tone.text} />
              <Text style={[styles.optionText, {color: tone.text}]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {fontFamily: typography.semiBold, fontSize: 14, color: colors.textPrimary, marginBottom: 6},
  required: {color: colors.required},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  option: {flexGrow: 1, flexBasis: '45%', minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 4},
  optionText: {fontFamily: typography.regular, fontSize: 14},
  error: {fontFamily: typography.regular, fontSize: 12, color: colors.error, marginTop: 5},
});
