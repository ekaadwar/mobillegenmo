import React from 'react';
import {Modal, StyleSheet, Text, View} from 'react-native';
import {AppButton, ButtonVariant} from './AppButton';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';

interface ConfirmationModalProps {
  visible: boolean;
  message: string;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  message,
  confirmLabel,
  confirmVariant = 'primary',
  cancelLabel = 'Batal',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={loading ? undefined : onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityRole="alert">
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <View style={styles.action}>
              <AppButton title={cancelLabel} variant="neutral" responsive={false} disabled={loading} onPress={onCancel} />
            </View>
            <View style={styles.action}>
              <AppButton title={confirmLabel} variant={confirmVariant} responsive={false} loading={loading} onPress={onConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, paddingTop: 80, paddingHorizontal: 10, backgroundColor: colors.modalOverlay},
  dialog: {width: '100%', maxWidth: 480, alignSelf: 'center', gap: 12, padding: 20, borderRadius: 8, backgroundColor: colors.surface},
  message: {fontFamily: typography.regular, fontSize: 14, lineHeight: 22, textAlign: 'center', color: colors.textSecondary},
  actions: {flexDirection: 'row', gap: 8},
  action: {flex: 1},
});
