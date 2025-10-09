import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderStatus } from '@/types';

const OrderStatusTracker = ({ status, orderType }: { status: OrderStatus, orderType: 'delivery' | 'pickup' | null }) => {
  const statuses: OrderStatus[] = orderType === 'delivery'
    ? ['Đang xử lý', 'Đang làm', 'Đang giao', 'Hoàn thành']
    : ['Đang xử lý', 'Đang làm', 'Sẵn sàng', 'Hoàn thành'];

  const currentStatusIndex = statuses.indexOf(status);

  const getIconForStatus = (s: OrderStatus) => {
    switch (s) {
      case 'Đang xử lý': return 'receipt-outline';
      case 'Đang làm': return 'flame-outline';
      case 'Đang giao': return 'bicycle-outline';
      case 'Sẵn sàng': return 'bag-handle-outline';
      case 'Hoàn thành': return 'checkmark-done-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  return (
    <View style={styles.container}>
      {statuses.map((s, index) => (
        <React.Fragment key={s}>
          <View style={styles.statusItem}>
            <View style={[styles.iconContainer, index <= currentStatusIndex && styles.activeIconContainer]}>
              <Ionicons
                name={getIconForStatus(s)}
                size={24}
                color={index <= currentStatusIndex ? 'white' : '#aaa'}
              />
            </View>
            <Text style={[styles.statusText, index <= currentStatusIndex && styles.activeStatusText]}>{s}</Text>
          </View>
          {index < statuses.length - 1 && (
            <View style={[styles.line, index < currentStatusIndex && styles.activeLine]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginVertical: 20,
    },
    statusItem: {
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeIconContainer: {
        backgroundColor: '#00C853',
    },
    statusText: {
        marginTop: 5,
        fontSize: 12,
        color: '#aaa',
        textAlign: 'center',
    },
    activeStatusText: {
        color: '#333',
        fontWeight: 'bold',
    },
    line: {
        flex: 1,
        height: 2,
        backgroundColor: '#e0e0e0',
        marginTop: 19,
    },
    activeLine: {
        backgroundColor: '#00C853',
    },
});

export default OrderStatusTracker;