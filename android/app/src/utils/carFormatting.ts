import {colors} from '../theme/colors';

export function formatRupiah(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Harga tidak tersedia';
  }
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

export function formatMileage(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '-';
  }
  return `${Math.round(value).toLocaleString('id-ID')} km`;
}

export function formatValidityPeriod(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return null;
  }
  return `Berlaku s/d ${value.slice(5, 7)}/${value.slice(0, 4)}`;
}

export function statusBadge(status: string | null): {
  label: string;
  color: string;
} | null {
  if (!status?.trim()) {
    return null;
  }
  const normalized = status.trim().toLowerCase();
  if (normalized === 'ready') {
    return {label: 'Ready', color: colors.success};
  }
  return {
    label: status.trim().replace(/\b\w/g, letter => letter.toUpperCase()),
    color: colors.neutral,
  };
}