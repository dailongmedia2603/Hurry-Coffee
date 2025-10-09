import { useLocalSearchParams, Stack } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Alert, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/integrations/supabase/client';
import { Order } from '@/types';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useCancelOrder } from '@/src/hooks/useCancelOrder';
import Colors from '@/src/constants/Colors';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const OrderDetailScreen = () => {
  const { id: idString } = useLocalSearchParams();
  const id = idString as string;

  const { data: order, error, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*)), locations(*)')
        .eq('id', id)
        .single();
      if (error) {
        throw new Error(error.message);
      }
      return data as any as Order;
    },
  });

  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

  const handleCancel = () => {
    Alert.alert(
      'Xác nhận hủy',
      'Bạn có chắc chắn muốn hủy đơn hàng này không?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: () => cancelOrder({ orderId: id }),
        },
      ]
    );
  };

  if (isLoading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  if (error || !order) {
    return <Text style={styles.errorText}>Không tìm thấy đơn hàng.</Text>;
  }

  const getStatusColor = (status: string) => {
    if (status === 'Hoàn thành') return Colors.light.success;
    if (status === 'Đã hủy') return Colors.light.error;
    if (status === 'Đang xử lý') return Colors.light.warning;
    return Colors.light.tint;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Đơn hàng #${id.slice(0, 6)}...` }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
            <Text style={styles.orderId}>Đơn hàng #{id.slice(0, 6)}...</Text>
            <Text style={styles.orderDate}>{dayjs(order.created_at).format('HH:mm, DD/MM/YYYY')}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{order.status}</Text>
            </View>
        </View>

        <Text style={styles.sectionTitle}>Sản phẩm</Text>
        {order.order_items?.map((item) => (
          <View key={item.id} style={styles.itemContainer}>
            <Text style={styles.itemName}>{item.products.name} x{item.quantity}</Text>
            <Text style={styles.itemPrice}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</Text>
          </View>
        ))}

        <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalAmount}>{order.total.toLocaleString('vi-VN')}đ</Text>
        </View>
      </ScrollView>

      {order.status === 'Đang xử lý' && (
        <Pressable
          style={[styles.button, isCancelling && styles.buttonDisabled]}
          onPress={handleCancel}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Hủy đơn hàng</Text>
          )}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    fontSize: 16,
    color: 'red',
  },
  headerContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  orderId: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  button: {
    backgroundColor: Colors.light.error,
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OrderDetailScreen;