import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import {faCalendarDays} from '@fortawesome/free-solid-svg-icons/faCalendarDays';
import {faCamera} from '@fortawesome/free-solid-svg-icons/faCamera';
import {faCar} from '@fortawesome/free-solid-svg-icons/faCar';
import {faImages} from '@fortawesome/free-solid-svg-icons/faImages';
import {AppButton} from '../../components/ui/AppButton';
import {AppCard} from '../../components/ui/AppCard';
import {AppIcon} from '../../components/ui/AppIcon';
import {AppTextInput} from '../../components/ui/AppTextInput';
import {ConfirmationModal} from '../../components/ui/ConfirmationModal';
import {CarImageCarousel} from '../../components/cars/CarImageCarousel';
import {CarStatusSelector} from '../../components/cars/CarStatusSelector';
import {CatalogStackParamList} from '../../navigation/types';
import {getCar, updateCar, updateCarImageHighlight} from '../../services/carService';
import {CarImage} from '../../types/car';
import {
  buildCarImagesFormData,
  buildCarUpdateFormData,
  buildRemoveImagesFormData,
  CarFormErrors,
  CarFormValues,
  carToFormValues,
  digitsOnly,
  formatDateInput,
  formatThousands,
  MAX_CAR_IMAGES,
  validateCarForm,
} from '../../utils/carForm';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';

type TextField = Exclude<keyof CarFormValues, 'status'>;

interface FieldConfig {
  key: TextField;
  label: string;
  required?: boolean;
  numeric?: boolean;
  multiline?: boolean;
  calendar?: boolean;
  placeholder?: string;
}

const PRIMARY_FIELDS: FieldConfig[] = [
  {key: 'name', label: 'Nama Mobil', required: true},
  {key: 'manufacturer', label: 'Pabrikan', required: true},
  {key: 'year', label: 'Tahun', required: true, numeric: true, calendar: true, placeholder: 'YYYY'},
  {key: 'price', label: 'Harga Mobil (Rp)', required: true, numeric: true},
];

const SECONDARY_FIELDS: FieldConfig[] = [
  {key: 'validity_period', label: 'Masa Berlaku', numeric: true, calendar: true, placeholder: 'DD/MM/YYYY'},
  {key: 'mileage', label: 'Jarak Tempuh (Km)', numeric: true},
  {key: 'transmission', label: 'Transmisi'},
  {key: 'fuel', label: 'Bahan Bakar'},
  {key: 'color', label: 'Warna Unit'},
  {key: 'showroom_name', label: 'Lokasi Showroom'},
  {key: 'showroom_address', label: 'Alamat Showroom', multiline: true},
  {key: 'description', label: 'Deskripsi', multiline: true},
];

const EMPTY_VALUES: CarFormValues = {
  name: '', manufacturer: '', year: '', price: '', status: '', validity_period: '', mileage: '',
  transmission: '', fuel: '', color: '', showroom_name: '', showroom_address: '', description: '',
};

export function formatFieldInput(key: TextField, value: string): string {
  switch (key) {
    case 'year':
      return digitsOnly(value, 4);
    case 'price':
    case 'mileage':
      return formatThousands(value);
    case 'validity_period':
      return formatDateInput(value);
    default:
      return value;
  }
}

type PendingAction = {type: 'save'} | {type: 'delete'; image: CarImage} | {type: 'highlight'; image: CarImage};

const MODAL_COPY = {
  save: {message: 'Apakah Anda yakin akan melakukan perubahan data?', confirmLabel: 'Ya', variant: 'primary'},
  delete: {message: 'Apakah Anda yakin ingin menghapus gambar ini?', confirmLabel: 'Hapus', variant: 'danger'},
  highlight: {message: 'Apakah Anda yakin menjadikan gambar ini sebagai highlight?', confirmLabel: 'Ya', variant: 'primary'},
} as const;

function CameraIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faCamera} color={color} size={size} />;
}

function CalendarIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faCalendarDays} color={color} size={size} />;
}

export function CarFormScreen({route, navigation}: NativeStackScreenProps<CatalogStackParamList, 'CarForm'>) {
  const {carId, car: initialCar, source} = route.params;
  const [values, setValues] = useState<CarFormValues>(() => (initialCar ? carToFormValues(initialCar) : EMPTY_VALUES));
  const [images, setImages] = useState<CarImage[]>(initialCar?.images ?? []);
  const [ready, setReady] = useState(Boolean(initialCar));
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<CarFormErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const dirty = useRef(false);
  const changed = useRef(false);
  const mutation = useRef<AbortController | null>(null);
  const backLabel = source === 'detail' ? 'Kembali ke Detail Katalog' : 'Kembali ke Katalog';

  useEffect(() => {
    const controller = new AbortController();
    setLoadingDetails(true);
    setMessage(null);
    getCar(carId, controller.signal)
      .then(detail => {
        if (controller.signal.aborted) {
          return;
        }
        setImages(detail.images);
        // A manual refresh always restores the unit's stored values; the initial load keeps user edits.
        if (reloadKey > 0 || !dirty.current) {
          dirty.current = false;
          setErrors({});
          setValues(carToFormValues(detail));
        }
        setReady(true);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setMessage(error instanceof Error ? error.message : 'Data mobil gagal dimuat.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingDetails(false);
          setRefreshing(false);
        }
      });
    return () => controller.abort();
  }, [carId, reloadKey]);

  useEffect(() => () => mutation.current?.abort(), []);

  const leave = () => {
    if (source === 'detail' && changed.current) {
      navigation.popTo('CarDetail', {carId, refreshKey: Date.now()});
    } else {
      navigation.goBack();
    }
  };

  const setField = (key: TextField) => (value: string) => {
    dirty.current = true;
    setValues(previous => ({...previous, [key]: formatFieldInput(key, value)}));
    setErrors(previous => ({...previous, [key]: undefined}));
  };

  const requestSave = () => {
    const nextErrors = validateCarForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage('Periksa kembali data yang wajib diisi.');
      return;
    }
    setMessage(null);
    setPending({type: 'save'});
  };

  const requestHighlight = (image: CarImage) => {
    if (!image.highlight) {
      setPending({type: 'highlight', image});
    }
  };

  const requestAddImages = () => {
    const remaining = MAX_CAR_IMAGES - images.length;
    if (mutation.current || pending || loadingDetails || remaining <= 0) {
      return;
    }
    const controller = new AbortController();
    mutation.current = controller;
    setSubmitting(true);
    setMessage(null);
    let selected = false;

    const finish = () => {
      if (!controller.signal.aborted) {
        mutation.current = null;
        setSubmitting(false);
        setUploading(false);
      }
    };

    const addImages = async (sourceType: 'camera' | 'library') => {
      selected = true;
      if (controller.signal.aborted) {
        return;
      }
      try {
        const result = sourceType === 'camera'
          ? await launchCamera({mediaType: 'photo', cameraType: 'back', saveToPhotos: false})
          : await launchImageLibrary({mediaType: 'photo', selectionLimit: remaining});
        if (controller.signal.aborted || result.didCancel) {
          return;
        }
        if (result.errorCode) {
          const pickerErrors = {
            camera_unavailable: 'Kamera tidak tersedia pada perangkat ini.',
            permission: 'Akses foto atau kamera ditolak. Periksa izin aplikasi di pengaturan perangkat.',
            others: 'Foto gagal dibuka. Silakan coba lagi.',
          };
          throw new Error(pickerErrors[result.errorCode]);
        }
        const assets = result.assets ?? [];
        if (assets.length === 0) {
          return;
        }
        if (assets.length > remaining) {
          throw new Error(`Maksimal ${MAX_CAR_IMAGES} foto per unit. Anda dapat menambahkan ${remaining} foto lagi.`);
        }
        const photos = assets.map((asset, index) => {
          if (!asset.uri || !asset.type?.startsWith('image/')) {
            throw new Error('File foto tidak valid. Silakan pilih gambar lain.');
          }
          return {uri: asset.uri, type: asset.type, name: asset.fileName || `unit-${Date.now()}-${index}`};
        });
        setUploading(true);
        const updated = await updateCar(carId, buildCarImagesFormData(photos), controller.signal);
        if (!controller.signal.aborted) {
          changed.current = true;
          setImages(updated.images);
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setMessage(error instanceof Error ? error.message : 'Foto gagal diunggah. Silakan coba lagi.');
        }
      } finally {
        finish();
      }
    };

    Alert.alert('Tambah Foto Unit', 'Pilih sumber foto', [
      {text: 'Batal', style: 'cancel', onPress: finish},
      {text: 'Kamera', onPress: () => addImages('camera')},
      {text: 'Galeri', onPress: () => addImages('library')},
    ], {cancelable: true, onDismiss: () => { if (!selected) { finish(); } }});
  };

  const confirm = async () => {
    if (!pending || mutation.current) {
      return;
    }
    const controller = new AbortController();
    mutation.current = controller;
    setSubmitting(true);
    setMessage(null);
    try {
      if (pending.type === 'save') {
        const updated = await updateCar(carId, buildCarUpdateFormData(values), controller.signal);
        if (controller.signal.aborted) {
          return;
        }
        changed.current = true;
        dirty.current = false;
        setImages(updated.images);
        setValues(carToFormValues(updated));
        setPending(null);
        leave();
      } else if (pending.type === 'delete') {
        const updated = await updateCar(carId, buildRemoveImagesFormData([pending.image.id]), controller.signal);
        if (controller.signal.aborted) {
          return;
        }
        changed.current = true;
        setImages(updated.images);
        setPending(null);
      } else {
        const updated = await updateCarImageHighlight(pending.image.id, controller.signal);
        if (controller.signal.aborted) {
          return;
        }
        changed.current = true;
        setImages(previous => previous.map(image => ({...image, highlight: image.id === updated.id})));
        setPending(null);
      }
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        setPending(null);
        setMessage(error instanceof Error ? error.message : 'Perubahan gagal disimpan.');
      }
    } finally {
      if (!controller.signal.aborted) {
        mutation.current = null;
        setSubmitting(false);
      }
    }
  };

  const renderField = ({key, label, required, numeric, multiline, calendar, placeholder}: FieldConfig) => (
    <AppTextInput
      key={key}
      label={label}
      accessibilityLabel={label}
      required={required}
      value={values[key]}
      onChangeText={setField(key)}
      error={errors[key]}
      disabled={submitting}
      placeholder={placeholder}
      keyboardType={numeric ? 'number-pad' : 'default'}
      multiline={multiline}
      rightIcon={calendar ? CalendarIcon : undefined}
    />
  );

  const modal = pending ? MODAL_COPY[pending.type] : null;

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            enabled={!submitting}
            colors={[colors.primary]}
            onRefresh={() => {
              if (mutation.current) {
                return;
              }
              setRefreshing(true);
              setReloadKey(key => key + 1);
            }}
          />
        }>
        <View style={styles.content}>
          <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={leave} style={[styles.back, styles.inset]}>
            <AppIcon icon={faArrowLeft} size={16} color={colors.textPrimary} />
            <Text style={styles.backText}>{backLabel}</Text>
          </Pressable>

          {message ? (
            <View accessibilityRole="alert" style={[styles.inset, styles.alert]}>
              <Text style={styles.alertText}>{message}</Text>
              {!ready ? <AppButton title="Coba Lagi" responsive={false} onPress={() => setReloadKey(key => key + 1)} /> : null}
            </View>
          ) : null}

          {!ready && !message ? <ActivityIndicator accessibilityLabel="Memuat data mobil" color={colors.primary} style={styles.loading} /> : null}

          {ready ? <>
            <View style={styles.imageSection}>
              <View style={[styles.sectionLabel, styles.inset]}>
                <AppIcon icon={faImages} size={16} color={colors.primary} />
                <Text style={styles.imageLabel}>Foto Unit ({images.length} dari {MAX_CAR_IMAGES})</Text>
              </View>
              {images.length > 0 ? (
                <CarImageCarousel
                  images={images}
                  name={values.name}
                  disabled={submitting}
                  onDelete={image => setPending({type: 'delete', image})}
                  onHighlight={requestHighlight}
                />
              ) : null}
              <View style={styles.inset}>
                <AppButton
                  title="Tambah Foto Unit"
                  variant="warning"
                  leftIcon={CameraIcon}
                  responsive={false}
                  loading={uploading}
                  disabled={submitting || loadingDetails || refreshing || images.length >= MAX_CAR_IMAGES}
                  onPress={requestAddImages}
                />
              </View>
            </View>

            <AppCard style={[styles.inset, styles.form]}>
              <View style={styles.sectionLabel}>
                <AppIcon icon={faCar} size={16} color={colors.primary} />
                <Text style={styles.formTitle}>Informasi Unit</Text>
              </View>
              {PRIMARY_FIELDS.map(renderField)}
              <CarStatusSelector
                required
                value={values.status}
                disabled={submitting}
                error={errors.status}
                onChange={status => {
                  dirty.current = true;
                  setValues(previous => ({...previous, status}));
                  setErrors(previous => ({...previous, status: undefined}));
                }}
              />
              {SECONDARY_FIELDS.map(renderField)}
            </AppCard>

            <View style={[styles.inset, styles.actions]}>
              <View style={styles.action}>
                <AppButton title="Batal" variant="neutral" responsive={false} disabled={submitting} onPress={leave} />
              </View>
              <View style={styles.action}>
                <AppButton title="Simpan" variant="primary" responsive={false} disabled={submitting} onPress={requestSave} />
              </View>
            </View>
          </> : null}
        </View>
      </ScrollView>
      <ConfirmationModal
        visible={Boolean(modal)}
        message={modal?.message ?? ''}
        confirmLabel={modal?.confirmLabel ?? 'Ya'}
        confirmVariant={modal?.variant}
        loading={submitting}
        onCancel={() => setPending(null)}
        onConfirm={confirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  scrollContent: {paddingBottom: 20},
  content: {width: '100%', maxWidth: 520, alignSelf: 'center', gap: 20},
  inset: {marginHorizontal: 12},
  back: {flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingTop: 12},
  backText: {fontFamily: typography.semiBold, fontSize: 14, color: colors.textPrimary, flexShrink: 1},
  alert: {gap: 12},
  alertText: {fontFamily: typography.regular, fontSize: 14, color: colors.danger},
  loading: {marginVertical: 48},
  imageSection: {gap: 8},
  sectionLabel: {flexDirection: 'row', alignItems: 'center', gap: 8},
  imageLabel: {fontFamily: typography.semiBold, fontSize: 14, color: colors.textPrimary, flexShrink: 1},
  form: {gap: 12},
  formTitle: {fontFamily: typography.semiBold, fontSize: 16, color: colors.textPrimary},
  actions: {flexDirection: 'row', gap: 8},
  action: {flex: 1},
});
