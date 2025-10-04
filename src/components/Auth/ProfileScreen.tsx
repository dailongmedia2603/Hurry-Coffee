import React from 'react';
import { SafeAreaView, View, ScrollView, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';

const ProfileMenuItem = ({ icon, label, count }: { icon: keyof typeof Ionicons.glyphMap, label: string, count?: number }) => (
  <TouchableOpacity style={styles.menuItem}>
    <View style={styles.menuItemContent}>
      <Ionicons name={icon} size={24} color="#161616" style={styles.menuIcon} />
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <View style={styles.menuItemRight}>
      {count ? (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationText}>{count}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward-outline" size={20} color="#666" />
    </View>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
        </View>

        <View style={styles.profileHeader}>
          <Image
            source={{ uri: profile?.avatar_url || 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/zgdh8j21_expires_30_days.png' }}
            style={styles.avatar}
          />
          <Text style={styles.profileName}>{profile?.full_name || 'Tên người dùng'}</Text>
          <Text style={styles.profileEmail}>{user?.email || user?.phone}</Text>
        </View>

        <View style={styles.menuContainer}>
          <ProfileMenuItem icon="notifications-outline" label="Thông báo" count={4} />
          <ProfileMenuItem icon="card-outline" label="Phương thức thanh toán" />
          <ProfileMenuItem icon="ticket-outline" label="Điểm thưởng" />
          <ProfileMenuItem icon="location-outline" label="Địa chỉ của tôi" />
          <ProfileMenuItem icon="settings-outline" label="Cài đặt" />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={24} color="#D50000" />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContentContainer: {
    paddingBottom: 120,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    paddingVertical: 20,
    marginBottom: 10,
  },
  headerTitle: {
    color: "#161616",
    fontSize: 20,
    fontWeight: "bold",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 16,
  },
  profileName: {
    color: "#161616",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileEmail: {
    color: "#7C7C7C",
    fontSize: 14,
  },
  menuContainer: {
    marginHorizontal: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderColor: "#DCDCDC",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    marginRight: 16,
  },
  menuLabel: {
    color: "#161616",
    fontSize: 14,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationBadge: {
    backgroundColor: "#24B445",
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  notificationText: {
    color: "#FAFAFA",
    fontSize: 12,
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#D50000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});