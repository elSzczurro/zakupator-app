import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import SellScreen from './src/SellScreen';
import BuyScreen from './src/BuyScreen';
import { c } from './src/theme';

const Tab = createBottomTabNavigator();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: c.bg, card: c.bg, border: c.line, primary: c.green, text: c.text },
};

export default function App() {
  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: c.bg },
          headerTitleStyle: { color: c.text, fontWeight: '700' },
          headerShadowVisible: false,
          tabBarActiveTintColor: c.green,
          tabBarInactiveTintColor: c.dim,
          tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={route.name === 'Sprzedaj' ? 'camera' : 'search'} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Sprzedaj" component={SellScreen} options={{ title: 'Sprzedaj' }} />
        <Tab.Screen name="Kup" component={BuyScreen} options={{ title: 'Kup' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
