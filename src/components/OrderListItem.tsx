import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Order } from '@/types';
import { formatPrice } from '@/src/utils/formatters';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const OrderListItem = ({ order }: { order: Order }) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Mã đơn hàng:</Text>
        <Text style={styles.value}>#{order.id.slice(0, 6).toUpperCase()}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Ngày đặt:</Text>
        <Text style={styles.value}>{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Trạng thái:</Text>
        <Text style={[styles.value, styles.status]}>{order.status}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Tổng tiền:</Text>
        <Text style={[styles.value, styles.total]}>{formatPrice(order.total)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  status: {
    fontWeight: 'bold',
    color: '#FF9100',
  },
  total: {
    fontWeight: 'bold',
    color: '#00C853',
  },
});

export default OrderListItem;