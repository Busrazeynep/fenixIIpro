import React, { useEffect, useRef } from 'react';
import { View, AppState, AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator, navigationRef } from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';

const AUTO_LOCK_TIME = 30000; // 30 seconds

export default function App() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const lockApp = () => {
    if (navigationRef.isReady()) {
      const currentRoute = navigationRef.getCurrentRoute();
      if (currentRoute?.name !== 'Lock') {
        console.log('Locking app...');
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Lock' }],
        });
      }
    }
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lockApp();
    }, AUTO_LOCK_TIME);
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log('AppState dynamic change:', appStateRef.current, '->', nextAppState);
      
      // Herhangi bir şekilde arka plana geçerse (veya güç tuşuna basılırsa) anında kilitle
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        lockApp();
      }
      
      appStateRef.current = nextAppState;
      resetTimer();
    });

    resetTimer();
    return () => {
      subscription.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <View 
          style={{ flex: 1 }} 
          onStartShouldSetResponderCapture={() => {
            resetTimer();
            return false; // This allows the touch to pass through but triggers the function
          }}
        >
          <AppNavigator />
        </View>
        <StatusBar style="auto" hidden />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
