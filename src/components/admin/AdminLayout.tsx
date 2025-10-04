import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Link, usePathname, Slot } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const menuItems = [
  { href: '/(admin)', label: 'Tổng quan', icon: 'home-outline' as const },
  { href: '/(admin)/orders', label: 'Đơn hàng', icon: 'receipt-outline' as const },
  { href: '/(admin)/menu', label: 'Thực đơn', icon: 'fast-food-outline' as const },
  { href: '/(admin)/locations', label: 'Địa điểm', icon: 'location-outline' as const },
];

const SidebarLink = ({ item }: { item: typeof menuItems[0] }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link href={item.href} asChild>
      <TouchableOpacity style={[styles.sidebarLink, isActive && styles.sidebarLinkActive]}>
        <Ionicons name={item.icon} size={22} color={isActive ? '#fff' : '#a1a1aa'} />
        <Text style={[styles.sidebarLinkText, isActive && styles.sidebarLinkTextActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    </Link>
  );
};

export default function AdminLayout() {
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.nativeWarningContainer}>
        <Text style={styles.nativeWarningText}>Giao diện Admin chỉ khả dụng trên web.</Text>
        <Slot />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Hurry Admin</Text>
        </View>
        <ScrollView>
          {menuItems.map((item) => (
            <SidebarLink key={item.href} item={item} />
          ))}
        </ScrollView>
      </View>
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeWarningContainer: {
    flex: 1,
  },
  nativeWarningText: {
    textAlign: 'center',
    padding: 20,
    backgroundColor: '#ffedd5',
    color: '#9a3412',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
  },
  sidebar: {
    width: 250,
    backgroundColor: '#1f2937',
    padding: 16,
  },
  sidebarHeader: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  sidebarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  sidebarLinkActive: {
    backgroundColor: '#4b5563',
  },
  sidebarLinkText: {
    fontSize: 16,
    color: '#d1d5db',
    marginLeft: 12,
  },
  sidebarLinkTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Platform.OS === 'web' ? 32 : 16,
  },
});