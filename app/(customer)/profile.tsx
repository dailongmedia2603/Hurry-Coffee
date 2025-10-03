import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import LoginScreen from '../../src/components/Auth/LoginScreen';
import ProfileScreen from '../../src/components/Auth/ProfileScreen';

export default function ProfileTabScreen() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#73509c" />
      </View>
    );
  }

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