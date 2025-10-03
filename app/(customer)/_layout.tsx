import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { CartProvider } from "@/src/context/CartContext";

const ACTIVE_COLOR = "#73509c";
const INACTIVE_COLOR = "#666";

export default function CustomerLayout() {
  return (
    <CartProvider>
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
            shadowOffset: {
              width: 0,
              height: -3,
            },
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
            title: "Menu",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "restaurant" : "restaurant-outline"}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: "Đặt Món",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "fast-food" : "fast-food-outline"}
                color={color}
                size={size}
              />
            ),
            tabBarStyle: { display: "none" },
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
        <Tabs.Screen
          name="category/[name]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="product/[id]"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
          } as any}
        />
        <Tabs.Screen
          name="order/[id]"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
          } as any}
        />
      </Tabs>
    </CartProvider>
  );
}