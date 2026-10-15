import {API_CONFIG} from '../android/app/src/config/api';
import {apiRequest, configureApiClient} from '../android/app/src/services/apiClient';
import {
  carQueryKey,
  clearCarCache,
  getCars,
  getCar,
  updateCarImageHighlight,
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

  it('loads detail and normalizes missing fields and image highlights', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      id: 'car', fuel: 'Bensin', showroom_address: 'Jakarta',
      images: [{id: 'image', url: '/uploads/car.jpg'}, null, {}],
    }));
    const car = await getCar('car');
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_CONFIG.baseUrl}/cars/car`);
    expect(car).toMatchObject({fuel: 'Bensin', description: null, showroom_address: 'Jakarta', registration_number: null});
    expect(car.images).toEqual([{id: 'image', url: '/uploads/car.jpg', highlight: false}]);
  });

  it('patches the selected image without a body and invalidates list caches', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({data: [], page: 1, perpage: 8, total: 0, totalPages: 0}));
    await getCars({});
    const image = {id: 'image', url: '/uploads/car.jpg', highlight: true};
    fetchMock.mockResolvedValueOnce(jsonResponse(image));
    await expect(updateCarImageHighlight('image')).resolves.toEqual(image);
    expect(fetchMock.mock.calls[1][0]).toBe(`${API_CONFIG.baseUrl}/car-images/image`);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({method: 'PATCH'});
    expect(fetchMock.mock.calls[1][1].body).toBeUndefined();
    expect(getCachedCars({})).toBeUndefined();
  });

  it('preserves detail validation and image-not-found errors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({message: 'Validation failed (uuid is expected)'}, 400));
    await expect(getCar('invalid')).rejects.toMatchObject({statusCode: 400, message: 'Validation failed (uuid is expected)'});
    fetchMock.mockResolvedValueOnce(jsonResponse({message: 'Gambar mobil tidak ditemukan'}, 404));
    await expect(updateCarImageHighlight('missing')).rejects.toMatchObject({statusCode: 404, message: 'Gambar mobil tidak ditemukan'});
  });

  it.each([null, {}, {id: 42}])('rejects malformed detail responses: %p', async body => {
    fetchMock.mockResolvedValueOnce(jsonResponse(body));
    await expect(getCar('car')).rejects.toThrow('Data mobil dari server tidak valid.');
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

  it('accepts a valid login and rejects a successful response without a token', async () => {
    const payload = {username: 'admin', password: 'test-password'};
    const response = {accessToken: 'token', tokenType: 'Bearer', expiresIn: 3600};
    fetchMock.mockResolvedValueOnce(jsonResponse(response));
    await expect(loginApi(payload)).resolves.toEqual(response);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({method: 'POST', body: JSON.stringify(payload)});
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    await expect(loginApi(payload)).rejects.toThrow('Response login tidak memiliki access token.');
    fetchMock.mockResolvedValueOnce(jsonResponse({message: 'Unavailable'}, 503));
    await expect(loginApi(payload)).rejects.toThrow('Unavailable');
  });

  it.each([
    ['protected API', () => apiRequest('cars')],
    ['login API', () => loginApi({username: 'admin', password: 'test-password'})],
  ] as const)('normalizes network failures for %s', async (_label, request) => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(request()).rejects.toThrow('Tidak dapat terhubung ke server.');
  });

  it.each([
    ['protected API', () => apiRequest('cars')],
    ['login API', () => loginApi({username: 'admin', password: 'test-password'})],
  ] as const)('aborts timed-out %s requests', async (_label, request) => {
    jest.useFakeTimers();
    fetchMock.mockImplementationOnce((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(Object.assign(new Error('Aborted'), {name: 'AbortError'})));
    }));
    try {
      await Promise.all([
        expect(request()).rejects.toThrow('Request timeout. Silakan coba kembali.'),
        jest.advanceTimersByTimeAsync(API_CONFIG.timeout),
      ]);
    } finally {
      jest.useRealTimers();
    }
  });

  it('rejects malformed list and highlight responses', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({data: []}));
    await expect(getCars({})).rejects.toThrow('Data katalog dari server tidak valid.');
    fetchMock.mockResolvedValueOnce(jsonResponse({id: 'image', url: '/uploads/car.jpg'}));
    await expect(updateCarImageHighlight('image')).rejects.toThrow('Data gambar dari server tidak valid.');
  });

  it.each([
    ['protected API', () => apiRequest('cars')],
    ['login API', () => loginApi({username: 'admin', password: 'test-password'})],
  ] as const)('handles non-JSON error responses from %s', async (_label, request) => {
    fetchMock.mockResolvedValueOnce({ok: false, status: 502, json: async () => { throw new Error('Invalid JSON'); }});
    await expect(request()).rejects.toMatchObject({statusCode: 502});
  });

  it.each([true, false])('propagates caller cancellation (already aborted: %s)', async alreadyAborted => {
    const controller = new AbortController();
    fetchMock.mockImplementationOnce((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      const abort = () => reject(Object.assign(new Error('Aborted'), {name: 'AbortError'}));
      if (options.signal?.aborted) { abort(); } else { options.signal?.addEventListener('abort', abort); }
    }));
    if (alreadyAborted) { controller.abort(); }
    const operation = apiRequest('cars', {signal: controller.signal});
    await Promise.resolve();
    controller.abort();
    await expect(operation).rejects.toMatchObject({name: 'AbortError'});
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