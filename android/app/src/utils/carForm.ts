import {Car, CarDetail} from '../types/car';

export type CarStatus = 'ready' | 'reserve' | 'sold' | 'pending';

export const CAR_STATUS_OPTIONS: {value: CarStatus; label: string}[] = [
  {value: 'ready', label: 'Ready'},
  {value: 'reserve', label: 'Reserve'},
  {value: 'sold', label: 'Sold'},
  {value: 'pending', label: 'Pending'},
];

export const MAX_CAR_IMAGES = 5;
const MAX_MILEAGE = 2147483647;

export interface CarFormValues {
  name: string;
  manufacturer: string;
  year: string;
  price: string;
  status: CarStatus | '';
  validity_period: string;
  mileage: string;
  transmission: string;
  fuel: string;
  color: string;
  showroom_name: string;
  showroom_address: string;
  description: string;
}

export type CarFormErrors = Partial<Record<keyof CarFormValues, string>>;

export function digitsOnly(value: string, maxLength = 15): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

export function formatThousands(value: string): string {
  const digits = digitsOnly(value).replace(/^0+(?=\d)/, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatDateInput(value: string): string {
  const digits = digitsOnly(value, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
}

export function toIsoDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : null;
}

export function fromIsoDate(value: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

function normalizeStatus(status: string | null): CarFormValues['status'] {
  const normalized = status?.trim().toLowerCase();
  return CAR_STATUS_OPTIONS.find(option => option.value === normalized)?.value ?? '';
}

function numberText(value: number | null): string {
  return value !== null && Number.isFinite(value) ? formatThousands(String(Math.round(value))) : '';
}

export function carToFormValues(car: Car | CarDetail): CarFormValues {
  const detail = car as Partial<CarDetail>;
  return {
    name: car.name ?? '',
    manufacturer: car.manufacturer ?? '',
    year: Number.isFinite(car.year) ? String(car.year) : '',
    price: numberText(car.price),
    status: normalizeStatus(car.status),
    validity_period: fromIsoDate(car.validity_period),
    mileage: numberText(car.mileage),
    transmission: car.transmission ?? '',
    fuel: detail.fuel ?? '',
    color: car.color ?? '',
    showroom_name: detail.showroom_name ?? '',
    showroom_address: detail.showroom_address ?? '',
    description: car.description ?? '',
  };
}

export function validateCarForm(values: CarFormValues): CarFormErrors {
  const errors: CarFormErrors = {};
  if (!values.name.trim()) {
    errors.name = 'Nama mobil wajib diisi.';
  }
  if (!values.manufacturer.trim()) {
    errors.manufacturer = 'Pabrikan wajib diisi.';
  }
  const year = Number(values.year);
  if (!values.year.trim()) {
    errors.year = 'Tahun wajib diisi.';
  } else if (!/^\d{4}$/.test(values.year) || year < 1900 || year > new Date().getFullYear() + 1) {
    errors.year = 'Tahun tidak valid.';
  }
  if (!digitsOnly(values.price)) {
    errors.price = 'Harga mobil wajib diisi.';
  }
  if (!values.status) {
    errors.status = 'Status unit wajib dipilih.';
  }
  if (values.validity_period.trim() && !toIsoDate(values.validity_period)) {
    errors.validity_period = 'Gunakan format tanggal DD/MM/YYYY.';
  }
  if (Number(digitsOnly(values.mileage)) > MAX_MILEAGE) {
    errors.mileage = 'Jarak tempuh terlalu besar.';
  }
  for (const key of ['transmission', 'fuel', 'color'] as const) {
    if (values[key].trim().length > 100) {
      errors[key] = 'Maksimal 100 karakter.';
    }
  }
  if (values.showroom_name.trim().length > 150) {
    errors.showroom_name = 'Maksimal 150 karakter.';
  }
  return errors;
}

export function buildCarUpdateFormData(values: CarFormValues): FormData {
  const body = new FormData();
  const fields: [string, string][] = [
    ['name', values.name.trim()],
    ['manufacturer', values.manufacturer.trim()],
    ['year', digitsOnly(values.year, 4)],
    ['price', digitsOnly(values.price)],
    ['status', values.status],
    ['validity_period', toIsoDate(values.validity_period) ?? ''],
    ['mileage', digitsOnly(values.mileage)],
    ['transmission', values.transmission.trim()],
    ['fuel', values.fuel.trim()],
    ['color', values.color.trim()],
    ['showroom_name', values.showroom_name.trim()],
    ['showroom_address', values.showroom_address.trim()],
    ['description', values.description.trim()],
  ];
  fields.forEach(([key, value]) => body.append(key, value));
  return body;
}

export function buildRemoveImagesFormData(imageIds: string[]): FormData {
  const body = new FormData();
  body.append('removeImageIds', JSON.stringify(imageIds));
  return body;
}

export function buildCarImagesFormData(images: {uri: string; name: string; type: string}[]): FormData {
  const body = new FormData();
  images.forEach(image => body.append('images', image));
  return body;
}
