import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { ProductCategory } from '@/types';

type CategoryManagerModalProps = {
  visible: boolean;
  onClose: () => void;
};

const CategoryManagerModal = ({ visible, onClose }: CategoryManagerModalProps) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('product_categories').select('*').order('name', { ascending: true });
    if (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách phân loại.');
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      fetchCategories();
    }
  }, [visible]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsAdding(true);
    const { error } = await supabase.from('product_categories').insert({ name: newCategoryName.trim() });
    if (error) {
      Alert.alert('Lỗi', 'Không thể thêm phân loại mới. Có thể tên đã tồn tại.');
    } else {
      setNewCategoryName('');
      await fetchCategories();
    }
    setIsAdding(false);
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc muốn xóa phân loại này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('product_categories').delete().eq('id', id);
          if (error) {
            Alert.alert('Lỗi', 'Không thể xóa phân loại.');
          } else {
            await fetchCategories();
          }
        },
      },
    ]);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Quản lý Phân loại</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
          </View>
          
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="Tên phân loại mới"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddCategory} disabled={isAdding}>
              {isAdding ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="add" size={24} color="#fff" />}
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#73509c" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryName}>{item.name}</Text>
                  <TouchableOpacity onPress={() => handleDeleteCategory(item.id)}>
                    <Ionicons name="trash-outline" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={{ paddingTop: 10 }}
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
    modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: '60%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    addForm: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, fontSize: 16, marginRight: 10 },
    addButton: { backgroundColor: '#73509c', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    categoryName: { fontSize: 16 },
});

export default CategoryManagerModal;