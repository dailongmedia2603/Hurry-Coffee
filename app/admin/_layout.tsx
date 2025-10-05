import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AdminLoginScreen from "@/src/components/admin/AdminLoginScreen";

const ACTIVE_COLOR = "#73509c";
const INACTIVE_COLOR = "#9ca3af";

export default function AdminLayout() {
  const { session, loading } = useAuth();

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
      }}
    >
      <Tabs.Screen
        name="products"
        options={{
          title: "Sản phẩm",
          headerTitle: "Quản lý Sản phẩm",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fast-food-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: "Địa điểm",
          headerTitle: "Quản lý Địa điểm",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Tài khoản",
          headerTitle: "Quản lý Tài khoản",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Ẩn tab này khỏi thanh điều hướng
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