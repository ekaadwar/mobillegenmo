import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import {faCar} from '@fortawesome/free-solid-svg-icons/faCar';
import {faPen} from '@fortawesome/free-solid-svg-icons/faPen';
import {faQrcode} from '@fortawesome/free-solid-svg-icons/faQrcode';
import {faShieldHalved} from '@fortawesome/free-solid-svg-icons/faShieldHalved';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';
import {AppBadge} from '../../components/ui/AppBadge';
import {AppButton} from '../../components/ui/AppButton';
import {AppCard} from '../../components/ui/AppCard';
import {AppIcon} from '../../components/ui/AppIcon';
import {CarImageGallery} from '../../components/cars/CarImageGallery';
import {CarSpecificationCard} from '../../components/cars/CarSpecificationCard';
import {useResponsive} from '../../hooks/useResponsive';
import {CatalogStackParamList} from '../../navigation/types';
import {getCar, updateCarImageHighlight} from '../../services/carService';
import {CarDetail, CarImage} from '../../types/car';
import {formatMileage, formatRupiah, formatValidityPeriod} from '../../utils/carFormatting';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';

function EditIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faPen} color={color} size={size} />;
}

function QrIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faQrcode} color={color} size={size} />;
}

function DeleteIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faTrash} color={color} size={size} />;
}

export function CarDetailScreen({route, navigation}: NativeStackScreenProps<CatalogStackParamList, 'CarDetail'>) {
  const {carId} = route.params;
  const {width, contentWidth, fontScale} = useResponsive();
  const [car, setCar] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const highlightRequest = useRef<AbortController | null>(null);
  const stackColumns = width < 350 || fontScale > 1.3;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setSaving(false);
    setCar(null);
    setError(null);
    getCar(carId, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) {
          setCar(result);
        }
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Detail mobil gagal dimuat.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => {
      controller.abort();
      highlightRequest.current?.abort();
      highlightRequest.current = null;
    };
  }, [carId, retry]);

  const changeHighlight = async (image: CarImage) => {
    if (highlightRequest.current) {
      return;
    }
    const controller = new AbortController();
    highlightRequest.current = controller;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCarImageHighlight(image.id, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      setCar(previous => previous ? {...previous, images: previous.images.map(item => item.id === updated.id ? updated : item)} : previous);
      const refreshed = await getCar(carId, controller.signal);
      if (!controller.signal.aborted) {
        setCar(refreshed);
      }
    } catch (requestError: unknown) {
      if (!controller.signal.aborted) {
        setError(requestError instanceof Error ? requestError.message : 'Highlight foto gagal diperbarui.');
      }
    } finally {
      if (!controller.signal.aborted) {
        highlightRequest.current = null;
        setSaving(false);
      }
    }
  };

  const openLogout = () => navigation.navigate('Logout');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.content, {width: Math.min(contentWidth, width - 32)}]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Kembali ke Daftar Mobil" onPress={() => navigation.goBack()} style={styles.back}>
          <AppIcon icon={faArrowLeft} size={16} color={colors.textPrimary} />
          <Text style={styles.backText}>Kembali ke Daftar Mobil</Text>
        </Pressable>
        {loading ? <ActivityIndicator accessibilityLabel="Memuat detail mobil" color={colors.primary} style={styles.loading} /> : null}
        {error ? <View style={styles.error} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Coba Lagi" onPress={() => setRetry(value => value + 1)} responsive={false} />
        </View> : null}
        {car ? <>
          <CarImageGallery key={car.id} images={car.images} name={car.name} updating={saving} onHighlight={changeHighlight} onEdit={openLogout} />
          <AppCard>
            <AppBadge label={`${car.manufacturer || '-'} - ${Number.isFinite(car.year) ? car.year : '-'}`} variant="primary-outline" icon={<AppIcon icon={faCar} color={colors.primary} size={12} />} />
            <Text style={styles.name}>{car.name || 'Nama mobil tidak tersedia'}</Text>
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>HARGA OTR SPESIAL</Text>
              <Text style={styles.price}>{formatRupiah(car.price)}</Text>
            </View>
          </AppCard>
          <View style={styles.specifications}>
            <Text style={styles.heading}>Spesifikasi Lengkap</Text>
            <View style={[styles.specRow, stackColumns && styles.stacked]}>
              <CarSpecificationCard icon="mileage" label="Jarak Tempuh" value={formatMileage(car.mileage)} />
              <CarSpecificationCard icon="transmission" label="Transmisi" value={car.transmission} />
            </View>
            <View style={[styles.specRow, stackColumns && styles.stacked]}>
              <CarSpecificationCard icon="fuel" label="Bahan Bakar" value={car.fuel} />
              <CarSpecificationCard icon="color" label="Warna Unit" value={car.color} />
            </View>
            <CarSpecificationCard icon="registration_number" label="Nomor Polisi & Pajak" value={car.registration_number} caption={formatValidityPeriod(car.validity_period)} />
            <CarSpecificationCard icon="showroom_name" label="Lokasi Showroom" value={car.showroom_name} caption={car.showroom_address} />
            <CarSpecificationCard icon="description" label="Deskripsi Kendaraan" value={car.description} description />
          </View>
          <AppCard style={styles.actions}>
            <View style={styles.actionHeading}><AppIcon icon={faShieldHalved} size={16} color={colors.primary} /><Text style={styles.heading}>Aksi Kelola Unit</Text></View>
            <View style={[styles.actionRow, stackColumns && styles.stacked]}>
              <View style={styles.action}><AppButton title="Edit Mobil" variant="warning" leftIcon={EditIcon} responsive={false} compact onPress={openLogout} /></View>
              <View style={styles.action}><AppButton title="Brosur / QR" variant="info-outline" leftIcon={QrIcon} responsive={false} compact onPress={openLogout} /></View>
            </View>
            <AppButton title="Hapus Unit dari Katalog" variant="danger-outline" leftIcon={DeleteIcon} responsive={false} onPress={openLogout} />
          </AppCard>
        </> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  scrollContent: {paddingBottom: 20},
  content: {alignSelf: 'center', gap: 20},
  back: {flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingTop: 12},
  backText: {fontFamily: typography.semiBold, fontSize: 14, color: colors.textPrimary, flexShrink: 1},
  loading: {marginVertical: 48},
  error: {gap: 12},
  errorText: {fontFamily: typography.regular, fontSize: 14, color: colors.danger},
  name: {fontFamily: typography.bold, fontSize: 24, lineHeight: 34, color: colors.textPrimary, marginVertical: 10},
  priceBlock: {backgroundColor: colors.background, padding: 8, borderRadius: 8, gap: 4},
  priceLabel: {fontFamily: typography.regular, fontSize: 14, color: colors.neutralHover},
  price: {fontFamily: typography.bold, fontSize: 26, color: colors.primary, flexShrink: 1},
  heading: {fontFamily: typography.semiBold, fontSize: 16, color: colors.textPrimary, flexShrink: 1},
  specifications: {gap: 4},
  specRow: {flexDirection: 'row', gap: 4},
  actions: {gap: 8},
  actionHeading: {flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4},
  actionRow: {flexDirection: 'row', gap: 8},
  action: {flex: 1},
  stacked: {flexDirection: 'column'},
});