import { useLocalSearchParams, Stack } from 'expo-router';
import { ActivityIndicator, Text, View, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchOrderById } from '@/src/api/orders';
import OrderListItem from '@/src/components/OrderListItem';
import OrderItemListItem from '@/src/components/OrderItemListItem';
import { FlatList } from 'react-native-gesture-handler';
import Colors from '@/src/constants/Colors';
import { useCancelOrder } from '@/src/hooks/useCancelOrder';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const orderId = Array.isArray(id) ? id[0] : id;

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderById(orderId),
    enabled: !!orderId,
  });

  // Sử dụng custom hook mới, logic phức tạp đã được đóng gói
  const { cancelOrder, isCancelling } = useCancelOrder(orderId);

  if (isLoading) {
    return <ActivityIndicator />;
  }
  if (error || !order) {
    return <Text>Không tìm thấy đơn hàng.</Text>;
  }

  const handleCancelOrder = () => {
    // Chỉ cần gọi hàm từ hook
    cancelOrder();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Đơn hàng #${order.id.slice(-6)}` }} />

      <OrderListItem order={order} />

      <FlatList
        data={order.order_items}
        renderItem={({ item }) => <OrderItemListItem item={item} />}
        contentContainerStyle={{ gap: 10 }}
        ListFooterComponent={() => (
          <>
            {order.status === 'Đang xử lý' && (
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  // Vô hiệu hóa nút và giảm độ sáng khi đang xử lý
                  { opacity: pressed || isCancelling ? 0.5 : 1 },
                ]}
                onPress={handleCancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
                )}
              </Pressable>
            )}
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    flex: 1,
    gap: 10,
  },
  cancelButton: {
    backgroundColor: Colors.light.tint,
    padding: 15,
    borderRadius: 100,
    alignItems: 'center',
    marginVertical: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});