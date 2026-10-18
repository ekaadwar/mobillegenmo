import React from 'react';

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {faCar} from '@fortawesome/free-solid-svg-icons/faCar';
import {faGaugeHigh} from '@fortawesome/free-solid-svg-icons/faGaugeHigh';
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus';
import {faSliders} from '@fortawesome/free-solid-svg-icons/faSliders';
import {faUser} from '@fortawesome/free-solid-svg-icons/faUser';

import {WelcomeScreen} from '../screens/home/WelcomeScreen.tsx';
import {CatalogScreen} from '../screens/catalog/CatalogScreen';
import {CarDetailScreen} from '../screens/catalog/CarDetailScreen';
import {CarAddScreen, CarFormScreen} from '../screens/catalog/CarFormScreen';
import {AppHeader} from '../components/layout/AppHeader';
import {AppIcon} from '../components/ui/AppIcon';
import {AppDrawerParamList, AppTabParamList, CatalogStackParamList} from './types';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const Tabs = createBottomTabNavigator<AppTabParamList>();
const Drawer = createDrawerNavigator<AppDrawerParamList>();
const CatalogStack = createNativeStackNavigator<CatalogStackParamList>();

function CatalogNavigator() {
  return (
    <CatalogStack.Navigator screenOptions={{headerShown: false}}>
      <CatalogStack.Screen name="CatalogList" component={CatalogScreen} />
      <CatalogStack.Screen name="CarDetail" component={CarDetailScreen} />
      <CatalogStack.Screen name="CarForm" component={CarFormScreen} />
      <CatalogStack.Screen name="Logout" component={WelcomeScreen} />
    </CatalogStack.Navigator>
  );
}

function AuthenticatedHeader() {
  return <AppHeader />;
}

function DashboardTabIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faGaugeHigh} size={size} color={color} />;
}

function CatalogTabIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faCar} size={size} color={color} />;
}

function AddCarTabIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faPlus} size={size} color={color} />;
}

function ControlsTabIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faSliders} size={size} color={color} />;
}

function AccountTabIcon({color, size}: {color: string; size: number}) {
  return <AppIcon icon={faUser} size={size} color={color} />;
}

function AuthenticatedTabs() {
  return (
    <Tabs.Navigator
      initialRouteName="Catalog"
      screenOptions={{
        header: AuthenticatedHeader,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutral,
        tabBarLabelStyle: {
          fontFamily: typography.regular,
          fontSize: 10,
        },
        tabBarStyle: {
          minHeight: 60,
          paddingTop: 4,
          backgroundColor: colors.surface,
          borderTopColor: colors.background,
        },
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen
        name="Dashboard"
        component={WelcomeScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: DashboardTabIcon,
        }}
      />
      <Tabs.Screen
        name="Catalog"
        component={CatalogNavigator}
        options={{
          title: 'Katalog',
          tabBarLabel: 'Katalog',
          tabBarIcon: CatalogTabIcon,
        }}
      />
      <Tabs.Screen
        name="AddCar"
        component={CarAddScreen}
        options={{
          title: 'Tambah Mobil',
          tabBarLabel: 'Tambah',
          tabBarAccessibilityLabel: 'Tambah Mobil',
          tabBarIcon: AddCarTabIcon,
        }}
      />
      <Tabs.Screen
        name="Controls"
        component={WelcomeScreen}
        options={{
          title: 'Controls',
          tabBarLabel: 'Controls',
          tabBarIcon: ControlsTabIcon,
        }}
      />
      <Tabs.Screen
        name="Account"
        component={WelcomeScreen}
        options={{
          title: 'Akun',
          tabBarLabel: 'Akun',
          tabBarIcon: AccountTabIcon,
        }}
      />
    </Tabs.Navigator>
  );
}

export function AppDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
      }}>
      <Drawer.Screen name="Main" component={AuthenticatedTabs} />
    </Drawer.Navigator>
  );
}