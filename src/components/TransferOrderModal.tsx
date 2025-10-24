import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Location } from '@/types';
import ConfirmModal from './ConfirmModal';
import { useScreenSize } from '@/src/hooks/useScreenSize';

type TransferOrderModalProps = {
  visible: boolean;
  onClose: () => void;
  orderId: string | null;
  onSuccess: () => void;
};

const TransferOrderModal = ({ visible, onClose, orderId, onSuccess }: TransferOrderModalProps) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const { isDesktop } = useScreenSize();
  const isWebDesktop = Platform.OS === 'web' && isDesktop;

  useEffect(() => {
    if (visible) {
      const fetchLocations = async () => {
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
    } else {
      setSearchQuery('');
    }
  }, [visible]);

  const filteredLocations = useMemo(() => {
    if (!searchQuery) return locations;
    return locations.filter(loc => loc.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [locations, searchQuery]);

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
    setConfirmModalVisible(true);
  };

  const handleConfirmTransfer = async () => {
    if (!orderId || !selectedLocation) return;
    setConfirmModalVisible(false);
    setTransferring(true);

    try {
      const { error } = await supabase.functions.invoke('transfer-order', {
        body: {
          order_id: orderId,
          new_location_id: selectedLocation.id,
        },
      });

      if (error) throw new Error(error.message);

      Alert.alert('Thành công', `Đã chuyển đơn hàng đến "${selectedLocation.name}".`);
      onSuccess();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể chuyển đơn hàng.');
    } finally {
      setTransferring(false);
    }
  };

  return (
    <>
      <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
        <View style={[styles.modalOverlay, isWebDesktop && styles.desktopModalOverlay]}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
          <View style={[styles.modalContainer, isWebDesktop && styles.desktopModalContainer]}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Chuyển đơn hàng</Text>
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
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.locationItem} onPress={() => handleSelectLocation(item)}>
                    <Text style={styles.locationName}>{item.name}</Text>
                    <Text style={styles.locationAddress}>{item.address}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            {transferring && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#73509c" />
                <Text style={styles.loadingText}>Đang chuyển đơn...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      <ConfirmModal
        visible={isConfirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        onConfirm={handleConfirmTransfer}
        title="Xác nhận chuyển đơn"
        message={`Bạn có chắc chắn muốn chuyển đơn hàng này đến "${selectedLocation?.name}" không?`}
        confirmText="Xác nhận"
        icon="swap-horizontal-outline"
        iconColor="#3b82f6"
      />
    </>
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
  locationItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  locationName: { fontSize: 16, fontWeight: '500' },
  locationAddress: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#333' },
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

export default TransferOrderModal;