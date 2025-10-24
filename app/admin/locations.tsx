import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Location } from '@/types';
import LocationForm from '@/src/components/admin/LocationForm';
import ConfirmDeleteModal from '@/src/components/admin/ConfirmDeleteModal';
import { useScreenSize } from '@/src/hooks/useScreenSize';

export default function ManageLocationsScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalVisible, setFormModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const { width, isDesktop } = useScreenSize();

  const numColumns = isDesktop ? Math.min(4, Math.max(1, Math.floor((width - 32) / 350))) : 1;

  const fetchLocations = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('locations').select('*').order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách địa điểm.');
    } else {
      setLocations(data || []);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchLocations(); }, []));

  const openAddModal = () => {
    setSelectedLocation(null);
    setFormModalVisible(true);
  };

  const openEditModal = (location: Location) => {
    setSelectedLocation(location);
    setFormModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { error } = await supabase.from('locations').delete().eq('id', itemToDelete);
    if (error) {
      Alert.alert('Lỗi', 'Không thể xóa địa điểm.');
    } else {
      fetchLocations();
    }
    setConfirmModalVisible(false);
    setItemToDelete(null);
  };

  const renderItem = ({ item }: { item: Location }) => {
    if (!isDesktop) {
      // Mobile List Layout
      return (
        <View style={styles.mobileItemCard}>
          <Image source={{ uri: item.image_url || 'https://via.placeholder.com/100' }} style={styles.mobileItemImage} />
          <View style={styles.mobileItemInfo}>
            <View>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemAddress} numberOfLines={2}>{item.address}</Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
                <Ionicons name="pencil" size={20} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    // Desktop Grid Layout
    return (
      <View style={styles.itemCard}>
        <Image source={{ uri: item.image_url || 'https://via.placeholder.com/100' }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemAddress} numberOfLines={2}>{item.address}</Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
            <Ionicons name="pencil" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh sách địa điểm ({locations.length})</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Thêm mới</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#73509c" style={styles.loader} />
      ) : (
        <FlatList
          data={locations}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={isDesktop ? styles.listContainer : styles.mobileListContainer}
        />
      )}

      <LocationForm
        visible={isFormModalVisible}
        onClose={() => setFormModalVisible(false)}
        onSave={fetchLocations}
        location={selectedLocation}
      />

      <ConfirmDeleteModal
        visible={isConfirmModalVisible}
        onClose={() => {
          setConfirmModalVisible(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Xóa địa điểm"
        message="Bạn có chắc chắn muốn xóa địa điểm này? Hành động này không thể hoàn tác."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#73509c', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
  loader: { marginTop: 20, flex: 1 },
  listContainer: { padding: 8 },
  mobileListContainer: { paddingHorizontal: 0, paddingVertical: 8 },
  itemCard: { 
    flex: 1,
    backgroundColor: '#fff', 
    borderRadius: 12, 
    margin: 8, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
    maxWidth: 350,
  },
  itemImage: { width: '100%', height: 120, backgroundColor: '#f3f4f6' },
  itemInfo: { padding: 12, flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  itemAddress: { fontSize: 14, color: '#6b7280' },
  itemActions: { 
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 8,
  },
  actionButton: { padding: 4, marginLeft: 8 },
  mobileItemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  mobileItemImage: {
    width: 100,
    height: 'auto',
    backgroundColor: '#f3f4f6',
  },
  mobileItemInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
});