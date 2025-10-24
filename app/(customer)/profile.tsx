import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useSettings } from '../../src/context/SettingsContext';
import LoginScreen from '../../src/components/Auth/LoginScreen';
import ProfileScreen from '../../src/components/Auth/ProfileScreen';

export default function ProfileTabScreen() {
  const { session, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();

  if (authLoading || settingsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#73509c" />
      </View>
    );
  }

  // Nếu tính năng bị tắt, chuyển hướng người dùng về trang chủ.
  if (!settings.feature_profile_enabled) {
    return <Redirect href="/(customer)" />;
  }

  // Logic ban đầu: hiển thị màn hình đăng nhập hoặc hồ sơ dựa trên session.
  return session ? <ProfileScreen /> : <LoginScreen />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});