import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '@/src/integrations/supabase/client';
import { Order, OrderStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case 'Đã xác nhận': return { color: '#00C853', backgroundColor: '#E8F5E9', text: 'Đã xác nhận' };
    case 'Đang giao': return { color: '#2979FF', backgroundColor: '#E3F2FD', text: 'Đang giao' };
    case 'Sẵn sàng': return { color: '#FF9100', backgroundColor: '#FFF3E0', text: 'Sẵn sàng' };
    case 'Hoàn thành': return { color: '#00C853', backgroundColor: '#E8F5E9', text: 'Hoàn thành' };
    case 'Đang xử lý': return { color: '#FF9100', backgroundColor: '#FFF3E0', text: 'Đang xử lý' };
    case 'Đang làm': return { color: '#3b82f6', backgroundColor: '#dbeafe', text: 'Đang làm' };
    case 'Đã hủy': case 'Đã huỷ': return { color: '#D50000', backgroundColor: '#FFEBEE', text: 'Đã hủy' };
    default: return { color: '#666', backgroundColor: '#F5F5F5', text: 'Không rõ' };
  }
};

type OrderWithItemCount = Order & { items_count: number };

const AdminOrdersScreen = () => {
  const [orders, setOrders] = useState<OrderWithItemCount[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, items_count:order_items(count)')
      .order('created_at', { ascending: false });

    if (data) {
      const formattedData = data.map(o => ({
        ...o,
        items_count: Array.isArray(o.items_count) ? o.items_count[0]?.count ?? 0 : 0,
      }));
      setOrders(formattedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const subscription = supabase.channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const renderOrderItem = ({ item }: { item: OrderWithItemCount }) => {
    const statusStyle = getStatusStyle(item.status as OrderStatus);
    return (
      <Pressable style={styles.orderItem} onPress={() => router.push(`/admin/order/${item.id}`)}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Đơn #{item.id.slice(0, 6)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.text}</Text>
          </View>
        </View>
        <Text style={styles.customerInfo}>{item.customer_name} - {item.customer_phone}</Text>
        <Text style={styles.itemCount}>{item.items_count} món</Text>
        <Text style={styles.timestamp}>
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })}
        </Text>
      </Pressable>
    );
  };

  if (loading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Quản lý Đơn hàng' }} />
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        onRefresh={fetchOrders}
        refreshing={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 10 },
  orderItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  customerInfo: { fontSize: 14, color: '#333', marginBottom: 4 },
  itemCount: { fontSize: 14, color: '#666', marginBottom: 8 },
  timestamp: { fontSize: 12, color: '#999', textAlign: 'right' },
});

export default AdminOrdersScreen;