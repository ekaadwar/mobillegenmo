import React from 'react';
import {Image, Text} from 'react-native';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {CarCard} from '../android/app/src/components/cars/CarCard';
import {Car} from '../android/app/src/types/car';
import {CatalogScreen} from '../android/app/src/screens/catalog/CatalogScreen';
import {AppTextInput} from '../android/app/src/components/ui/AppTextInput';
import {AppButton} from '../android/app/src/components/ui/AppButton';
import {CarPagination} from '../android/app/src/components/cars/CarPagination';
import {CarCardSkeleton} from '../android/app/src/components/cars/CarCardSkeleton';
import {YearRangeFilter} from '../android/app/src/components/cars/YearRangeFilter';
import {getCachedCars, getCars} from '../android/app/src/services/carService';
import {ApiError} from '../android/app/src/services/apiClient';

import {useDebounce} from '../android/app/src/hooks/useDebounce';
import {normalizeYearRange} from '../android/app/src/components/cars/YearRangeFilter';

const mockNavigate = jest.fn();
let mockFocused = true;
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({navigate: mockNavigate}),
  useIsFocused: () => mockFocused,
}));
jest.mock('../android/app/src/services/carService', () => ({
  ...jest.requireActual('../android/app/src/services/carService'),
  getCars: jest.fn(), getCachedCars: jest.fn(),
}));

const fixture: Car = {
  id: 'car', name: 'TUCSON', manufacturer: 'Hyundai', year: 2026,
  price: 652000000, description: null, status: 'ready', color: null,
  transmission: null, mileage: null, validity_period: null,
  images: [{id: 'image', url: 'https://example.com/car.jpg', highlight: true}],
};

function DebounceProbe({value}: {value: string}) {
  const debouncedValue = useDebounce(value, 1000);
  return <Text>{debouncedValue}</Text>;
}

describe('catalog filter behavior', () => {
  it.each([true, false])('selects the catalog image with highlight=%s', highlight => {
    const car: Car = {
      id: 'car', name: 'TUCSON', manufacturer: 'Hyundai', year: 2026,
      price: 652000000, description: null, status: 'ready', color: null,
      transmission: null, mileage: null, validity_period: null,
      images: [
        {id: 'first', url: 'https://example.com/first.jpg', highlight: false},
        {id: 'second', url: 'https://example.com/second.jpg', highlight},
      ],
    };
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    act(() => { renderer = ReactTestRenderer.create(<CarCard car={car} onDetail={jest.fn()} />); });
    expect(renderer.root.findByType(Image).props.source.uri).toBe(
      `https://example.com/${highlight ? 'second' : 'first'}.jpg`,
    );
    act(() => renderer.unmount());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('waits 1000ms and restarts the debounce on rapid input changes', () => {
    jest.useFakeTimers();
    let renderer!: ReactTestRenderer.ReactTestRenderer;

    act(() => {
      renderer = ReactTestRenderer.create(<DebounceProbe value="M" />);
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    act(() => {
      renderer.update(<DebounceProbe value="Ma" />);
    });
    act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(renderer.root.findByType(Text).props.children).toBe('M');

    act(() => jest.advanceTimersByTime(1));
    expect(renderer.root.findByType(Text).props.children).toBe('Ma');
    act(() => renderer.unmount());
  });

  it('normalizes reversed and identical year selections', () => {
    expect(normalizeYearRange(2026, 2019)).toEqual({start_year: 2019, end_year: 2026});
    expect(normalizeYearRange(2022, 2022)).toEqual({start_year: 2022, end_year: 2022});
  });
});

describe('catalog screen and actions', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  const response = {data: [fixture], page: 1, perpage: 8, total: 12, totalPages: 2};
  beforeEach(() => {
    mockFocused = true;
    jest.clearAllMocks();
    jest.mocked(getCachedCars).mockReset();
    jest.mocked(getCars).mockReset().mockResolvedValue(response);
  });
  afterEach(() => {
    act(() => renderer.unmount());
    jest.useRealTimers();
  });
  async function render() {
    await act(async () => { renderer = ReactTestRenderer.create(<CatalogScreen />); });
  }

  it('loads cars and opens detail with the selected ID', async () => {
    await render();
    act(() => renderer.root.findByType(CarCard).props.onDetail(fixture));
    expect(mockNavigate).toHaveBeenCalledWith('CarDetail', {carId: fixture.id});
  });

  it('uses cached responses and rechecks the cache when regaining focus', async () => {
    jest.mocked(getCachedCars).mockReturnValue(response);
    await render();
    expect(getCars).not.toHaveBeenCalled();
    mockFocused = false;
    act(() => renderer.update(<CatalogScreen />));
    jest.mocked(getCachedCars).mockReturnValue(undefined);
    mockFocused = true;
    await act(async () => { renderer.update(<CatalogScreen />); });
    expect(getCars).toHaveBeenCalledTimes(1);
  });

  it('shows skeletons while loading and aborts on unmount', async () => {
    jest.mocked(getCars).mockReturnValue(new Promise(() => {}));
    await render();
    expect(renderer.root.findAllByType(CarCardSkeleton)).toHaveLength(2);
    const signal = jest.mocked(getCars).mock.calls[0][1];
    act(() => renderer.unmount());
    expect(signal?.aborted).toBe(true);
  });

  it.each([new ApiError('Server unavailable', 500), new Error('Network')])('shows failures and retries without losing filters', async error => {
    jest.mocked(getCars).mockRejectedValueOnce(error);
    await render();
    expect(renderer.root.findAllByType(Text).map(node => node.props.children)).toContain('Katalog tidak dapat dimuat');
    const retry = renderer.root.findAll(node => node.props.accessibilityLabel === 'Coba lagi memuat katalog' && node.props.onPress)[0];
    await act(async () => { retry.props.onPress(); });
    expect(getCars).toHaveBeenCalledTimes(2);
    expect(renderer.root.findByType(CarCard)).toBeDefined();
  });

  it('debounces a search, shows filtered emptiness, and clears the query', async () => {
    jest.useFakeTimers();
    await render();
    act(() => renderer.root.findByType(AppTextInput).props.onChangeText('Mazda'));
    expect(getCars).toHaveBeenCalledTimes(1);
    jest.mocked(getCars).mockResolvedValueOnce({...response, data: []});
    await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
    expect(getCars).toHaveBeenLastCalledWith({page: 1, perpage: 8, name: 'Mazda'}, expect.any(AbortSignal));
    expect(renderer.root.findAllByType(Text).map(node => node.props.children)).toContain('Mobil tidak ditemukan');
    act(() => renderer.root.findByType(AppTextInput).props.rightAction.onPress());
    await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
    expect(getCars).toHaveBeenLastCalledWith({page: 1, perpage: 8}, expect.any(AbortSignal));
  });

  it('combines year filtering and pagination', async () => {
    await render();
    await act(async () => { renderer.root.findByType(YearRangeFilter).props.onChange({start_year: 2020, end_year: 2026}); });
    await act(async () => { renderer.root.findByType(CarPagination).props.onPageChange(2); });
    expect(getCars).toHaveBeenLastCalledWith({page: 2, perpage: 8, start_year: 2020, end_year: 2026}, expect.any(AbortSignal));
  });

  it('renders an unfiltered empty catalog', async () => {
    jest.mocked(getCars).mockResolvedValueOnce({...response, data: []});
    await render();
    expect(renderer.root.findAllByType(Text).map(node => node.props.children)).toContain('Katalog masih kosong');
  });

  it('connects all card actions and handles failed images', () => {
    const onDetail = jest.fn();
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    act(() => { renderer = ReactTestRenderer.create(<CarCard car={fixture} onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} />); });
    act(() => {
      renderer.root.findAllByType(AppButton).forEach(button => button.props.onPress());
      renderer.root.findByType(Image).props.onError();
    });
    expect(onDetail).toHaveBeenCalledWith(fixture);
    expect(onEdit).toHaveBeenCalledWith(fixture);
    expect(onDelete).toHaveBeenCalledWith(fixture);
    expect(renderer.root.findAllByType(Image)).toHaveLength(0);
  });
});