import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Home, Calendar, CheckSquare, BookOpen, Cpu} from 'lucide-react-native';

import {HomeScreen} from '../screens/HomeScreen';
import {CalendarScreen} from '../screens/CalendarScreen';
import {TasksScreen} from '../screens/TasksScreen';
import {NotesScreen} from '../screens/NotesScreen';
import {AIAssistantScreen} from '../screens/AIAssistantScreen';
import {DesignSystem} from '../theme/designSystem';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({color, size}) => {
            switch (route.name) {
              case 'Home':
                return <Home size={size} color={color} />;
              case 'Calendar':
                return <Calendar size={size} color={color} />;
              case 'Tasks':
                return <CheckSquare size={size} color={color} />;
              case 'Notes':
                return <BookOpen size={size} color={color} />;
              case 'AI':
                return <Cpu size={size} color={color} />;
              default:
                return <Home size={size} color={color} />;
            }
          },
          tabBarActiveTintColor: DesignSystem.Colors.primary[500],
          tabBarInactiveTintColor: DesignSystem.Colors.neutral[400],
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: DesignSystem.Colors.neutral[200],
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
    </NavigationContainer>
  );
};
