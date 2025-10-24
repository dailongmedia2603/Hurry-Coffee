import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { ProductCategory } from '@/types';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import IconPickerModal from './IconPickerModal';
import { useScreenSize } from '@/src/hooks/useScreenSize';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

type CategoryManagerModalProps = {
  visible: boolean;
  onClose: () => void;
};

const CategoryManagerModal = ({ visible, onClose }: CategoryManagerModalProps) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState<keyof typeof Ionicons.glyphMap>('fast-food-outline');
  const [isAdding, setIsAdding] = useState(false);

  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isIconPickerVisible, setIconPickerVisible] = useState(false);
  const { isDesktop } = useScreenSize();
  const isWebDesktop = Platform.OS === 'web' && isDesktop;

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('product_categories').select('*').order('name', { ascending: true });
    if (error) {
      showAlert('Lỗi', 'Không thể tải danh sách phân loại.');
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { if (visible) fetchCategories(); }, [visible]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsAdding(true);
    const { error } = await supabase.from('product_categories').insert({ name: newCategoryName.trim(), icon_name: newCategoryIcon });
    if (error) {
      showAlert('Lỗi', 'Không thể thêm phân loại mới. Có thể tên đã tồn tại.');
    } else {
      setNewCategoryName('');
      setNewCategoryIcon('fast-food-outline');
      await fetchCategories();
    }
    setIsAdding(false);
  };

  const handleDeleteCategory = (id: string) => {
    setItemToDelete(id);
    setConfirmModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { error } = await supabase.from('product_categories').delete().eq('id', itemToDelete);
    if (error) showAlert('Lỗi', 'Không thể xóa phân loại. Có thể vẫn còn sản phẩm thuộc phân loại này.');
    else await fetchCategories();
    setConfirmModalVisible(false);
    setItemToDelete(null);
  };

  const handleStartEdit = (category: ProductCategory) => setEditingCategory({ ...category });
  const handleCancelEdit = () => setEditingCategory(null);

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    setIsUpdating(true);
    const { error } = await supabase.rpc('update_category_and_products', {
      p_category_id: editingCategory.id,
      p_new_name: editingCategory.name.trim(),
      p_new_icon_name: editingCategory.icon_name
    });
    if (error) {
      showAlert('Lỗi', 'Không thể cập nhật phân loại. Tên có thể đã tồn tại.');
    } else {
      handleCancelEdit();
      await fetchCategories();
    }
    setIsUpdating(false);
  };

  const renderCategoryItem = ({ item }: { item: ProductCategory }) => {
    const isEditing = editingCategory?.id === item.id;
    if (isEditing) {
      return (
        <View style={[styles.categoryItem, styles.editingItem]}>
          <TouchableOpacity style={styles.iconEditButton} onPress={() => setIconPickerVisible(true)}>
            <Ionicons name={editingCategory.icon_name as any || 'help-circle'} size={24} color="#73509c" />
          </TouchableOpacity>
          <TextInput
            style={styles.editInput}
            value={editingCategory.name}
            onChangeText={(text) => setEditingCategory(cat => cat ? { ...cat, name: text } : null)}
            autoFocus={true}
            onSubmitEditing={handleUpdateCategory}
          />
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={handleUpdateCategory} disabled={isUpdating} style={styles.actionButton}>
              {isUpdating ? <ActivityIndicator size="small" /> : <Ionicons name="checkmark-circle" size={24} color="#16a34a" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.actionButton}>
              <Ionicons name="close-circle" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.categoryItem}>
        <Ionicons name={item.icon_name as any || 'help-circle'} size={24} color="#333" style={{ marginRight: 12 }} />
        <Text style={styles.categoryName}>{item.name}</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={() => handleStartEdit(item)} style={styles.actionButton}><Ionicons name="pencil" size={22} color="#3b82f6" /></TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteCategory(item.id)} style={styles.actionButton}><Ionicons name="trash-outline" size={22} color="#ef4444" /></TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, isWebDesktop && styles.desktopModalOverlay]}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.modalContainer, isWebDesktop && styles.desktopModalContainer]}>
          <View style={styles.header}><Text style={styles.headerTitle}>Quản lý Phân loại</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity></View>
          <View style={styles.addForm}>
            <TouchableOpacity style={styles.iconEditButton} onPress={() => setIconPickerVisible(true)}><Ionicons name={newCategoryIcon} size={24} color="#73509c" /></TouchableOpacity>
            <TextInput style={styles.input} placeholder="Tên phân loại mới" value={newCategoryName} onChangeText={setNewCategoryName} />
            <TouchableOpacity style={styles.addButton} onPress={handleAddCategory} disabled={isAdding}>{isAdding ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="add" size={24} color="#fff" />}</TouchableOpacity>
          </View>
          {loading ? <ActivityIndicator size="large" color="#73509c" style={{ marginTop: 20 }} /> : <FlatList data={categories} keyExtractor={(item) => item.id} renderItem={renderCategoryItem} contentContainerStyle={{ paddingTop: 10 }} />}
        </View>
      </View>
      <ConfirmDeleteModal visible={isConfirmModalVisible} onClose={() => { setConfirmModalVisible(false); setItemToDelete(null); }} onConfirm={confirmDelete} title="Xóa phân loại" message="Bạn có chắc chắn muốn xóa phân loại này? Hành động này không thể hoàn tác." />
      <IconPickerModal visible={isIconPickerVisible} onClose={() => setIconPickerVisible(false)} onSelectIcon={(icon) => {
          if (editingCategory) setEditingCategory(cat => cat ? { ...cat, icon_name: icon } : null);
          else setNewCategoryIcon(icon);
          setIconPickerVisible(false);
        }}
      />
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
    input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, fontSize: 16, marginHorizontal: 10 },
    addButton: { backgroundColor: '#73509c', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    categoryName: { fontSize: 16, flex: 1 },
    actionsContainer: { flexDirection: 'row', alignItems: 'center' },
    actionButton: { paddingHorizontal: 8 },
    editingItem: { paddingVertical: 8 },
    editInput: { flex: 1, fontSize: 16, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10, marginHorizontal: 10 },
    iconEditButton: { padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8 },
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

export default CategoryManagerModal;