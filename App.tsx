// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, Platform, AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { HomeScreen } from './src/screens/HomeScreen';
import { TodosScreen } from './src/screens/TodosScreen';
import { RemindersScreen } from './src/screens/RemindersScreen';
import { UsageScreen } from './src/screens/UsageScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { InstalledAppsScreen } from './src/screens/InstalledAppsScreen';
import { useStore } from './src/store';
import { initNotifications } from './src/utils/notifications';
import { COLORS } from './src/utils/theme';

export type RootStackParamList = {
  Home: undefined;
  Todos: undefined;
  Reminders: undefined;
  Usage: undefined;
  Settings: undefined;
  InstalledApps: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  const { loadData, startSession, endSession } = useStore();

  useEffect(() => {
    // Load persisted data
    loadData();

    // Init notifications
    initNotifications();

    // Track app session via AppState
    startSession();
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        startSession();
      } else if (nextState === 'background' || nextState === 'inactive') {
        endSession();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      sub.remove();
      endSession();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.paperWhite}
          translucent={false}
        />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              // E-ink feel: subtle, not flashy transitions
              cardStyleInterpolator: ({ current, layouts }) => ({
                cardStyle: {
                  opacity: current.progress,
                  transform: [
                    {
                      translateY: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                    },
                  ],
                },
              }),
              transitionSpec: {
                open: { animation: 'timing', config: { duration: 240 } },
                close: { animation: 'timing', config: { duration: 200 } },
              },
              cardStyle: { backgroundColor: COLORS.paperWhite },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Todos" component={TodosScreen} />
            <Stack.Screen name="Reminders" component={RemindersScreen} />
            <Stack.Screen name="Usage" component={UsageScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="InstalledApps" component={InstalledAppsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
