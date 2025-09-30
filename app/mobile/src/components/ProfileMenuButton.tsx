import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Pressable, Text, Modal, Animated, Easing, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';

const BRAND_TEAL = '#0D9E86';

export default function ProfileMenuButton() {
  const { user, setUser } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: 160,
      easing: open ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [open, anim]);

  const menuItems = useMemo(() => [
    {
      key: 'profile',
      label: 'Profile',
      icon: 'person-circle-outline' as const,
      onPress: () => {
        setOpen(false);
        // Navigate to Settings for now as Profile screen isn't built yet
        navigation.navigate('Settings' as never);
      },
    },
    {
      key: 'messages',
      label: 'Messages',
      icon: 'chatbubble-ellipses-outline' as const,
      onPress: () => {
        setOpen(false);
        // Navigate to Messages tab
        navigation.navigate('Tabs' as never, { screen: 'Messages' } as never);
      },
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: 'notifications-outline' as const,
      onPress: () => {
        setOpen(false);
        navigation.navigate('Tabs' as never, { screen: 'Notifications' } as never);
      },
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: 'settings-outline' as const,
      onPress: () => {
        setOpen(false);
        navigation.navigate('Settings' as never);
      },
    },
    {
      key: 'help',
      label: 'Help & Support',
      icon: 'help-circle-outline' as const,
      onPress: () => {
        setOpen(false);
        navigation.navigate('Help' as never);
      },
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: 'log-out-outline' as const,
      onPress: () => {
        setOpen(false);
        setUser(null);
      },
    },
  ], [navigation, setUser, setOpen]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] });
  const opacity = anim;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((v) => !v)}
        style={{ paddingHorizontal: 12, paddingVertical: 4 }}
      >
        <Ionicons name="person-circle-outline" size={28} color="#fff" />
      </Pressable>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Animated.View
            style={[
              styles.menu,
              {
                marginTop: insets.top + 64,
                right: 12,
                opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
          >
            <View style={styles.pointer} />
            <View style={styles.headerStrip} />
            <View style={styles.header}>
              <Ionicons name="person-circle" size={24} color={BRAND_TEAL} />
              <Text style={styles.headerText}>
                {user?.first_name || user?.username || user?.email || 'Guest'}
              </Text>
            </View>
            {menuItems.map((item) => (
              <Pressable
                key={item.key}
                onPress={item.onPress}
                android_ripple={{ color: '#e5e7eb' }}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <View style={styles.leftRow}>
                  <Ionicons name={item.icon} size={18} color={BRAND_TEAL} />
                  <Text style={styles.itemText} numberOfLines={2} ellipsizeMode="tail">
                    {item.label}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6b7280" style={styles.chevron} />
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    minWidth: 280,
    maxWidth: 360,
    alignSelf: 'flex-end',
  },
  pointer: {
    position: 'absolute',
    top: -6,
    right: 22,
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }],
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  headerStrip: {
    height: 3,
    backgroundColor: BRAND_TEAL,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    marginHorizontal: -8,
    marginTop: -6,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomColor: '#eef2f7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  headerText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flexShrink: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    width: '100%',
    minHeight: 44,
  },
  itemPressed: {
    backgroundColor: '#f3f4f6',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  chevron: {
    marginLeft: 'auto',
  },
  itemText: {
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 18,
    color: '#111827',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
});
