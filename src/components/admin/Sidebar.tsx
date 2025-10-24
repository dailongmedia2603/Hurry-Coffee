import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';

const ACTIVE_COLOR = "#73509c";
const INACTIVE_COLOR = "#4b5563";
const ACTIVE_BG_COLOR = "#f0eaf8";

const navItems: { href: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { href: '/admin/products', label: 'Sản phẩm', icon: 'fast-food-outline' },
  { href: '/admin/orders', label: 'Đơn hàng', icon: 'receipt-outline' },
  { href: '/admin/locations', label: 'Địa điểm', icon: 'location-outline' },
  { href: '/admin/accounts', label: 'Tài khoản', icon: 'people-outline' },
  { href: '/admin/settings', label: 'Cài đặt', icon: 'settings-outline' },
];

const NavLink = ({ href, label, icon }: { href: string; label: string; icon: keyof typeof Ionicons.glyphMap }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link href={href} style={[styles.navLink, isActive && styles.navLinkActive]} asChild>
      <TouchableOpacity>
        <Ionicons 
          name={icon} 
          size={22} 
          color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR} 
          style={styles.navIcon} 
        />
        <Text style={[styles.navText, isActive && styles.navTextActive]}>{label}</Text>
      </TouchableOpacity>
    </Link>
  );
};

const Sidebar = () => {
  const { signOut } = useAuth();

  return (
    <View style={styles.sidebarContainer}>
      <View style={styles.logoContainer}>
        <Image source={require('@/assets/images/logohurry.png')} style={styles.logo} />
      </View>
      <View style={styles.navContainer}>
        {navItems.map(item => (
          <NavLink key={item.href} {...item} />
        ))}
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Ionicons name="log-out-outline" size={22} color="#ef4444" style={styles.navIcon} />
        <Text style={[styles.navText, { color: '#ef4444' }]}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    width: 250,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    padding: 16,
    flexDirection: 'column',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  navContainer: {
    flex: 1,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  navLinkActive: {
    backgroundColor: ACTIVE_BG_COLOR,
  },
  navIcon: {
    marginRight: 16,
  },
  navText: {
    fontSize: 16,
    fontWeight: '500',
    color: INACTIVE_COLOR,
  },
  navTextActive: {
    color: ACTIVE_COLOR,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 'auto',
  },
});

export default Sidebar;