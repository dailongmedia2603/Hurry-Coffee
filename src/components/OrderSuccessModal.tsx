import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type OrderSuccessModalProps = {
  visible: boolean;
  onClose: () => void;
  onViewOrder: () => void;
};

const OrderSuccessModal = ({ visible, onClose, onViewOrder }: OrderSuccessModalProps) => {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#00C853" style={styles.icon} />
          <Text style={styles.title}>Đặt đơn thành công!</Text>
          <Text style={styles.message}>Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý đơn hàng của bạn ngay.</Text>
          <TouchableOpacity style={styles.actionButton} onPress={onViewOrder}>
            <Text style={styles.actionButtonText}>Xem đơn hàng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: { width: '90%', maxWidth: 340, backgroundColor: 'white', borderRadius: 24, padding: 24, alignItems: 'center' },
  icon: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  actionButton: { backgroundColor: '#73509c', paddingVertical: 14, borderRadius: 12, alignItems: 'center', width: '100%' },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default OrderSuccessModal;