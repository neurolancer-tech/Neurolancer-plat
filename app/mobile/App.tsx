import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from 'react-native';
import RootNavigator from '@/navigation/RootNavigator';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { AuthProvider } from '@/contexts/AuthContext';

const queryClient = new QueryClient();

export default function App() {
  const scheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <ThemeProvider>
              <QueryClientProvider client={queryClient}>
                <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <RootNavigator />
                </NavigationContainer>
                <StatusBar style="light" backgroundColor="#0D9E86" />
              </QueryClientProvider>
            </ThemeProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
