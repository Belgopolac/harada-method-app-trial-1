import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/types';
import HomeScreen from './src/screens/HomeScreen';
import GridListScreen from './src/screens/GridListScreen';
import GridDetailScreen from './src/screens/GridDetailScreen';
import GridEditorScreen from './src/screens/GridEditorScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import DailyRoutineScreen from './src/screens/DailyRoutineScreen';
import DiaryScreen from './src/screens/DiaryScreen';
import DiaryEditorScreen from './src/screens/DiaryEditorScreen';
import WeatherScreen from './src/screens/WeatherScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => (
  <NavigationContainer>
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: '#6200EE' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: '#F5F5F5' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Harada Method' }} />
      <Stack.Screen name="GridList" component={GridListScreen} options={{ title: 'My Goals' }} />
      <Stack.Screen name="GridDetail" component={GridDetailScreen} options={{ title: 'Goal Details' }} />
      <Stack.Screen name="GridEditor" component={GridEditorScreen} options={{ title: 'Edit Goal' }} />
      <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendar' }} />
      <Stack.Screen name="DailyRoutine" component={DailyRoutineScreen} options={{ title: 'Daily Routine' }} />
      <Stack.Screen name="Diary" component={DiaryScreen} options={{ title: 'Diary' }} />
      <Stack.Screen name="DiaryEditor" component={DiaryEditorScreen} options={{ title: 'Diary Entry' }} />
      <Stack.Screen name="Weather" component={WeatherScreen} options={{ title: 'Weather' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default App;
