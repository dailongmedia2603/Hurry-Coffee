import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '@/types';
import AttentionView from './AttentionView';

type NewOrderNotificationModalProps = {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onViewOrder: (orderId: string) => void;
};

const NewOrderNotificationModal = ({ visible, order, onClose, onViewOrder }: NewOrderNotificationModalProps) => {
  if (!order) {
    return null;
  }

  const handleViewOrder = () => {
    onViewOrder(order.id);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <AttentionView>
            <Ionicons name="notifications" size={64} color="#73509c" style={styles.icon} />
          </AttentionView>
          <Text style={styles.title}>Có đơn hàng mới!</Text>
          <Text style={styles.message}>
            Đơn hàng #{order.id.substring(0, 8)} vừa được tạo.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.viewButton]} onPress={handleViewOrder}>
              <Text style={styles.viewButtonText}>Xem đơn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1f2937',
  },
  message: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  closeButtonText: {
    color: '#374151',
    fontWeight: 'bold',
    fontSize: 16,
  },
  viewButton: {
    backgroundColor: '#73509c',
    marginLeft: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default NewOrderNotificationModal;