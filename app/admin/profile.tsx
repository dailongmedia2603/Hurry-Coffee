import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';

export default function StaffProfileScreen() {
  const { user, profile, signOut } = useAuth();

  if (!user || !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text>Đang tải hồ sơ...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.profileHeader}>
          <Ionicons name="person-circle-outline" size={100} color="#73509c" />
          <Text style={styles.profileName}>{profile.full_name || 'Nhân viên'}</Text>
          <Text style={styles.profileEmail}>{user.email || user.phone}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{profile.role === 'staff' ? 'Nhân viên' : 'Admin'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f3f4f6" },
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  profileHeader: { 
    alignItems: "center", 
    marginTop: 40,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  profileName: { 
    color: "#161616", 
    fontSize: 22, 
    fontWeight: "bold", 
    marginTop: 16,
    marginBottom: 4 
  },
  profileEmail: { 
    color: "#7C7C7C", 
    fontSize: 16,
    marginBottom: 16,
  },
  roleBadge: {
    backgroundColor: '#E8E4F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#73509c',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logoutButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    margin: 16, 
    padding: 16, 
    backgroundColor: '#ef4444', 
    borderRadius: 30 
  },
  logoutButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginLeft: 8 
  },
});