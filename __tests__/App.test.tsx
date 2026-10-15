/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import * as Keychain from 'react-native-keychain';
import {getCar, getCars} from '../android/app/src/services/carService';
import {LoginScreen} from '../android/app/src/screens/auth/LoginScreen';
import {CarDetailScreen} from '../android/app/src/screens/catalog/CarDetailScreen';
import {CarCard} from '../android/app/src/components/cars/CarCard';
import {CarDetail} from '../android/app/src/types/car';

jest.mock('react-native-keychain', () => ({getGenericPassword: jest.fn(), resetGenericPassword: jest.fn()}));
jest.mock('../android/app/src/services/carService', () => ({
  ...jest.requireActual('../android/app/src/services/carService'),
  getCars: jest.fn(), getCar: jest.fn(),
}));

let renderer: ReactTestRenderer.ReactTestRenderer;
afterEach(() => { ReactTestRenderer.act(() => renderer.unmount()); });

test('renders the login navigator after an unauthenticated bootstrap', async () => {
  jest.mocked(Keychain.getGenericPassword).mockResolvedValue(false);
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  expect(renderer.root.findByType(LoginScreen)).toBeDefined();
});

test('navigates from the selected catalog card to detail and back', async () => {
  const car: CarDetail = {
    id: 'selected-car', name: 'TUCSON', manufacturer: 'Hyundai', year: 2026, price: 652000000,
    description: null, status: 'ready', color: null, transmission: null, mileage: 6500,
    validity_period: null, images: [], fuel: null, registration_number: null,
    showroom_name: null, showroom_address: null,
  };
  jest.mocked(Keychain.getGenericPassword).mockResolvedValue({
    username: 'session', password: JSON.stringify({accessToken: 'test-token', tokenType: 'Bearer', expiresAt: Date.now() + 60000}),
    service: 'mobillegend.auth.session', storage: Keychain.STORAGE_TYPE?.AES_GCM_NO_AUTH,
  });
  jest.mocked(getCars).mockResolvedValue({data: [car], page: 1, perpage: 8, total: 1, totalPages: 1});
  jest.mocked(getCar).mockResolvedValue(car);
  await ReactTestRenderer.act(async () => { renderer = ReactTestRenderer.create(<App />); });
  await ReactTestRenderer.act(async () => { renderer.root.findByType(CarCard).props.onDetail(car); });
  expect(getCar).toHaveBeenCalledWith(car.id, expect.any(AbortSignal));
  expect(renderer.root.findByType(CarDetailScreen).props.route.params.carId).toBe(car.id);
  await ReactTestRenderer.act(async () => { renderer.root.findByType(CarDetailScreen).props.navigation.goBack(); });
  expect(renderer.root.findAllByType(CarDetailScreen)).toHaveLength(0);
  expect(renderer.root.findByType(CarCard).props.car.id).toBe(car.id);
});
