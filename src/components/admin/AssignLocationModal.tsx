import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Location } from '@/types';

type AssignLocationModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  staffMemberId: string | null;
};

const AssignLocationModal = ({ visible, onClose, onSave, staffMemberId }: AssignLocationModalProps) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!visible) return;
      setLoading(true);
      const { data, error } = await supabase.from('locations').select('*').order('name');
      if (error) {
        Alert.alert('Lỗi', 'Không thể tải danh sách địa điểm.');
      } else {
        setLocations(data || []);
      }
      setLoading(false);
    };
    fetchLocations();
  }, [visible]);

  const handleSelectLocation = async (locationId: string | null) => {
    if (!staffMemberId) return;
    const { error } = await supabase
      .from('profiles')
      .update({ location_id: locationId })
      .eq('id', staffMemberId);

    if (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật địa điểm cho nhân viên.');
    } else {
      onSave();
      onClose();
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Gán địa điểm</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#73509c" />
          ) : (
            <FlatList
              data={locations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.locationItem} onPress={() => handleSelectLocation(item.id)}>
                  <Text style={styles.locationName}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListHeaderComponent={
                <TouchableOpacity style={styles.locationItem} onPress={() => handleSelectLocation(null)}>
                  <Text style={[styles.locationName, styles.unassignText]}>Bỏ gán địa điểm</Text>
                </TouchableOpacity>
              }
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  locationItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  locationName: { fontSize: 16 },
  unassignText: { color: '#ef4444' },
});

export default AssignLocationModal;