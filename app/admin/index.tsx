import { Redirect } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function AdminRootIndex() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#73509c" />
      </View>
    );
  }

  if (profile?.role === 'staff') {
    return <Redirect href="/admin/orders" />;
  }

  // Mặc định chuyển hướng đến trang quản lý sản phẩm cho admin
  return <Redirect href="/admin/products" />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});