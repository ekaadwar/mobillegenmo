import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SvgXml} from 'react-native-svg';
import icons from '../../../../../assets/catalogIcons.json';
import {AppCard} from '../ui/AppCard';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';

interface CarSpecificationCardProps {
  icon: keyof typeof icons;
  label: string;
  value: string | null;
  caption?: string | null;
  description?: boolean;
}

export function CarSpecificationCard({icon, label, value, caption, description}: CarSpecificationCardProps) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.icon}>
        <SvgXml xml={icons[icon]} width={18} height={18} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={description ? styles.description : styles.value}>{value?.trim() || '-'}</Text>
        {caption?.trim() ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {flex: 1, padding: 8, flexDirection: 'row', gap: 10},
  icon: {width: 32, height: 32, borderRadius: 8, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center'},
  content: {flex: 1, minWidth: 0, gap: 4, paddingVertical: 4},
  label: {fontFamily: typography.regular, fontSize: 10, color: colors.textSecondary},
  value: {fontFamily: typography.semiBold, fontSize: 14, color: colors.textPrimary},
  caption: {fontFamily: typography.regular, fontSize: 10, lineHeight: 18, color: colors.textSecondary},
  description: {fontFamily: typography.regular, fontSize: 10, lineHeight: 22, color: colors.textSecondary},
});