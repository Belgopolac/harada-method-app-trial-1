Here is **the complete, fixed codebase** with all 31 files in one consolidated response:

---

---

# **📁 CONFIGURATION FILES (7)**

---

## **1. package.json**
```json
{
  "name": "harada-method-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.18.0",
    "@react-native-community/datetimepicker": "^7.0.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "react": "18.2.0",
    "react-native": "0.72.0",
    "react-native-calendars": "^1.1295.0",
    "react-native-gesture-handler": "^2.9.0",
    "react-native-permissions": "^3.8.0",
    "react-native-reanimated": "^3.3.0",
    "react-native-safe-area-context": "^4.6.0",
    "react-native-screens": "^3.20.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@babel/preset-env": "^7.20.0",
    "@babel/preset-react": "^7.18.6",
    "@babel/preset-typescript": "^7.18.6",
    "@types/react": "^18.0.24",
    "@types/react-test-renderer": "^18.0.0",
    "@typescript-eslint/eslint-plugin": "^5.57.0",
    "@typescript-eslint/parser": "^5.57.0",
    "babel-jest": "^29.2.1",
    "eslint": "^8.37.0",
    "jest": "^29.2.1",
    "metro-react-native-babel-preset": "0.76.8",
    "prettier": "^2.8.4",
    "react-test-renderer": "18.2.0",
    "typescript": "4.9.4"
  }
}
```

---

## **2. app.json**
```json
{
  "name": "HaradaMethod",
  "displayName": "Harada Method",
  "expo": {
    "sdkVersion": ">=48.0.0",
    "platforms": ["ios", "android"]
  },
  "version": "1.0.0",
  "orientation": "portrait",
  "icon": "./assets/icon.png",
  "userInterfaceStyle": "automatic",
  "splash": {
    "image": "./assets/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#6200EE"
  },
  "assetBundlePatterns": ["**/*"],
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.harada.method",
    "infoPlist": {
      "NSCalendarsUsageDescription": "Harada Method needs access to your calendar to add goal actions as events"
    }
  },
  "android": {
    "package": "com.harada.method",
    "permissions": [
      "android.permission.READ_CALENDAR",
      "android.permission.WRITE_CALENDAR"
    ]
  }
}
```

---

## **3. tsconfig.json**
```json
{
  "compilerOptions": {
    "allowJs": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "jsx": "react-native",
    "lib": ["es2017"],
    "moduleResolution": "node",
    "noEmit": true,
    "strict": true,
    "target": "esnext",
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "exclude": ["node_modules"],
  "include": ["**/*.ts", "**/*.tsx"]
}
```

---

## **4. babel.config.js**
```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['react-native-reanimated/plugin'],
  ],
};
```

---

## **5. metro.config.js**
```javascript
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

---

## **6. react-native.config.js**
```javascript
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/'],
};
```

---

## **7. index.js**
```javascript
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

---

---

# **📁 CORE APP FILES (2)**

---

## **8. App.tsx**
```typescript
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
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6200EE',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#F5F5F5',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Harada Method' }}
        />
        <Stack.Screen
          name="GridList"
          component={GridListScreen}
          options={{ title: 'My Goals' }}
        />
        <Stack.Screen
          name="GridDetail"
          component={GridDetailScreen}
          options={{ title: 'Goal Details' }}
        />
        <Stack.Screen
          name="GridEditor"
          component={GridEditorScreen}
          options={{ title: 'Edit Goal' }}
        />
        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ title: 'Calendar' }}
        />
        <Stack.Screen
          name="DailyRoutine"
          component={DailyRoutineScreen}
          options={{ title: 'Daily Routine' }}
        />
        <Stack.Screen
          name="Diary
