import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Order, OrderStatus } from '@/types';
import { formatDisplayPhone } from '@/src/utils/formatters';
import AttentionView from '@/src/components/AttentionView';

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
const formatDate = (date: string) => new Date(date).toLocaleString('vi-VN');

const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case 'Đang giao': return { color: '#2979FF', backgroundColor: '#E3F2FD', text: 'Đang giao' };
    case 'Sẵn sàng': return { color: '#FF9100', backgroundColor: '#FFF3E0', text: 'Sẵn sàng' };
    case 'Hoàn thành': return { color: '#00C853', backgroundColor: '#E8F5E9', text: 'Hoàn thành' };
    case 'Đang xử lý': return { color: '#FF9100', backgroundColor: '#FFF3E0', text: 'Đang xử lý' };
    case 'Đang làm': return { color: '#3b82f6', backgroundColor: '#dbeafe', text: 'Đang làm' };
    case 'Đã hủy': return { color: '#D50000', backgroundColor: '#FFEBEE', text: 'Đã hủy' };
    case 'Không liên hệ được': return { color: '#D50000', backgroundColor: '#FFEBEE', text: 'Không liên hệ được' };
    default: return { color: '#666', backgroundColor: '#F5F5F5', text: 'Không rõ' };
  }
};

type OrderWithItemCount = Order & { items_count: number };

export default function StaffOrdersScreen() {
  const [orders, setOrders] = useState<OrderWithItemCount[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrders = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }
    const { data, error } = await supabase.rpc('get_staff_orders');

    if (error) {
        console.error("Error fetching staff orders:", error);
        Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng.');
        setOrders([]);
    } else {
        setOrders((data as OrderWithItemCount[]) || []);
    }
    if (isInitialLoad) {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders(true);
    }, [fetchOrders])
  );

  const renderOrderItem = ({ item }: { item: OrderWithItemCount }) => {
    const statusStyle = getStatusStyle(item.status);
    const needsVerification = !item.is_phone_verified;
    const orderTitle = item.order_type === 'pickup' 
        ? `Đơn ghé lấy #${item.id.substring(0, 8)}` 
        : `Đơn giao hàng #${item.id.substring(0, 8)}`;

    const isNew = item.status === 'Đang xử lý';

    return (
      <TouchableOpacity style={styles.itemCard} onPress={() => router.push(`/staff/order/${item.id}`)}>
        {needsVerification && (
          <View style={styles.verificationBadge}>
            <Ionicons name="call" size={14} color="#fff" />
            <Text style={styles.verificationText}>Cần gọi xác nhận</Text>
          </View>
        )}
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{orderTitle}</Text>
          <View style={styles.headerRight}>
            {isNew && (
              <AttentionView style={styles.newOrderBadge}>
                <Ionicons name="sparkles" size={14} color="#b91c1c" />
                <Text style={styles.newOrderText}>Đơn mới</Text>
              </AttentionView>
            )}
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.text}</Text>
            </View>
          </View>
        </View>
        <View style={styles.itemInfoRow}>
          <Ionicons name="person-outline" size={16} color="#6b7280" />
          <Text style={styles.itemInfoText}>{item.customer_name || 'Khách vãng lai'}</Text>
        </View>
        <View style={styles.itemInfoRow}>
          <Ionicons name="call-outline" size={16} color="#6b7280" />
          <Text style={styles.itemInfoText}>{formatDisplayPhone(item.customer_phone) || 'Không có SĐT'}</Text>
        </View>
        <View style={styles.itemFooter}>
          <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>
          <Text style={styles.itemPrice}>{formatPrice(item.total)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <ActivityIndicator size="large" color="#73509c" style={styles.loader} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có đơn hàng nào.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          onRefresh={() => fetchOrders(true)}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16 },
  itemCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  itemName: { fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
  headerRight: { alignItems: 'flex-end' },
  newOrderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginBottom: 6,
  },
  newOrderText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-end' },
  statusText: { fontSize: 12, fontWeight: '500' },
  itemInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemInfoText: { fontSize: 14, color: '#374151', marginLeft: 8 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12, marginTop: 8 },
  itemDate: { fontSize: 12, color: '#6b7280' },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#16a34a' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  verificationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});