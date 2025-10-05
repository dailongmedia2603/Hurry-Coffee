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

  // Điều hướng dựa trên vai trò của người dùng
  // Nếu là admin, chuyển đến trang quản lý sản phẩm.
  if (profile?.role === 'admin') {
    return <Redirect href="/admin/products" />;
  }
  
  // Nếu là nhân viên, chuyển đến trang quản lý đơn hàng.
  if (profile?.role === 'staff') {
    return <Redirect href="/admin/orders" />;
  }

  // Mặc định: Nếu không có vai trò hoặc vai trò khác,
  // chuyển đến trang sản phẩm như một biện pháp an toàn cho admin.
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