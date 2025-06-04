import React, { useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';

// Import screens
import { DashboardScreen } from './src/screens/DashboardScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { AchievementsScreen } from './src/screens/AchievementsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { TripDetailsScreen } from './src/screens/TripDetailsScreen';
import { SplashScreen } from './src/screens/SplashScreen';

// Import services
import { notificationService } from './src/services/notificationService';
import { persistenceService } from './src/services/persistenceService';
import { achievementService } from './src/services/achievementService';

// Types
import { Colors } from './src/theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = '';

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'airplane' : 'airplane-outline';
              break;
            case 'Alerts':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'Achievements':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.lightGray,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'My Trips' }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsScreen}
        options={{ title: 'Price Alerts' }}
      />
      <Tab.Screen 
        name="Achievements" 
        component={AchievementsScreen}
        options={{ title: 'Achievements' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Main App Component
function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize services
      await persistenceService.initialize();
      await achievementService.initialize();
      await setupNotifications();
      
      // Check daily streak
      achievementService.checkDailyStreak();
      
      // Simulate loading
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsLoading(false);
    }
  };

  const setupNotifications = async () => {
    // Request permissions
    await notifee.requestPermission();

    // Create notification channel for Android
    await notifee.createChannel({
      id: 'price-alerts',
      name: 'Price Alerts',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });

    await notifee.createChannel({
      id: 'achievements',
      name: 'Achievements',
      importance: AndroidImportance.DEFAULT,
      vibration: true,
      sound: 'default',
    });
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={Colors.primary}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen 
          name="TripDetails" 
          component={TripDetailsScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: Colors.primary,
            },
            headerTintColor: Colors.white,
            headerTitle: 'Trip Details',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;