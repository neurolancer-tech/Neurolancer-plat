import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BRAND_TEAL = '#0D9E86';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 8 }}
    >
      <View style={styles.headerCard}>
        <View style={styles.brandDot} />
        <Text style={styles.brandText} numberOfLines={1}>Neurolancer</Text>
      </View>
      <View style={{ height: 8 }} />
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND_TEAL,
    marginRight: 8,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
});
