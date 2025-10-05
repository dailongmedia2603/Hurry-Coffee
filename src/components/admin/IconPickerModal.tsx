import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: keyof typeof Ionicons.glyphMap) => void;
};

// Expanded list of icons, grouped by category for easier maintenance
const ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  // Food & Drink
  'fast-food-outline', 'cafe-outline', 'beer-outline', 'wine-outline', 'pint-outline', 
  'ice-cream-outline', 'restaurant-outline', 'pizza-outline', 'nutrition-outline', 
  'fish-outline', 'egg-outline', 'leaf-outline', 'water-outline', 'flask-outline',

  // Nature & Elements
  'bonfire-outline', 'flame-outline', 'snow-outline', 'partly-sunny-outline', 'moon-outline', 
  'star-outline', 'sparkles-outline', 'flower-outline', 'rose-outline',

  // Shopping & Business
  'storefront-outline', 'cart-outline', 'basket-outline', 'bag-handle-outline', 'pricetag-outline', 
  'receipt-outline', 'card-outline', 'cash-outline', 'wallet-outline', 'gift-outline', 
  'business-outline', 'trending-up-outline', 'stats-chart-outline',

  // General & UI
  'grid-outline', 'apps-outline', 'list-outline', 'options-outline', 'keypad-outline', 
  'home-outline', 'location-outline', 'map-outline', 'flag-outline', 'medal-outline', 
  'trophy-outline', 'ribbon-outline', 'heart-outline', 'thumbs-up-outline', 'happy-outline', 
  'rocket-outline', 'time-outline', 'cube-outline', 'layers-outline', 'barcode-outline',
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
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
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