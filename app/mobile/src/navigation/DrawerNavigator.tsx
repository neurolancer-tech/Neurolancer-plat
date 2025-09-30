import { createDrawerNavigator, DrawerToggleButton } from '@react-navigation/drawer';
import TabNavigator from '@/navigation/TabNavigator';
import SettingsScreen from '@/screens/Settings/SettingsScreen';
import HelpScreen from '@/screens/Settings/LanguageScreen';
import ProfileMenuButton from '@/components/ProfileMenuButton';
import CustomDrawerContent from '@/components/CustomDrawerContent';
import { Ionicons } from '@expo/vector-icons';

const BRAND_TEAL = '#0D9E86';

export type DrawerParamList = {
  Tabs: undefined;
  Settings: undefined;
  Help: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: BRAND_TEAL },
        headerTintColor: '#ffffff',
        headerTitle: 'Neurolancer',
        headerTitleStyle: { color: '#ffffff', fontWeight: '600' },
        headerLeft: () => <DrawerToggleButton tintColor="#ffffff" />,
        headerRight: () => <ProfileMenuButton />,
        drawerActiveBackgroundColor: BRAND_TEAL,
        drawerActiveTintColor: '#ffffff',
        drawerInactiveTintColor: '#111827',
        drawerItemStyle: { borderRadius: 8, marginVertical: 4 },
        drawerLabelStyle: { fontSize: 16, flexWrap: 'wrap' },
        drawerIcon: ({ color, size }) => {
          let name: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
          switch (route.name) {
            case 'Tabs':
              name = 'home-outline';
              break;
            case 'Settings':
              name = 'settings-outline';
              break;
            case 'Help':
              name = 'help-circle-outline';
              break;
          }
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Drawer.Screen name="Tabs" component={TabNavigator} options={{ title: 'Home' }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Drawer.Screen name="Help" component={HelpScreen} options={{ title: 'Help & Support' }} />
    </Drawer.Navigator>
  );
}
