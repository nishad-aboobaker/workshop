import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/utils/ThemeContext';
import { type RootStackParamList, type MainTabParamList } from './src/types/navigation';
import { initDatabase } from './src/database/database';
import DashboardScreen from './src/screens/DashboardScreen';
import NewJobScreen from './src/screens/NewJobScreen';
import JobDetailScreen from './src/screens/JobDetailScreen';
import SplashScreen from './src/screens/SplashScreen';
import PaymentHistoryScreen from './src/screens/PaymentHistoryScreen';
import ExpenseScreen from './src/screens/ExpenseScreen';
import ProfitScreen from './src/screens/ProfitScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { Colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'DashboardTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'PaymentHistoryTab') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'ExpenseTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'ProfitTab') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: true,
        headerStyle: { backgroundColor: Colors.bg, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: Colors.border },
        headerTintColor: Colors.textDark,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.cardBg,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ title: 'Rana Motors' }}
      />
      <Tab.Screen
        name="PaymentHistoryTab"
        component={PaymentHistoryScreen}
        options={{ title: 'Payments' }}
      />
      <Tab.Screen
        name="ExpenseTab"
        component={ExpenseScreen}
        options={{ title: 'Expenses' }}
      />
      <Tab.Screen
        name="ProfitTab"
        component={ProfitScreen}
        options={{ title: 'Profit' }}
      />
    </Tab.Navigator>
  );
}

function MainApp() {
  const { Colors } = useTheme();

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bg },
          headerTintColor: Colors.textDark,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.bg },
        }}
      >
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="NewJob" 
          component={NewJobScreen}
          options={{ title: 'New Job Card', presentation: 'modal' }}
        />
        <Stack.Screen 
          name="JobDetail" 
          component={JobDetailScreen}
          options={{ title: 'Job Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialTheme, setInitialTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    initDatabase()
      .then(async () => {
        const { getSetting } = require('./src/database/database');
        const savedTheme = await getSetting('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setInitialTheme(savedTheme);
        }
        setReady(true);
      })
      .catch((err) => console.error('Database init failed:', err));
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <MainApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
