import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LanguageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Language</Text>
      <Text>Select your preferred language here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
});
