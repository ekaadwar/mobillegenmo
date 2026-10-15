import React from 'react';
import {ActivityIndicator, Image, ScrollView, StyleSheet, View} from 'react-native';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {CarDetailScreen} from '../android/app/src/screens/catalog/CarDetailScreen';
import {CarImageGallery} from '../android/app/src/components/cars/CarImageGallery';
import {CarSpecificationCard} from '../android/app/src/components/cars/CarSpecificationCard';
import {AppButton} from '../android/app/src/components/ui/AppButton';
import {getCar, updateCarImageHighlight} from '../android/app/src/services/carService';
import {CarDetail} from '../android/app/src/types/car';
import {formatValidityPeriod} from '../android/app/src/utils/carFormatting';

jest.mock('../android/app/src/services/carService', () => ({
  ...jest.requireActual('../android/app/src/services/carService'),
  getCar: jest.fn(),
  updateCarImageHighlight: jest.fn(),
}));

let mockWidth = 390;
let mockFontScale = 1;
jest.mock('../android/app/src/hooks/useResponsive', () => ({
  useResponsive: () => ({width: mockWidth, contentWidth: Math.min(mockWidth - 24, 480), fontScale: mockFontScale, r: (value: number) => value}),
}));

const car: CarDetail = {
  id: 'car-id', name: 'TUCSON', manufacturer: 'Hyundai', year: 2026,
  price: 652000000, description: null, status: 'ready', color: 'Creamy White Pearl',
  transmission: 'Automatic Transmission (AT)', mileage: 6500, validity_period: '2031-10-07',
  fuel: 'Bensin', registration_number: 'B 6677 TIT', showroom_name: 'Mobil Legend Jakarta',
  showroom_address: 'Jl. Sudirman No. 10, Jakarta',
  images: Array.from({length: 6}, (_, index) => ({id: `image-${index}`, url: `https://example.com/${index}.jpg`, highlight: index === 1})),
};
const getCarMock = jest.mocked(getCar);
const patchMock = jest.mocked(updateCarImageHighlight);
const navigate = jest.fn();
const goBack = jest.fn();
const props = {
  route: {key: 'detail', name: 'CarDetail', params: {carId: car.id}},
  navigation: {navigate, goBack},
} as unknown as React.ComponentProps<typeof CarDetailScreen>;

let renderer: ReactTestRenderer.ReactTestRenderer;

async function renderScreen() {
  await act(async () => { renderer = ReactTestRenderer.create(<CarDetailScreen {...props} />); });
}

function button(label: string) {
  const result = renderer.root.findAll(node => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function')[0];
  if (!result) { throw new Error(`Button not found: ${label}`); }
  return result;
}

async function press(label: string) {
  await act(async () => { await button(label).props.onPress(); });
}

beforeEach(() => {
  jest.resetAllMocks();
  mockWidth = 390;
  mockFontScale = 1;
  getCarMock.mockResolvedValue(car);
});

afterEach(() => { if (renderer) { act(() => renderer.unmount()); } });

describe('car detail screen', () => {
  it('loads the selected ID and renders seven specifications with null-safe data', async () => {
    await renderScreen();
    expect(getCarMock).toHaveBeenCalledWith(car.id, expect.any(AbortSignal));
    expect(renderer.root.findAllByType(CarSpecificationCard)).toHaveLength(7);
    const output = JSON.stringify(renderer.toJSON());
    for (const value of ['TUCSON', 'Rp 652.000.000', '6.500 km', 'Berlaku s/d 10/2031', car.showroom_address]) {
      expect(output).toContain(value);
    }
    expect(renderer.root.findAllByType(CarSpecificationCard).at(-1)?.props.value).toBeNull();
  });

  it('keeps back navigation available during loading and aborts on unmount', async () => {
    getCarMock.mockReturnValue(new Promise(() => {}));
    await renderScreen();
    expect(renderer.root.findByType(ActivityIndicator).props.accessibilityLabel).toBe('Memuat detail mobil');
    await press('Kembali ke Daftar Mobil');
    expect(goBack).toHaveBeenCalledTimes(1);
    const signal = getCarMock.mock.calls[0][1];
    act(() => renderer.unmount());
    expect(signal?.aborted).toBe(true);
  });

  it('displays API failures and retries the detail request', async () => {
    getCarMock.mockRejectedValueOnce(new Error('Validation failed (uuid is expected)'));
    await renderScreen();
    expect(JSON.stringify(renderer.toJSON())).toContain('Validation failed (uuid is expected)');
    await press('Coba Lagi');
    expect(getCarMock).toHaveBeenCalledTimes(2);
    expect(renderer.root.findAllByType(CarImageGallery)).toHaveLength(1);
  });

  it.each(['Edit foto mobil', 'Edit Mobil', 'Brosur / QR', 'Hapus Unit dari Katalog'])('routes %s to the logout screen', async label => {
    await renderScreen();
    await press(label);
    expect(navigate).toHaveBeenCalledWith('Logout');
    expect(patchMock).not.toHaveBeenCalled();
  });

  it('updates the selected image and reloads the server highlight state', async () => {
    await renderScreen();
    await press('Tampilkan foto 1');
    const updated = {...car.images[0], highlight: true};
    patchMock.mockResolvedValueOnce(updated);
    getCarMock.mockResolvedValueOnce({...car, images: car.images.map(image => ({...image, highlight: image.id === updated.id}))});
    await press('Ubah highlight foto');
    expect(patchMock).toHaveBeenCalledWith(updated.id, expect.any(AbortSignal));
    expect(getCarMock).toHaveBeenCalledTimes(2);
    const gallery = renderer.root.findByType(CarImageGallery);
    expect(gallery.props.images.filter((image: {highlight: boolean}) => image.highlight)).toEqual([updated]);
    expect(gallery.props.updating).toBe(false);
  });

  it('preserves the detail on PATCH failure and restores the highlight button', async () => {
    patchMock.mockRejectedValueOnce(new Error('Gambar mobil tidak ditemukan'));
    await renderScreen();
    await press('Ubah highlight foto');
    expect(JSON.stringify(renderer.toJSON())).toContain('Gambar mobil tidak ditemukan');
    expect(renderer.root.findByType(CarImageGallery).props.images).toEqual(car.images);
    expect(button('Ubah highlight foto').props.disabled).toBe(false);
  });

  it('blocks duplicate highlight requests and aborts a pending PATCH on unmount', async () => {
    patchMock.mockReturnValue(new Promise(() => {}));
    await renderScreen();
    act(() => {
      const highlight = renderer.root.findByType(CarImageGallery).props.onHighlight;
      highlight(car.images[0]);
      highlight(car.images[0]);
    });
    expect(patchMock).toHaveBeenCalledTimes(1);
    expect(button('Ubah highlight foto').props.disabled).toBe(true);
    const signal = patchMock.mock.calls[0][1];
    act(() => renderer.unmount());
    expect(signal?.aborted).toBe(true);
  });

  it.each([[320, 1, 'column'], [390, 1, 'row'], [768, 1, 'row'], [390, 1.5, 'column']])('adapts the specification grid at %spx and font scale %s', async (width, fontScale, direction) => {
    mockWidth = Number(width);
    mockFontScale = Number(fontScale);
    await renderScreen();
    const firstCard = renderer.root.findAllByType(CarSpecificationCard)[0];
    expect(StyleSheet.flatten(firstCard.parent?.props.style).flexDirection).toBe(direction);
  });
});

describe('image gallery', () => {
  async function renderGallery(images = car.images) {
    await act(async () => { renderer = ReactTestRenderer.create(<CarImageGallery images={images} name={car.name} onHighlight={jest.fn()} onEdit={jest.fn()} />); });
  }

  it('starts with the highlight, shows at most five thumbnails, and supports tapping and swiping', async () => {
    await renderGallery();
    expect(button('Tampilkan foto 2').props.accessibilityState.selected).toBe(true);
    const thumbnails = renderer.root.findAll(node => node.props.accessibilityLabel?.startsWith('Tampilkan foto') && typeof node.props.onPress === 'function');
    expect(new Set(thumbnails.map(node => node.props.accessibilityLabel)).size).toBe(5);
    await press('Tampilkan foto 3');
    expect(button('Tampilkan foto 3').props.accessibilityState.selected).toBe(true);
    const frame = renderer.root.findAllByType(View).find(node => node.props.onLayout);
    act(() => frame?.props.onLayout({nativeEvent: {layout: {width: 358}}}));
    act(() => renderer.root.findByType(ScrollView).props.onMomentumScrollEnd({nativeEvent: {contentOffset: {x: 358 * 5}}}));
    expect(button('Tampilkan foto 6').props.accessibilityState.selected).toBe(true);
    expect(renderer.root.findAllByType(AppButton).find(node => node.props.title === 'Ubah highlight foto')?.props.variant).toBe('neutral');
  });

  it('uses a fallback for failed photos and keeps the edit action when photos are empty', async () => {
    await renderGallery([car.images[0]]);
    const photo = renderer.root.findAllByType(Image)[0];
    act(() => photo.props.onError());
    expect(renderer.root.findAllByType(Image)).toHaveLength(0);
    act(() => renderer.update(<CarImageGallery images={[]} name={car.name} onHighlight={jest.fn()} onEdit={jest.fn()} />));
    expect(JSON.stringify(renderer.toJSON())).toContain('Foto belum tersedia');
    expect(button('Edit foto mobil')).toBeDefined();
    expect(renderer.root.findAllByType(AppButton)).toHaveLength(1);
  });
});

describe('validity date formatting', () => {
  it.each([null, '', 'invalid', '2031-02-29', '2031-13-01'])('hides invalid dates: %s', value => {
    expect(formatValidityPeriod(value)).toBeNull();
  });
  it('formats a calendar date without timezone shifts', () => {
    expect(formatValidityPeriod('2028-02-29')).toBe('Berlaku s/d 02/2028');
  });
});