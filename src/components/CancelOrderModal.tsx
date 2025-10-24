import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CANCELLATION_REASONS = [
  'Không còn nhu cầu',
  'Không gọi được',
  'Đơn bị trùng',
  'Hết hàng để bán',
];

type CancelOrderModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
};

const CancelOrderModal = ({ visible, onClose, onConfirm, loading }: CancelOrderModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Lý do hủy đơn</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
          </View>
          
          {CANCELLATION_REASONS.map(reason => (
            <TouchableOpacity 
              key={reason} 
              style={styles.reasonRow} 
              onPress={() => setSelectedReason(reason)}
            >
              <Ionicons 
                name={selectedReason === reason ? 'radio-button-on' : 'radio-button-off'} 
                size={24} 
                color={selectedReason === reason ? '#73509c' : '#ccc'} 
              />
              <Text style={styles.reasonText}>{reason}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity 
            style={[styles.confirmButton, !selectedReason && styles.disabledButton]} 
            onPress={handleConfirm}
            disabled={!selectedReason || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Xác nhận hủy</Text>}
          </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  reasonText: {
    fontSize: 16,
    marginLeft: 12,
  },
  confirmButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#fca5a5',
  },
});

export default CancelOrderModal;