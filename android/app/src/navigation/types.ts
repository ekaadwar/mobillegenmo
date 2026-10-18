import {Car} from '../types/car';
import {NavigatorScreenParams} from '@react-navigation/native';

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
  Catalog: NavigatorScreenParams<CatalogStackParamList> | undefined;
  AddCar: undefined;
  Controls: undefined;
  Account: undefined;
};

export type AppDrawerParamList = {
  Main: undefined;
};