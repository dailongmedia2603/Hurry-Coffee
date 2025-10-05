import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: keyof typeof Ionicons.glyphMap) => void;
};

const ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'fast-food-outline', 'cafe-outline', 'leaf-outline', 'beer-outline',
  'ice-cream-outline', 'restaurant-outline', 'pizza-outline', 'nutrition-outline',
  'wine-outline', 'fish-outline', 'egg-outline', 'bonfire-outline',
  'barcode-outline', 'basket-outline', 'cart-outline', 'pricetag-outline',
];

const IconPickerModal = ({ visible, onClose, onSelectIcon }: IconPickerModalProps) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chọn Icon</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
          </View>
          <FlatList
            data={ICONS}
            keyExtractor={(item) => item}
            numColumns={4}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.iconButton} onPress={() => onSelectIcon(item)}>
                <Ionicons name={item} size={32} color="#333" />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.gridContainer}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '50%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  gridContainer: { alignItems: 'center' },
  iconButton: {
    padding: 16,
    margin: 8,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
  },
});

export default IconPickerModal;