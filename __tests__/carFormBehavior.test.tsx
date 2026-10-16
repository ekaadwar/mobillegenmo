import React from 'react';
import {RefreshControl, ScrollView, StyleSheet, Text, TextInput} from 'react-native';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {CarFormScreen, formatFieldInput} from '../android/app/src/screens/catalog/CarFormScreen';
import {CarImageCarousel, carouselLayout, loopSlides, resolveLoopIndex} from '../android/app/src/components/cars/CarImageCarousel';
import {CarStatusSelector} from '../android/app/src/components/cars/CarStatusSelector';
import {ConfirmationModal} from '../android/app/src/components/ui/ConfirmationModal';
import {AppButton} from '../android/app/src/components/ui/AppButton';
import {AppTextInput} from '../android/app/src/components/ui/AppTextInput';
import {API_CONFIG} from '../android/app/src/config/api';
import {configureApiClient} from '../android/app/src/services/apiClient';
import {getCar, updateCar, updateCarImageHighlight} from '../android/app/src/services/carService';
import {CarDetail} from '../android/app/src/types/car';
import {
  buildCarUpdateFormData,
  buildRemoveImagesFormData,
  carToFormValues,
  CarFormValues,
  digitsOnly,
  formatDateInput,
  formatThousands,
  fromIsoDate,
  toIsoDate,
  validateCarForm,
} from '../android/app/src/utils/carForm';

jest.mock('../android/app/src/services/carService', () => ({
  ...jest.requireActual('../android/app/src/services/carService'),
  getCar: jest.fn(),
  updateCar: jest.fn(),
  updateCarImageHighlight: jest.fn(),
}));

const car: CarDetail = {
  id: 'car-id', name: 'Toyota Avanza Veloz', manufacturer: 'Toyota', year: 2022, price: 235000000,
  description: 'Kondisi sangat baik', status: 'ready', color: 'Silver Metallic', transmission: 'Otomatis (CVT)',
  mileage: 24150, validity_period: '2027-08-01', fuel: 'Bensin', registration_number: 'B 1842 KLO',
  showroom_name: 'Mobil Legend Flagship - Jakarta Selatan', showroom_address: 'Jl. Sultan Iskandar Muda No. 42',
  images: [
    {id: 'img-1', url: 'https://example.com/1.jpg', highlight: false},
    {id: 'img-2', url: 'https://example.com/2.jpg', highlight: true},
    {id: 'img-3', url: 'https://example.com/3.jpg', highlight: false},
  ],
};

const values: CarFormValues = carToFormValues(car);

function formEntries(body: FormData): Record<string, string> {
  const parts = (body as unknown as {getParts?: () => {fieldName: string; string: string}[]}).getParts?.();
  if (parts) {
    return Object.fromEntries(parts.map(part => [part.fieldName, part.string]));
  }
  return Object.fromEntries(Array.from((body as unknown as {entries: () => Iterable<[string, string]>}).entries()));
}

let renderer: ReactTestRenderer.ReactTestRenderer;
afterEach(() => {
  if (renderer) {
    act(() => renderer.unmount());
  }
});

function findPressable(label: string) {
  const node = renderer.root.findAll(item => item.props.accessibilityLabel === label && typeof item.props.onPress === 'function')[0];
  if (!node) {
    throw new Error(`Pressable not found: ${label}`);
  }
  return node;
}

async function press(label: string) {
  await act(async () => { await findPressable(label).props.onPress(); });
}

function texts() {
  return renderer.root.findAllByType(Text).map(node => ([] as unknown[]).concat(node.props.children).join('')).join('\n')
    + renderer.root.findAll(node => typeof node.props.accessibilityLabel === 'string').map(node => node.props.accessibilityLabel).join('\n');
}

describe('car form utilities', () => {
  it('formats numeric and date input', () => {
    expect(digitsOnly('Rp 1.2a3', 2)).toBe('12');
    expect(formatThousands('0235000000')).toBe('235.000.000');
    expect(formatThousands('')).toBe('');
    expect(formatDateInput('01082027999')).toBe('01/08/2027');
    expect(formatDateInput('010')).toBe('01/0');
  });

  it('converts between display and API dates', () => {
    expect(toIsoDate('01/08/2027')).toBe('2027-08-01');
    expect(toIsoDate('31/02/2027')).toBeNull();
    expect(toIsoDate('2027-08-01')).toBeNull();
    expect(fromIsoDate('2027-08-01')).toBe('01/08/2027');
    expect(fromIsoDate(null)).toBe('');
  });

  it('maps a car into form values and tolerates missing detail fields', () => {
    expect(values).toEqual({
      name: car.name, manufacturer: 'Toyota', year: '2022', price: '235.000.000', status: 'ready',
      validity_period: '01/08/2027', mileage: '24.150', transmission: 'Otomatis (CVT)', fuel: 'Bensin',
      color: 'Silver Metallic', showroom_name: car.showroom_name, showroom_address: car.showroom_address,
      description: 'Kondisi sangat baik',
    });
    const {fuel, showroom_name, showroom_address, registration_number, ...listCar} = car;
    expect(carToFormValues({...listCar, year: Number.NaN, price: Number.NaN, mileage: null, status: 'UNKNOWN', description: null}))
      .toMatchObject({year: '', price: '', mileage: '', status: '', fuel: '', showroom_name: '', showroom_address: '', description: ''});
    expect([fuel, showroom_name, showroom_address, registration_number]).toHaveLength(4);
  });

  it('requires mandatory fields and validates optional formats', () => {
    expect(validateCarForm(values)).toEqual({});
    const errors = validateCarForm({...values, name: ' ', manufacturer: '', year: '', price: '', status: ''});
    expect(Object.keys(errors).sort()).toEqual(['manufacturer', 'name', 'price', 'status', 'year']);
    expect(validateCarForm({...values, year: '1800'}).year).toBe('Tahun tidak valid.');
    expect(validateCarForm({...values, validity_period: '99/99/2027'}).validity_period).toBeDefined();
    expect(validateCarForm({...values, mileage: '2.147.483.648'}).mileage).toBeDefined();
    expect(validateCarForm({...values, color: 'x'.repeat(101), showroom_name: 'x'.repeat(151)})).toEqual({
      color: 'Maksimal 100 karakter.', showroom_name: 'Maksimal 150 karakter.',
    });
  });

  it('builds a multipart update with every field and empty strings for cleared inputs', () => {
    const entries = formEntries(buildCarUpdateFormData({...values, color: '', validity_period: '', mileage: ''}));
    expect(entries).toEqual({
      name: car.name, manufacturer: 'Toyota', year: '2022', price: '235000000', status: 'ready', validity_period: '',
      mileage: '', transmission: 'Otomatis (CVT)', fuel: 'Bensin', color: '', showroom_name: car.showroom_name,
      showroom_address: car.showroom_address, description: 'Kondisi sangat baik',
    });
    expect(formEntries(buildCarUpdateFormData(values)).validity_period).toBe('2027-08-01');
    expect(formEntries(buildRemoveImagesFormData(['img-1']))).toEqual({removeImageIds: '["img-1"]'});
  });

  it('formats screen input per field', () => {
    expect(formatFieldInput('year', '20225')).toBe('2022');
    expect(formatFieldInput('price', '235000')).toBe('235.000');
    expect(formatFieldInput('mileage', '24150')).toBe('24.150');
    expect(formatFieldInput('validity_period', '01082027')).toBe('01/08/2027');
    expect(formatFieldInput('name', ' Avanza ')).toBe(' Avanza ');
  });
});

describe('updateCar service', () => {
  it('sends a multipart PATCH without a JSON content type and normalizes the response', async () => {
    const actual = jest.requireActual('../android/app/src/services/carService');
    const fetchMock = jest.fn().mockResolvedValue({ok: true, status: 200, json: async () => ({...car, fuel: undefined})});
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    configureApiClient({getAccessToken: async () => 'token', onUnauthorized: jest.fn()});
    const body = buildCarUpdateFormData(values);
    const result = await actual.updateCar('car-id', body);
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_CONFIG.baseUrl}/cars/car-id`);
    expect(request.method).toBe('PATCH');
    expect(request.body).toBe(body);
    expect(new Headers(request.headers).get('Content-Type')).toBeNull();
    expect(new Headers(request.headers).get('Authorization')).toBe('Bearer token');
    expect(result).toMatchObject({id: 'car-id', fuel: null, showroom_name: car.showroom_name});
  });
});

describe('CarImageCarousel', () => {
  it('computes layout and looping indexes', () => {
    expect(carouselLayout(390)).toEqual({itemWidth: 358, interval: 366, sidePadding: 16});
    expect(carouselLayout(1000).itemWidth).toBe(385);
    expect(loopSlides(car.images).map(image => image.id)).toEqual(['img-3', 'img-1', 'img-2', 'img-3', 'img-1']);
    expect(loopSlides([car.images[0]])).toHaveLength(1);
    expect([0, 1, 3, 4].map(index => resolveLoopIndex(index, 3))).toEqual([2, 0, 2, 0]);
    expect(resolveLoopIndex(5, 1)).toBe(0);
  });

  function renderCarousel(images = car.images, handlers = {onDelete: jest.fn(), onHighlight: jest.fn()}) {
    act(() => { renderer = ReactTestRenderer.create(<CarImageCarousel images={images} name="Avanza" {...handlers} />); });
    act(() => renderer.root.findAll(node => typeof node.props.onLayout === 'function')[0].props.onLayout({nativeEvent: {layout: {width: 390}}}));
    return handlers;
  }

  function swipeTo(slide: number) {
    act(() => renderer.root.findByType(ScrollView).props.onMomentumScrollEnd({nativeEvent: {contentOffset: {x: slide * 366}}}));
  }

  it('starts on the highlight image and swipes infinitely in both directions', () => {
    const handlers = renderCarousel();
    expect(texts()).toContain('Foto Avanza 2 dari 3');
    expect(renderer.root.findAllByType(AppButton).find(node => node.props.title === 'Jadikan foto highlight')?.props.variant).toBe('primary');
    swipeTo(4);
    expect(texts()).toContain('Foto Avanza 1 dari 3');
    expect(renderer.root.findAllByType(AppButton).find(node => node.props.title === 'Jadikan foto highlight')?.props.variant).toBe('neutral');
    swipeTo(0);
    expect(texts()).toContain('Foto Avanza 3 dari 3');
    act(() => findPressable('Hapus foto').props.onPress());
    act(() => findPressable('Jadikan foto highlight').props.onPress());
    expect(handlers.onDelete).toHaveBeenCalledWith(car.images[2]);
    expect(handlers.onHighlight).toHaveBeenCalledWith(car.images[2]);
  });

  it('renders nothing without images and disables looping for a single image', () => {
    renderCarousel([car.images[0]]);
    expect(renderer.root.findByType(ScrollView).props.scrollEnabled).toBe(false);
    act(() => renderer.update(<CarImageCarousel images={[]} name="Avanza" onDelete={jest.fn()} onHighlight={jest.fn()} />));
    expect(renderer.toJSON()).toBeNull();
  });
});

describe('CarStatusSelector', () => {
  it('marks the selected status, reports changes, and shows errors', () => {
    const onChange = jest.fn();
    act(() => { renderer = ReactTestRenderer.create(<CarStatusSelector required value="ready" error="Wajib" onChange={onChange} />); });
    expect(findPressable('Status Ready').props.accessibilityState.selected).toBe(true);
    expect(findPressable('Status Sold').props.accessibilityState.selected).toBe(false);
    act(() => findPressable('Status Pending').props.onPress());
    expect(onChange).toHaveBeenCalledWith('pending');
    expect(texts()).toContain('Wajib');
    expect(texts()).toContain(' *');
  });
});

describe('ConfirmationModal', () => {
  it('renders the message and wires both actions', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    act(() => { renderer = ReactTestRenderer.create(<ConfirmationModal visible message="Yakin?" confirmLabel="Hapus" confirmVariant="danger" onConfirm={onConfirm} onCancel={onCancel} />); });
    expect(texts()).toContain('Yakin?');
    expect(renderer.root.findAllByType(AppButton).map(node => [node.props.title, node.props.variant])).toEqual([['Batal', 'neutral'], ['Hapus', 'danger']]);
    act(() => findPressable('Batal').props.onPress());
    act(() => findPressable('Hapus').props.onPress());
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    act(() => renderer.update(<ConfirmationModal visible loading message="Yakin?" confirmLabel="Hapus" onConfirm={onConfirm} onCancel={onCancel} />));
    const [cancel, confirmButton] = renderer.root.findAllByType(AppButton);
    expect(cancel.props.disabled).toBe(true);
    expect(confirmButton.props.loading).toBe(true);
  });
});

describe('AppTextInput multiline', () => {
  it('top-aligns textarea content', () => {
    act(() => { renderer = ReactTestRenderer.create(<AppTextInput multiline value="" />); });
    expect(StyleSheet.flatten(renderer.root.findByType(TextInput).props.style).textAlignVertical).toBe('top');
  });
});

describe('CarFormScreen', () => {
  const getCarMock = jest.mocked(getCar);
  const updateCarMock = jest.mocked(updateCar);
  const highlightMock = jest.mocked(updateCarImageHighlight);
  const navigation = {goBack: jest.fn(), popTo: jest.fn(), navigate: jest.fn()};

  beforeEach(() => {
    jest.resetAllMocks();
    getCarMock.mockResolvedValue(car);
  });

  async function renderScreen(params: {source: 'catalog' | 'detail'; car?: CarDetail} = {source: 'detail', car}) {
    const props = {route: {key: 'form', name: 'CarForm', params: {carId: car.id, ...params}}, navigation} as unknown as React.ComponentProps<typeof CarFormScreen>;
    await act(async () => { renderer = ReactTestRenderer.create(<CarFormScreen {...props} />); });
  }

  function input(label: string) {
    return renderer.root.findAllByType(AppTextInput).find(node => node.props.label === label)!;
  }

  async function type(label: string, value: string) {
    await act(async () => { input(label).props.onChangeText(value); });
  }

  function modal() {
    return renderer.root.findByType(ConfirmationModal).props;
  }

  it.each([['catalog', 'Kembali ke Katalog'], ['detail', 'Kembali ke Detail Katalog']] as const)('labels the back button for %s', async (source, label) => {
    await renderScreen({source, car});
    await press(label);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('prefills every field, marks mandatory labels, and shows the photo count', async () => {
    await renderScreen();
    const inputs = renderer.root.findAllByType(AppTextInput);
    expect(inputs.map(node => node.props.label)).toEqual([
      'Nama Mobil', 'Pabrikan', 'Tahun', 'Harga Mobil (Rp)', 'Masa Berlaku', 'Jarak Tempuh (Km)', 'Transmisi',
      'Bahan Bakar', 'Warna Unit', 'Lokasi Showroom', 'Alamat Showroom', 'Deskripsi',
    ]);
    expect(inputs.filter(node => node.props.required).map(node => node.props.label)).toEqual(['Nama Mobil', 'Pabrikan', 'Tahun', 'Harga Mobil (Rp)']);
    expect(input('Harga Mobil (Rp)').props.value).toBe('235.000.000');
    expect(renderer.root.findByType(CarStatusSelector).props).toMatchObject({value: 'ready', required: true});
    expect(texts()).toContain('Foto Unit (3 dari 5)');
    expect(getCarMock).toHaveBeenCalledWith(car.id, expect.any(AbortSignal));
  });

  it('loads full details when opened without a snapshot and retries on failure', async () => {
    getCarMock.mockRejectedValueOnce(new Error('Tidak ditemukan'));
    await renderScreen({source: 'catalog'});
    expect(texts()).toContain('Tidak ditemukan');
    expect(renderer.root.findAllByType(AppTextInput)).toHaveLength(0);
    await press('Coba Lagi');
    expect(input('Bahan Bakar').props.value).toBe('Bensin');
  });

  it('keeps defaults after refresh by restoring the stored unit data', async () => {
    await renderScreen();
    await type('Nama Mobil', 'Draft');
    expect(input('Nama Mobil').props.value).toBe('Draft');
    await act(async () => { renderer.root.findByType(RefreshControl).props.onRefresh(); });
    expect(getCarMock).toHaveBeenCalledTimes(2);
    expect(input('Nama Mobil').props.value).toBe(car.name);
  });

  it('hides the carousel without images and disables adding beyond five photos', async () => {
    getCarMock.mockResolvedValue({...car, images: []});
    await renderScreen({source: 'detail', car: {...car, images: []}});
    expect(renderer.root.findAllByType(CarImageCarousel)).toHaveLength(0);
    const five = Array.from({length: 5}, (_, index) => ({id: `i${index}`, url: `https://example.com/${index}.jpg`}));
    getCarMock.mockResolvedValue({...car, images: five});
    await act(async () => { renderer.root.findByType(RefreshControl).props.onRefresh(); });
    expect(findPressable('Tambah Foto Unit').props.disabled).toBe(true);
  });

  it('blocks saving when mandatory fields are empty', async () => {
    await renderScreen();
    await type('Nama Mobil', '');
    await press('Simpan');
    expect(input('Nama Mobil').props.error).toBe('Nama mobil wajib diisi.');
    expect(modal().visible).toBe(false);
    expect(updateCarMock).not.toHaveBeenCalled();
  });

  it('confirms and submits the form, then returns to a refreshed detail page', async () => {
    updateCarMock.mockResolvedValue({...car, name: 'Avanza Baru'});
    await renderScreen();
    await type('Nama Mobil', 'Avanza Baru');
    await type('Warna Unit', '');
    await press('Simpan');
    expect(modal()).toMatchObject({visible: true, message: 'Apakah Anda yakin akan melakukan perubahan data?', confirmLabel: 'Ya'});
    await act(async () => { await modal().onConfirm(); });
    const [id, body] = updateCarMock.mock.calls[0];
    expect(id).toBe(car.id);
    expect(formEntries(body)).toMatchObject({name: 'Avanza Baru', color: '', price: '235000000', validity_period: '2027-08-01'});
    expect(navigation.popTo).toHaveBeenCalledWith('CarDetail', {carId: car.id, refreshKey: expect.any(Number)});
  });

  it('closes the confirmation without calling the API when cancelled', async () => {
    await renderScreen();
    await press('Simpan');
    act(() => modal().onCancel());
    expect(modal().visible).toBe(false);
    expect(updateCarMock).not.toHaveBeenCalled();
  });

  it('deletes the active image after confirmation', async () => {
    updateCarMock.mockResolvedValue({...car, images: car.images.filter(image => image.id !== 'img-2')});
    await renderScreen();
    await press('Hapus foto');
    expect(modal()).toMatchObject({message: 'Apakah Anda yakin ingin menghapus gambar ini?', confirmLabel: 'Hapus', confirmVariant: 'danger'});
    await act(async () => { await modal().onConfirm(); });
    expect(formEntries(updateCarMock.mock.calls[0][1])).toEqual({removeImageIds: '["img-2"]'});
    expect(renderer.root.findByType(CarImageCarousel).props.images).toHaveLength(2);
    await press('Batal');
    expect(navigation.popTo).toHaveBeenCalled();
  });

  it('highlights a non-highlighted image after confirmation', async () => {
    highlightMock.mockResolvedValue({...car.images[0], highlight: true});
    await renderScreen();
    await press('Jadikan foto highlight');
    expect(modal().visible).toBe(false);
    const carousel = renderer.root.findByType(CarImageCarousel).findByType(ScrollView);
    act(() => carousel.props.onMomentumScrollEnd({nativeEvent: {contentOffset: {x: carousel.props.snapToInterval}}}));
    await press('Jadikan foto highlight');
    expect(modal()).toMatchObject({visible: true, message: 'Apakah Anda yakin menjadikan gambar ini sebagai highlight?'});
    await act(async () => { await modal().onConfirm(); });
    expect(highlightMock).toHaveBeenCalledWith('img-1', expect.any(AbortSignal));
    const images = renderer.root.findByType(CarImageCarousel).props.images;
    expect(images.filter((image: {highlight: boolean}) => image.highlight).map((image: {id: string}) => image.id)).toEqual(['img-1']);
  });

  it('shows API errors and keeps the form editable', async () => {
    updateCarMock.mockRejectedValue(new Error('Validation failed'));
    await renderScreen();
    await press('Simpan');
    await act(async () => { await modal().onConfirm(); });
    expect(texts()).toContain('Validation failed');
    expect(modal().visible).toBe(false);
    expect(input('Nama Mobil').props.disabled).toBe(false);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('aborts a pending update on unmount', async () => {
    updateCarMock.mockReturnValue(new Promise(() => {}));
    await renderScreen();
    await press('Simpan');
    act(() => { modal().onConfirm(); });
    const signal = updateCarMock.mock.calls[0][2];
    act(() => renderer.unmount());
    expect(signal?.aborted).toBe(true);
  });
});
