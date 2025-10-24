import React from "react";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View, ActivityIndicator, StyleSheet } from "react-native";
import { CartProvider } from "@/src/context/CartContext";
import { useAuth } from "@/src/context/AuthContext";
import { SettingsProvider, useSettings } from "@/src/context/SettingsContext";

const ACTIVE_COLOR = "#73509c";
const INACTIVE_COLOR = "#666";

// Component nội dung chính, chỉ render khi đã tải xong dữ liệu
function CustomerLayoutContent() {
  const { profile, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();

  if (authLoading || settingsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#73509c" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: Platform.OS === "ios" ? 90 : 70,
          paddingTop: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 10,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: Platform.OS === "android" ? 10 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Đặt Món",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "fast-food" : "fast-food-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Đơn Đặt",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Địa Điểm",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "location" : "location-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          // Đây là thay đổi: Dùng href: null để ẩn tab
          href: settings.feature_profile_enabled ? '/(customer)/profile' : null,
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen name="category/[name]" options={{ href: null }} />
      <Tabs.Screen name="product/[id]" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="order/[id]" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="checkout" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="address" options={{ href: null, tabBarStyle: { display: "none" } }} />
    </Tabs>
  );
}

// Component layout chính, bao bọc bởi các Provider
export default function CustomerLayout() {
  return (
    <SettingsProvider>
      <CartProvider>
        <CustomerLayoutContent />
      </CartProvider>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});