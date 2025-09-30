import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['top']}>
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg text-gray-800 dark:text-gray-100">Notifications</Text>
      </View>
    </SafeAreaView>
  );
}
