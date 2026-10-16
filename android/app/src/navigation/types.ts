import {Car} from '../types/car';

export type AuthStackParamList = {
  Login: undefined;
};

export type CarFormSource = 'catalog' | 'detail';

export type CatalogStackParamList = {
  CatalogList: undefined;
  CarDetail: {carId: string; refreshKey?: number};
  CarForm: {carId: string; car?: Car; source: CarFormSource};
  Logout: undefined;
};

export type AppTabParamList = {
  Dashboard: undefined;
  Catalog: undefined;
  AddCar: undefined;
  Controls: undefined;
  Account: undefined;
};

export type AppDrawerParamList = {
  Main: undefined;
};