import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types';
import OrderListItem from '@/components/OrderListItem';
import OrderItemListItem from '@/components/OrderItemListItem';
import { cancelOrder } from '@/lib/order';

const OrderDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const orderId = Array.isArray(id) ? id[0] : id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      
      setOrder(data as Order);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancelOrder = () => {
    if (!order) return;
    // Call the new, separated function
    cancelOrder(order.id, () => {
      // On success, refetch the order to update the status on screen
      fetchOrder();
    });
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }
  if (error || !order) {
    return <Text style={styles.errorText}>Không tìm thấy đơn hàng hoặc đã có lỗi xảy ra.</Text>;
  }

  // Only show the cancel button if the order status is 'Đang xử lý'
  const isCancellable = order.status === 'Đang xử lý';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Đơn hàng #${order.id.slice(0, 6)}` }} />
      
      <FlatList
        data={order.order_items}
        renderItem={({ item }) => <OrderItemListItem item={item as any} />}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={() => <OrderListItem order={order} />}
        ListFooterComponent={() => (
          isCancellable && (
            <Pressable style={styles.cancelButton} onPress={handleCancelOrder}>
              <Text style={styles.cancelButtonText}>Huỷ đơn hàng</Text>
            </Pressable>
          )
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  listContent: {
    padding: 10,
    gap: 20,
    paddingBottom: 40,
  },
  errorText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OrderDetailsScreen;