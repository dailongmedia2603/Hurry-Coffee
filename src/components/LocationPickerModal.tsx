import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Location } from '@/types';

type LocationPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: Location) => void;
};

const LocationPickerModal = ({ visible, onClose, onSelect }: LocationPickerModalProps) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      const fetchLocations = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('locations').select('*');
        if (error) {
          console.error('Error fetching locations:', error);
        } else {
          setLocations(data || []);
        }
        setLoading(false);
      };
      fetchLocations();
    }
  }, [visible]);

  const handleSelect = (location: Location) => {
    onSelect(location);
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
            <Text style={styles.headerTitle}>Chọn cửa hàng</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#73509c" />
          ) : (
            <FlatList
              data={locations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.locationItem} onPress={() => handleSelect(item)}>
                  <Ionicons name="storefront-outline" size={24} color="#73509c" style={styles.locationIcon} />
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationName}>{item.name}</Text>
                    <Text style={styles.locationAddress}>{item.address}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
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
  locationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  locationIcon: { marginRight: 16 },
  locationDetails: { flex: 1 },
  locationName: { fontSize: 16, fontWeight: 'bold' },
  locationAddress: { fontSize: 14, color: '#666', marginTop: 4 },
});

export default LocationPickerModal;