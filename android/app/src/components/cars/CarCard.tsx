import React, {useEffect, useState} from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  faCarSide,
} from '@fortawesome/free-solid-svg-icons/faCarSide';
import {faCircle} from '@fortawesome/free-solid-svg-icons/faCircle';
import {faPen} from '@fortawesome/free-solid-svg-icons/faPen';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';

import {Car} from '../../types/car';
import {AppBadge} from '../ui/AppBadge';
import {AppButton} from '../ui/AppButton';
import {AppIcon} from '../ui/AppIcon';
import {resolveImageUrl} from '../../services/carService';
import {formatMileage, formatRupiah, statusBadge} from '../../utils/carFormatting';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {useResponsive} from '../../hooks/useResponsive';

interface CarCardProps {
  car: Car;
  onDetail: (car: Car) => void;
  onEdit?: (car: Car) => void;
  onDelete?: (car: Car) => void;
}

function EditIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faPen} size={size} color={color} />;
}

function DeleteIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faTrash} size={size} color={color} />;
}

export function CarCard({car, onDetail, onEdit, onDelete}: CarCardProps) {
  const {r} = useResponsive();
  const imageUrl = resolveImageUrl(
    (car.images.find(image => image.highlight === true) ?? car.images[0])?.url,
  );
  const [imageFailed, setImageFailed] = useState(false);
  const badge = statusBadge(car.status);

  useEffect(() => setImageFailed(false), [imageUrl]);

  return (
    <View style={[styles.card, {borderRadius: r(12), marginBottom: r(16)}]}>
      <View style={[styles.imageFrame, {height: r(198)}]}>
        {imageUrl && !imageFailed ? (
          <Image
            source={{uri: imageUrl}}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
            style={StyleSheet.absoluteFill}
            accessibilityLabel={`Foto ${car.name || 'mobil'}`}
          />
        ) : (
          <View style={styles.imageFallback}>
            <AppIcon icon={faCarSide} size={r(42)} color={colors.textSecondary} />
          </View>
        )}
        <View style={[styles.imageBadges, {padding: r(12)}]}>
          <AppBadge label={car.manufacturer || 'Tidak diketahui'} variant="primary-outline" />
          {badge ? (
            <AppBadge
              label={badge.label}
              variant={car.status?.trim().toLowerCase() === 'ready' ? 'success' : 'neutral'}
            />
          ) : null}
        </View>
      </View>

      <View style={{padding: r(16)}}>
        <Text style={[styles.name, {fontSize: r(15), marginBottom: r(10)}]}>
          {car.name || 'Nama mobil tidak tersedia'}
        </Text>
        <View style={styles.detailsRow}>
          <View style={styles.metadata}>
            <Text style={[styles.metadataText, {fontSize: r(10)}]}>
              {Number.isFinite(car.year) ? car.year : '-'}
            </Text>
            <AppIcon icon={faCircle} size={r(5)} color={colors.neutralHover} />
            <Text style={[styles.metadataText, {fontSize: r(10)}]}>
              {car.transmission?.trim() || '-'}
            </Text>
            <AppIcon icon={faCircle} size={r(5)} color={colors.neutralHover} />
            <Text style={[styles.metadataText, {fontSize: r(10)}]}>
              {formatMileage(car.mileage)}
            </Text>
          </View>
          <Text style={[styles.price, {fontSize: r(14)}]}>
            {formatRupiah(car.price)}
          </Text>
        </View>

        <View style={[styles.buttons, {gap: r(8), marginTop: r(18)}]}>
          <View style={styles.detailButton}>
            <AppButton
              title="Lihat Detail"
              variant="warning"
              compact
              onPress={() => onDetail(car)}
            />
          </View>
          <View style={styles.editButton}>
            <AppButton
              title="Edit"
              variant="primary-outline"
              compact
              leftIcon={EditIcon}
              onPress={() => onEdit?.(car)}
            />
          </View>
          <View style={styles.deleteButton}>
            <AppButton
              title="Delete"
              variant="danger-outline"
              compact
              leftIcon={DeleteIcon}
              onPress={() => onDelete?.(car)}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    elevation: 3,
    shadowColor: colors.textPrimary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  imageFrame: {
    backgroundColor: colors.imagePlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallback: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBadges: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: 6,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flexShrink: 1,
    gap: 3,
  },
  metadataText: {
    color: colors.neutralHover,
    fontFamily: typography.regular,
    flexShrink: 1,
  },
  price: {
    color: colors.primary,
    fontFamily: typography.bold,
    flexShrink: 0,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailButton: {flex: 2.1},
  editButton: {flex: 0.95},
  deleteButton: {flex: 1},
});