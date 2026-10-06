import React from 'react';

import {createDrawerNavigator} from '@react-navigation/drawer';

import {WelcomeScreen} from '../screens/home/WelcomeScreen.tsx';
import {AppDrawerParamList} from './types';

const Drawer =
  createDrawerNavigator<AppDrawerParamList>();

export function AppDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
      }}>
      <Drawer.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{
          title: 'Welcome',
        }}
      />
    </Drawer.Navigator>
  );
}