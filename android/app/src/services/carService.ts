import {API_CONFIG} from '../config/api';
import {apiRequest} from './apiClient';
import {Car, CarListParams, CarListResponse} from '../types/car';

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

  const cars = response.data.map((record): Car => {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string') {
      throw new Error('Data katalog dari server tidak valid.');
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
        : [],
    };
  });
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