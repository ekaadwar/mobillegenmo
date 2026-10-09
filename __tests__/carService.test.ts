import {API_CONFIG} from '../android/app/src/config/api';
import {apiRequest, configureApiClient} from '../android/app/src/services/apiClient';
import {
  carQueryKey,
  clearCarCache,
  getCars,
  getCachedCars,
  resolveImageUrl,
} from '../android/app/src/services/carService';
import {loginApi} from '../android/app/src/services/authService';
import {formatMileage, formatRupiah, statusBadge} from '../android/app/src/utils/carFormatting';

const fetchMock = jest.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('car API and formatting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCarCache();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    configureApiClient({
      getAccessToken: async () => 'test-token',
      onUnauthorized: jest.fn(),
    });
  });

  it('attaches a bearer token and safely encodes combined query parameters', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      data: [], page: 2, perpage: 8, total: 0, totalPages: 0,
    }));

    await getCars({
      page: 2,
      perpage: 8,
      name: 'Mazda & CX',
      start_year: 2019,
      end_year: 2026,
    });

    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/api/v1/cars');
    expect(parsed.searchParams.get('page')).toBe('2');
    expect(parsed.searchParams.get('perpage')).toBe('8');
    expect(parsed.searchParams.get('name')).toBe('Mazda & CX');
    expect(parsed.searchParams.get('start_year')).toBe('2019');
    expect(parsed.searchParams.get('end_year')).toBe('2026');
    expect(new Headers(request.headers).get('Authorization')).toBe('Bearer test-token');
  });

  it('omits an empty search and caches responses by all active filters', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      data: [], page: 1, perpage: 8, total: 0, totalPages: 0,
    }));
    const params = {page: 1, perpage: 8, name: '  '};
    const result = await getCars(params);
    const [url] = fetchMock.mock.calls[0] as [string];

    expect(new URL(url).searchParams.has('name')).toBe(false);
    expect(getCachedCars(params)).toBe(result);
    expect(carQueryKey({...params, start_year: 2020, end_year: 2024})).not.toBe(
      carQueryKey(params),
    );
  });

  it('runs the shared unauthorized handler for protected 401 responses', async () => {
    const onUnauthorized = jest.fn().mockResolvedValue(undefined);
    configureApiClient({getAccessToken: async () => 'test-token', onUnauthorized});
    fetchMock.mockResolvedValue(jsonResponse({message: 'Unauthorized'}, 401));

    await expect(apiRequest('/cars')).rejects.toMatchObject({statusCode: 401});
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not run forced logout for a failed login', async () => {
    const onUnauthorized = jest.fn();
    configureApiClient({getAccessToken: async () => 'test-token', onUnauthorized});
    fetchMock.mockResolvedValueOnce(jsonResponse({message: 'bad credentials'}, 401));

    await expect(loginApi({username: 'admin', password: 'wrong'})).rejects.toMatchObject({
      message: 'Username atau password salah',
      statusCode: 401,
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('resolves upload URLs against the backend origin and formats null-safe car values', () => {
    const origin = API_CONFIG.baseUrl.replace(/\/api\/v1\/?$/, '');
    expect(resolveImageUrl('/uploads/car 1.jpg')).toBe(`${origin}/uploads/car%201.jpg`);
    expect(resolveImageUrl('https://images.example/car.jpg')).toBe('https://images.example/car.jpg');
    expect(resolveImageUrl(null)).toBeNull();
    expect(formatRupiah(652000000)).toBe('Rp 652.000.000');
    expect(formatRupiah(Number.NaN)).toBe('Harga tidak tersedia');
    expect(formatMileage(6500)).toBe('6.500 km');
    expect(formatMileage(null)).toBe('-');
    expect(statusBadge(null)).toBeNull();
    expect(statusBadge('ready')?.label).toBe('Ready');
    expect(statusBadge('reserved')?.color).not.toBe(statusBadge('ready')?.color);
  });
});