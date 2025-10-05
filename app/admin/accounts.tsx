import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import StaffFormModal from '@/src/components/admin/StaffFormModal';
import AssignLocationModal from '@/src/components/admin/AssignLocationModal';
import ConfirmDeleteModal from '@/src/components/admin/ConfirmDeleteModal';
import { useAuth } from '@/src/context/AuthContext';

interface StaffProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  location_name: string | null;
}

export default function ManageAccountsScreen() {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalVisible, setFormModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [isAssignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('staff_details').select('*');
      
    if (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách tài khoản.');
      setStaff([]);
    } else {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const allStaff = data as any || [];
      if (currentUser) {
        const filteredStaff = allStaff.filter((s: StaffProfile) => s.id !== currentUser.id);
        setStaff(filteredStaff);
      } else {
        setStaff(allStaff);
      }
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchStaff(); }, []));

  const openAddModal = () => {
    setSelectedStaff(null);
    setFormModalVisible(true);
  };

  const openEditModal = (staffMember: StaffProfile) => {
    setSelectedStaff(staffMember);
    setFormModalVisible(true);
  };

  const openAssignModal = (staffId: string) => {
    setSelectedStaffId(staffId);
    setAssignModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { error } = await supabase.from('profiles').delete().eq('id', itemToDelete);
    if (error) {
      Alert.alert('Lỗi', 'Không thể xóa tài khoản.');
    } else {
      fetchStaff();
    }
    setConfirmModalVisible(false);
    setItemToDelete(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài khoản ({staff.length + (profile ? 1 : 0)})</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Thêm nhân viên</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#73509c" style={styles.loader} />
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              {profile && (
                <View style={styles.currentUserSection}>
                  <Text style={styles.sectionTitle}>Đang đăng nhập với</Text>
                  <View style={styles.itemCard}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{profile.full_name || 'Admin'}</Text>
                      <Text style={itemRole(profile.role || 'admin')}>{profile.role || 'admin'}</Text>
                      <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={16} color="#6b7280" />
                        <Text style={styles.emailText}>{user?.email}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
              {staff.length > 0 && <Text style={[styles.sectionTitle, { paddingHorizontal: 16 }]}>Các tài khoản khác</Text>}
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.full_name || 'Chưa có tên'}</Text>
                <Text style={itemRole(item.role)}>{item.role}</Text>
                <TouchableOpacity style={styles.infoRow} onPress={() => openAssignModal(item.id)}>
                  <Ionicons name="storefront-outline" size={16} color="#6b7280" />
                  <Text style={locationText(!!item.location_name)}>
                    {item.location_name || 'Chưa gán địa điểm'}
                  </Text>
                </TouchableOpacity>
              </View>
              {item.role === 'staff' && (
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
                    <Ionicons name="pencil" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <StaffFormModal
        visible={isFormModalVisible}
        onClose={() => setFormModalVisible(false)}
        onSave={() => {
          setFormModalVisible(false);
          fetchStaff();
        }}
        staffMember={selectedStaff}
      />
      <AssignLocationModal
        visible={isAssignModalVisible}
        onClose={() => setAssignModalVisible(false)}
        onSave={() => {
          setAssignModalVisible(false);
          fetchStaff();
        }}
        staffMemberId={selectedStaffId}
      />
      <ConfirmDeleteModal
        visible={isConfirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        onConfirm={confirmDelete}
        title="Xóa tài khoản"
        message="Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác."
      />
    </SafeAreaView>
  );
}

const itemRole = (role: string) => ({
  fontSize: 12,
  fontWeight: 'bold' as 'bold',
  color: role === 'admin' ? '#16a34a' : '#6b7280',
  backgroundColor: role === 'admin' ? '#dcfce7' : '#f3f4f6',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 10,
  alignSelf: 'flex-start' as 'flex-start',
  overflow: 'hidden' as 'hidden',
  marginBottom: 8,
});

const locationText = (isAssigned: boolean) => ({
  marginLeft: 6,
  fontSize: 14,
  color: isAssigned ? '#1d4ed8' : '#9ca3af',
  textDecorationLine: 'underline' as 'underline',
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#73509c', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  itemCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, alignSelf: 'flex-start' },
  itemActions: { flexDirection: 'row' },
  actionButton: { padding: 8, marginLeft: 8 },
  currentUserSection: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 12,
  },
  emailText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6b7280',
  },
});