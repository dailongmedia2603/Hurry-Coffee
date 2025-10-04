import { Stack } from "expo-router";
import AdminLayout from "@/src/components/admin/AdminLayout";
import { Platform } from "react-native";

export default function AdminRootLayout() {
  // On native, Admin pages will use a standard stack navigator.
  // On web, they will be wrapped in the custom AdminLayout with a sidebar.
  const LayoutComponent = Platform.OS === 'web' ? AdminLayout : React.Fragment;

  return (
    <LayoutComponent>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#1f2937",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          // Hide header on web because the layout provides navigation
          headerShown: Platform.OS !== 'web',
        }}
      >
        <Stack.Screen name="index" options={{ title: "Tổng quan" }} />
        <Stack.Screen name="orders" options={{ title: "Quản lý Đơn hàng" }} />
        <Stack.Screen name="menu" options={{ title: "Quản lý Thực đơn" }} />
        <Stack.Screen name="locations" options={{ title: "Quản lý Địa điểm" }} />
      </Stack>
    </LayoutComponent>
  );
}