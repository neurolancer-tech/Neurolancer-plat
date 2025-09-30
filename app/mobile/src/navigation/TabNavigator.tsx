import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Text, useColorScheme } from 'react-native';
import HomeScreen from '@/screens/HomeScreen';
import ExploreScreen from '@/screens/ExploreScreen';
import MessagesScreen from '@/screens/MessagesScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Messages: undefined;
  Notifications: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const scheme = useColorScheme();
  const BRAND_TEAL = '#0D9E86';
  const activeTint = scheme === 'dark' ? '#ffffff' : '#ffffff';
  const inactiveTint = scheme === 'dark' ? '#9ca3af' : '#6b7280';

  const labelFor = (r: string) => {
    switch (r) {
      case 'Home':
        return 'Home';
      case 'Explore':
        return 'Explore';
      case 'Messages':
        return 'Messages';
      case 'Notifications':
        return 'Notifications';
      default:
        return r;
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarActiveBackgroundColor: BRAND_TEAL,
        tabBarItemStyle: { marginHorizontal: 6, borderRadius: 16, paddingHorizontal: 4, paddingVertical: 0 },
        tabBarLabel: ({ color }) => (
          <Text
            style={{ color, fontSize: 10.5, textAlign: 'center', width: '100%', lineHeight: 12 }}
            numberOfLines={2}
          >
            {labelFor(route.name)}
          </Text>
        ),
        tabBarStyle: { height: 70, paddingBottom: 4, paddingTop: 2 },
        tabBarIcon: ({ color, size }) => {
          let name: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
          switch (route.name) {
            case 'Home':
              name = 'home-outline';
              break;
            case 'Explore':
              name = 'search-outline';
              break;
            case 'Messages':
              name = 'chatbubble-ellipses-outline';
              break;
            case 'Notifications':
              name = 'notifications-outline';
              break;
          }
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
    </Tab.Navigator>
  );
}
