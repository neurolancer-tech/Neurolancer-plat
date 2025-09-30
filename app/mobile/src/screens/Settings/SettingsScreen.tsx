import { View, Text, Pressable } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { useCurrencyContext } from '@/contexts/CurrencyContext';

export default function SettingsScreen() {
  const { theme, toggleTheme } = useThemeContext();
  const { language } = useLanguageContext();
  const { currency } = useCurrencyContext();
  return (
    <View className="flex-1 bg-white dark:bg-black p-4 gap-3">
      <Text className="text-xl font-semibold text-gray-900 dark:text-gray-100">Settings</Text>
      <View className="mt-2">
        <Text className="text-base text-gray-700 dark:text-gray-300">Theme: {theme}</Text>
        <Pressable onPress={toggleTheme} className="mt-2 px-4 py-2 bg-primary rounded-lg">
          <Text className="text-white text-center">Toggle Theme</Text>
        </Pressable>
      </View>
      <View className="mt-4">
        <Text className="text-base text-gray-700 dark:text-gray-300">Language: {language.toUpperCase()}</Text>
      </View>
      <View className="mt-4">
        <Text className="text-base text-gray-700 dark:text-gray-300">Currency: {currency}</Text>
      </View>
    </View>
  );
}
