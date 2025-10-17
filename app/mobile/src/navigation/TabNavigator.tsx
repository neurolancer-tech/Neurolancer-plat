import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Text, useColorScheme } from 'react-native';
import HomeScreen from '@/screens/HomeScreen';
import GigsScreen from '@/screens/GigsScreen';
import JobsScreen from '@/screens/JobsScreen';
import FreelancersScreen from '@/screens/FreelancersScreen';
import MessagesScreen from '@/screens/MessagesScreen';

export type TabParamList = {
  Home: undefined;
  Gigs: undefined;
  Jobs: undefined;
  Freelancers: undefined;
  Messages: undefined;
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
      case 'Gigs':
        return 'Gigs';
      case 'Jobs':
        return 'Jobs';
      case 'Freelancers':
        return 'Freelancers';
      case 'Messages':
        return 'Messages';
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
            case 'Gigs':
              name = 'briefcase-outline';
              break;
            case 'Jobs':
              name = 'document-text-outline';
              break;
            case 'Freelancers':
              name = 'people-outline';
              break;
            case 'Messages':
              name = 'chatbubble-ellipses-outline';
              break;
          }
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Gigs" component={GigsScreen} />
      <Tab.Screen name="Jobs" component={JobsScreen} />
      <Tab.Screen name="Freelancers" component={FreelancersScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
    </Tab.Navigator>
  );
}
