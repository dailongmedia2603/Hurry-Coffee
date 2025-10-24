import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Slot } from 'expo-router';
import Sidebar from './Sidebar';

const DesktopAdminLayout = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Sidebar />
        <View style={styles.mainContent}>
          <Slot />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f3f4f6', // A light grey background for the content area
  },
});

export default DesktopAdminLayout;