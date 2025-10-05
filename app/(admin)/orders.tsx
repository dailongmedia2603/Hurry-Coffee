import { View, Text, StyleSheet } from "react-native";

export default function OrderManagementScreen() {
  return (
    <View>
      <Text style={styles.title}>Quản lý Đơn hàng</Text>
      <Text style={styles.subtitle}>
        Tính năng này đang được phát triển.
      </Text>
    </View>
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