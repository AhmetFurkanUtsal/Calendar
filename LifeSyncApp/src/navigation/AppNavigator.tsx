import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';

// Screens
import {SplashScreen} from '../screens/onboarding/SplashScreen';
import {OnboardingScreen} from '../screens/onboarding/OnboardingScreen';
import {LoginScreen} from '../screens/auth/LoginScreen';
import {RegisterScreen} from '../screens/auth/RegisterScreen';
import {LifestyleSelectionScreen} from '../screens/auth/LifestyleSelectionScreen';

// Main Tab Screens
import {HomeScreen} from '../screens/HomeScreen';
import {CalendarScreen} from '../screens/CalendarScreen';
import {TasksScreen} from '../screens/TasksScreen';
import {NotesScreen} from '../screens/NotesScreen';
import {AIAssistantScreen} from '../screens/AIAssistantScreen';

import {useAuthStore} from '../stores/authStore';
import {DesignSystem} from '../theme/designSystem';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({color, size}) => {
          let iconName = 'home';

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Calendar':
              iconName = 'calendar';
              break;
            case 'Tasks':
              iconName = 'check-square';
              break;
            case 'Notes':
              iconName = 'book-open';
              break;
            case 'AI':
              iconName = 'cpu';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: DesignSystem.colors.primary[500],
        tabBarInactiveTintColor: DesignSystem.colors.neutral[400],
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: DesignSystem.colors.neutral[200],
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{title: 'Ana Sayfa'}}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{title: 'Takvim'}}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{title: 'Görevler'}}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{title: 'Notlar'}}
      />
      <Tab.Screen
        name="AI"
        component={AIAssistantScreen}
        options={{title: 'AI Asistan'}}
      />
    </Tab.Navigator>
  );
};

// Ana Navigator
export const AppNavigator = () => {
  const {isAuthenticated, isLoading} = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName="Splash">
        {!isAuthenticated ? (
          // Auth Flow Screens
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="LifestyleSelection"
              component={LifestyleSelectionScreen}
            />
          </>
        ) : (
          // Main App
          <Stack.Screen
            name="MainApp"
            component={MainTabNavigator}
            options={{gestureEnabled: false}} // Back gesture'ını disable et
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
