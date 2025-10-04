import React from 'react';
import { Modal, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserAddress } from '@/types';

type AddressPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (address: UserAddress) => void;
  addresses: UserAddress[];
};

const AddressPickerModal = ({ visible, onClose, onSelect, addresses }: AddressPickerModalProps) => {
  const handleSelect = (address: UserAddress) => {
    onSelect(address);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chọn địa chỉ</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.addressItem} onPress={() => handleSelect(item)}>
                <Ionicons name="location-outline" size={24} color="#73509c" style={styles.addressIcon} />
                <View style={styles.addressDetails}>
                  <Text style={styles.addressName}>{item.name}</Text>
                  <Text style={styles.addressText}>{item.address}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  addressItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  addressIcon: { marginRight: 16 },
  addressDetails: { flex: 1 },
  addressName: { fontSize: 16, fontWeight: 'bold' },
  addressText: { fontSize: 14, color: '#666', marginTop: 4 },
});

export default AddressPickerModal;