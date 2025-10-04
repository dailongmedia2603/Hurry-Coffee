import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { UserAddress } from '@/types';
import AddressModal from '@/src/components/AddressModal';

export default function AddressScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);

  const fetchAddresses = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching addresses:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách địa chỉ.');
    } else {
      setAddresses(data || []);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [])
  );

  const openAddModal = () => {
    setSelectedAddress(null);
    setModalVisible(true);
  };

  const openEditModal = (address: UserAddress) => {
    setSelectedAddress(address);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa địa chỉ này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from('user_addresses').delete().eq('id', id);
            if (error) {
              Alert.alert('Lỗi', 'Không thể xóa địa chỉ.');
            } else {
              fetchAddresses();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Địa chỉ nhận nước</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Ionicons name="add" size={28} color="#73509c" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#73509c" style={{ marginTop: 20 }} />
      ) : addresses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Bạn chưa có địa chỉ nào.</Text>
          <TouchableOpacity style={styles.addAddressButton} onPress={openAddModal}>
            <Text style={styles.addAddressButtonText}>Thêm địa chỉ mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.addressCard}>
              <View style={styles.addressInfo}>
                <Text style={styles.addressName}>{item.name}</Text>
                <Text style={styles.addressText}>{item.address}</Text>
              </View>
              <View style={styles.addressActions}>
                <TouchableOpacity onPress={() => openEditModal(item)}>
                  <Ionicons name="pencil" size={22} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 16 }}>
                  <Ionicons name="trash-outline" size={22} color="#D50000" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <AddressModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={() => {
          fetchAddresses();
        }}
        address={selectedAddress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  addButton: { padding: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 20 },
  addAddressButton: { backgroundColor: '#73509c', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20 },
  addAddressButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  listContainer: { padding: 16 },
  addressCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addressInfo: { flex: 1 },
  addressName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  addressText: { fontSize: 14, color: '#666' },
  addressActions: { flexDirection: 'row' },
});