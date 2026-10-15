import {API_CONFIG} from '../config/api';
import {apiRequest} from './apiClient';
import {Car, CarDetail, CarImage, CarListParams, CarListResponse} from '../types/car';

const responseCache = new Map<string, CarListResponse>();

export function carQueryKey(params: CarListParams): string {
  return JSON.stringify({
    page: params.page ?? 1,
    perpage: params.perpage ?? 8,
    name: params.name?.trim() || '',
    start_year: params.start_year ?? null,
    end_year: params.end_year ?? null,
  });
}

export function getCachedCars(params: CarListParams) {
  return responseCache.get(carQueryKey(params));
}

export function clearCarCache() {
  responseCache.clear();
}

function normalizeCar(record: unknown): Car {
  if (!record || typeof record !== 'object' || !('id' in record) || typeof record.id !== 'string') {
    throw new Error('Data mobil dari server tidak valid.');
  }
  const car = record as Partial<Car>;
  return {
    id: record.id,
    name: typeof car.name === 'string' ? car.name : '',
    manufacturer: typeof car.manufacturer === 'string' ? car.manufacturer : '',
    year: typeof car.year === 'number' && Number.isFinite(car.year) ? car.year : Number.NaN,
    price: typeof car.price === 'number' && Number.isFinite(car.price) ? car.price : Number.NaN,
    description: typeof car.description === 'string' ? car.description : null,
    status: typeof car.status === 'string' ? car.status : null,
    color: typeof car.color === 'string' ? car.color : null,
    transmission: typeof car.transmission === 'string' ? car.transmission : null,
    mileage: typeof car.mileage === 'number' && Number.isFinite(car.mileage) ? car.mileage : null,
    validity_period: typeof car.validity_period === 'string' ? car.validity_period : null,
    images: Array.isArray(car.images)
      ? car.images.filter(image => image && typeof image.id === 'string' && typeof image.url === 'string')
        .map(image => ({id: image.id, url: image.url, highlight: image.highlight === true}))
      : [],
  };
}

export async function getCar(id: string, signal?: AbortSignal): Promise<CarDetail> {
  const response = await apiRequest<unknown>(`cars/${encodeURIComponent(id)}`, {signal});
  const car = normalizeCar(response);
  const detail = response as Partial<CarDetail> & {showroom_location?: string};
  return {
    ...car,
    fuel: typeof detail.fuel === 'string' ? detail.fuel : null,
    registration_number: typeof detail.registration_number === 'string' ? detail.registration_number : null,
    showroom_name: typeof detail.showroom_name === 'string' ? detail.showroom_name : null,
    showroom_address: typeof detail.showroom_address === 'string'
      ? detail.showroom_address
      : typeof detail.showroom_location === 'string' ? detail.showroom_location : null,
  };
}

export async function updateCarImageHighlight(id: string, signal?: AbortSignal): Promise<CarImage> {
  const response = await apiRequest<Partial<CarImage>>(`car-images/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    signal,
  });
  clearCarCache();
  if (!response || response.id !== id || typeof response.url !== 'string' || typeof response.highlight !== 'boolean') {
    throw new Error('Data gambar dari server tidak valid.');
  }
  return {id: response.id, url: response.url, highlight: response.highlight};
}

export async function getCars(
  params: CarListParams,
  signal?: AbortSignal,
): Promise<CarListResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('perpage', String(params.perpage ?? 8));
  if (params.name?.trim()) {
    query.set('name', params.name.trim());
  }
  if (params.start_year !== undefined && params.end_year !== undefined) {
    query.set('start_year', String(params.start_year));
    query.set('end_year', String(params.end_year));
  }

  const response = await apiRequest<Partial<CarListResponse>>(
    `cars?${query.toString()}`,
    {signal},
  );
  if (
    !response ||
    !Array.isArray(response.data) ||
    typeof response.page !== 'number' ||
    typeof response.perpage !== 'number' ||
    typeof response.total !== 'number' ||
    typeof response.totalPages !== 'number'
  ) {
    throw new Error('Data katalog dari server tidak valid.');
  }

  const cars = response.data.map(normalizeCar);
  const normalized: CarListResponse = {...response, data: cars} as CarListResponse;
  responseCache.set(carQueryKey(params), normalized);
  return normalized;
}

export function resolveImageUrl(
  path: string | null | undefined,
): string | null {
  if (typeof path !== 'string' || !path.trim()) {
    return null;
  }
  const imagePath = path.trim();
  if (/^https?:\/\//i.test(imagePath)) {
    return /^https?:\/\/[^/\s]+/i.test(imagePath) ? imagePath : null;
  }

  const origin = API_CONFIG.baseUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  return encodeURI(
    `${origin}/${imagePath.replace(/^\/+/, '').replace(/\/+/g, '/')}`,
  )
    .replace(/#/g, '%23')
    .replace(/\?/g, '%3F');
}