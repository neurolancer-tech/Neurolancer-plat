import { View, Text, ScrollView, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';

export default function HomeScreen() {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <Animated.View
          style={{
            padding: 16,
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          <Text className="text-2xl font-bold text-primary">Neurolancer</Text>
          <Text className="text-base mt-2 text-gray-700 dark:text-gray-300">
            Welcome to the mobile app. This is the Home screen.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
