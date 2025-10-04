import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function AdminHomeScreen() {
  return (
    <ScrollView>
      <Text style={styles.title}>Chào mừng đến trang Quản trị</Text>
      <Text style={styles.subtitle}>
        Sử dụng thanh điều hướng bên trái để quản lý đơn hàng, thực đơn, và các cài đặt khác.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 18,
    color: "#4b5563",
  },
});