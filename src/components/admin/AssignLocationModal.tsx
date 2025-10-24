import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Location } from '@/types';
import { useScreenSize } from '@/src/hooks/useScreenSize';

type AssignLocationModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  staffMemberId: string | null;
};

const AssignLocationModal = ({ visible, onClose, onSave, staffMemberId }: AssignLocationModalProps) => {
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDesktop } = useScreenSize();
  const isWebDesktop = Platform.OS === 'web' && isDesktop;

  const fetchData = useCallback(async () => {
    if (!staffMemberId) return;
    setLoading(true);
    setSearchQuery('');

    const [locationsRes, assignedRes] = await Promise.all([
      supabase.from('locations').select('*').order('name'),
      supabase.from('staff_locations').select('location_id').eq('staff_id', staffMemberId)
    ]);

    if (locationsRes.error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách địa điểm.');
    } else {
      setAllLocations(locationsRes.data || []);
    }

    if (assignedRes.error) {
      Alert.alert('Lỗi', 'Không thể tải các địa điểm đã gán.');
    } else {
      setSelectedLocationIds(new Set(assignedRes.data.map(item => item.location_id)));
    }

    setLoading(false);
  }, [staffMemberId]);

  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible, fetchData]);

  const handleToggleLocation = (locationId: string) => {
    const newSelection = new Set(selectedLocationIds);
    if (newSelection.has(locationId)) {
      newSelection.delete(locationId);
    } else {
      newSelection.add(locationId);
    }
    setSelectedLocationIds(newSelection);
  };

  const handleSave = async () => {
    if (!staffMemberId) return;
    setSaving(true);

    try {
      // Delete all existing assignments for this staff member
      const { error: deleteError } = await supabase
        .from('staff_locations')
        .delete()
        .eq('staff_id', staffMemberId);
      if (deleteError) throw deleteError;

      // Insert the new set of assignments
      if (selectedLocationIds.size > 0) {
        const newAssignments = Array.from(selectedLocationIds).map(location_id => ({
          staff_id: staffMemberId,
          location_id,
        }));
        const { error: insertError } = await supabase.from('staff_locations').insert(newAssignments);
        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể cập nhật địa điểm cho nhân viên: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredLocations = allLocations.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, isWebDesktop && styles.desktopModalOverlay]}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.modalContainer, isWebDesktop && styles.desktopModalContainer]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Gán địa điểm</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm địa điểm..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#73509c" />
          ) : (
            <FlatList
              data={filteredLocations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedLocationIds.has(item.id);
                return (
                  <TouchableOpacity style={styles.locationItem} onPress={() => handleToggleLocation(item.id)}>
                    <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={24} color={isSelected ? '#73509c' : '#ccc'} />
                    <Text style={styles.locationName}>{item.name}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Lưu thay đổi</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: '70%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 15, marginBottom: 10 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 44, fontSize: 16 },
  locationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  locationName: { fontSize: 16, marginLeft: 12 },
  saveButton: { backgroundColor: '#73509c', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  desktopModalOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopModalContainer: {
    borderRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxWidth: 500,
    width: '100%',
    maxHeight: '90%',
    height: 'auto',
  },
});

export default AssignLocationModal;