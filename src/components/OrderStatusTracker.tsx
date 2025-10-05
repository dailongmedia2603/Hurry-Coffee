import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderStatus } from '@/types';

type StatusStepProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isCompleted: boolean;
  isActive: boolean;
};

const StatusStep = ({ icon, label, isCompleted, isActive }: StatusStepProps) => {
  const color = isCompleted || isActive ? '#73509c' : '#ccc';
  return (
    <View style={styles.stepContainer}>
      <View style={[styles.iconWrapper, { backgroundColor: isCompleted || isActive ? '#E8E4F2' : '#f0f0f0' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.label, { color: isActive ? '#000' : '#666' }]}>{label}</Text>
    </View>
  );
};

const OrderStatusTracker = ({ status, orderType }: { status: OrderStatus, orderType: 'delivery' | 'pickup' }) => {
  const statuses: OrderStatus[] = orderType === 'delivery'
    ? ['Đang xử lý', 'Đang giao', 'Hoàn thành']
    : ['Đang xử lý', 'Sẵn sàng', 'Hoàn thành'];
  
  const currentIndex = statuses.indexOf(status);

  const getIconForStatus = (s: OrderStatus): keyof typeof Ionicons.glyphMap => {
    switch (s) {
      case 'Đang xử lý': return 'receipt-outline';
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
          <StatusStep
            label={s}
            icon={getIconForStatus(s)}
            isCompleted={index < currentIndex}
            isActive={index === currentIndex}
          />
          {index < statuses.length - 1 && <View style={[styles.line, { backgroundColor: index < currentIndex ? '#73509c' : '#ccc' }]} />}
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
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#fff',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#ccc',
    marginTop: 24,
    marginHorizontal: -10,
  },
});

export default OrderStatusTracker;