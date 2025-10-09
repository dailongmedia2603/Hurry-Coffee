import { useLocalSearchParams, Stack } from 'expo-router';
import { ActivityIndicator, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/integrations/supabase/client';
import OrderDetails from '@/src/components/OrderDetails';
import { Order } from '@/types';
import { useCancelOrder } from '@/src/hooks/useCancelOrder';

const OrderDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const orderId = Array.isArray(id) ? id[0] : id;

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items_count:order_items(count),
          locations (
            name,
            image_url
          )
        `)
        .eq('id', orderId)
        .single();
      if (error) {
        throw new Error(error.message);
      }
      const mappedData = {
        ...data,
        restaurant_name: data.locations?.name || 'N/A',
        restaurant_image_url: data.locations?.image_url || '',
        items_count: data.items_count[0]?.count || 0,
      };
      return mappedData;
    },
    enabled: !!orderId,
  });

  // Sử dụng hook mới, logic phức tạp đã được chuyển đi
  const { cancelOrder, isCancelling } = useCancelOrder();

  const handleCancelOrder = () => {
    if (!orderId) return;
    cancelOrder(orderId);
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (error || !order) {
    return <Text style={styles.errorText}>Không tìm thấy đơn hàng hoặc có lỗi xảy ra.</Text>;
  }

  const canCancel = order.status === 'Đang xử lý';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Đơn hàng #${order.id.substring(0, 8)}` }} />
      <OrderDetails order={order} />

      {canCancel && (
        <TouchableOpacity 
          style={[styles.cancelButton, isCancelling && styles.disabledButton]} 
          onPress={handleCancelOrder}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'red',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderDetailsScreen;