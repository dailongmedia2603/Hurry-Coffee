import React from "react";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { View, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import AdminLoginScreen from "@/src/components/admin/AdminLoginScreen";

const ACTIVE_COLOR = "#73509c";
const INACTIVE_COLOR = "#9ca3af";

export default function AdminLayout() {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#73509c" />
      </View>
    );
  }

  if (!session) {
    return <AdminLoginScreen />;
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#73509c" />
      </View>
    );
  }

  if (profile.role !== 'admin') {
    return <Redirect href={profile.role === 'staff' ? '/(staff)' : '/'} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTintColor: "#111827",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#e5e7eb",
        },
        tabBarLabelStyle: {
          fontWeight: "500",
        },
        headerRight: () => (
          <TouchableOpacity onPress={signOut} style={{ marginRight: 16 }}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="products"
        options={{
          title: "Sản phẩm",
          headerTitle: "Quản lý Sản phẩm",
          tabBarIcon: ({ color, size }) => <Ionicons name="fast-food-outline" color={color} size={size} />,
        }}
      />
       <Tabs.Screen
        name="orders"
        options={{
          title: "Đơn hàng",
          headerTitle: "Quản lý Đơn hàng",
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: "Địa điểm",
          headerTitle: "Quản lý Địa điểm",
          tabBarIcon: ({ color, size }) => <Ionicons name="location-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Tài khoản",
          headerTitle: "Quản lý Tài khoản",
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Cài đặt",
          headerTitle: "Cài đặt ứng dụng",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
        }}
      />

      {/* Hidden screens */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="order/[id]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
          headerTitle: "Chi tiết đơn hàng",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    }
});