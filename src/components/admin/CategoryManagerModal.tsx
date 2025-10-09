import React, { useState, useEffect } from 'react';
import { Modal, View, Text, FlatList, TextInput, Pressable, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { ProductCategory } from '@/types';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import IconPickerModal from './IconPickerModal';

const CategoryManagerModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState<string | null>('fast-food-outline');
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);
  const [isIconPickerVisible, setIconPickerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchCategories();
    }
  }, [visible]);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('product_categories').select('*').order('name');
    if (data) setCategories(data);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { error } = await supabase.from('product_categories').insert({ name: newCategoryName, icon_name: newCategoryIcon });
    if (!error) {
      setNewCategoryName('');
      setNewCategoryIcon('fast-food-outline');
      fetchCategories();
    } else {
      Alert.alert('Lỗi', 'Không thể thêm phân loại mới.');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    const { error } = await supabase.rpc('update_category_and_products', {
        p_category_id: editingCategory.id,
        p_new_name: editingCategory.name,
        p_new_icon_name: editingCategory.icon_name
    });

    if (!error) {
      setEditingCategory(null);
      fetchCategories();
    } else {
      Alert.alert('Lỗi', 'Không thể cập nhật phân loại.');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    const { error } = await supabase.from('product_categories').delete().eq('id', deletingCategory.id);
    if (!error) {
      setDeletingCategory(null);
      fetchCategories();
    } else {
      Alert.alert('Lỗi', 'Không thể xoá phân loại. Có thể vẫn còn sản phẩm thuộc phân loại này.');
    }
  };

  const renderCategoryItem = ({ item }: { item: ProductCategory }) => {
    if (editingCategory && editingCategory.id === item.id) {
      return (
        <View style={styles.editingItemContainer}>
          <Pressable onPress={() => setIconPickerVisible(true)}>
            <Ionicons name={(editingCategory.icon_name as any) || 'help-circle-outline'} size={24} color="black" />
          </Pressable>
          <TextInput
            style={styles.editInput}
            value={editingCategory.name}
            onChangeText={(text) => setEditingCategory((cat: ProductCategory | null) => (cat ? { ...cat, name: text } : null))}
            autoFocus={true}
          />
          <Pressable onPress={handleUpdateCategory}><Ionicons name="checkmark-circle" size={24} color="green" /></Pressable>
          <Pressable onPress={() => setEditingCategory(null)}><Ionicons name="close-circle" size={24} color="gray" /></Pressable>
        </View>
      );
    }

    return (
      <View style={styles.itemContainer}>
        <Ionicons name={(item.icon_name as any) || 'help-circle-outline'} size={24} color="black" />
        <Text style={styles.itemText}>{item.name}</Text>
        <View style={styles.itemActions}>
          <Pressable onPress={() => setEditingCategory(item)}><Ionicons name="pencil" size={20} color="blue" /></Pressable>
          <Pressable onPress={() => setDeletingCategory(item)}><Ionicons name="trash" size={20} color="red" /></Pressable>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Quản lý Phân loại</Text>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
        <View style={styles.addContainer}>
          <Pressable onPress={() => setIconPickerVisible(true)}>
            <Ionicons name={(newCategoryIcon as any) || 'help-circle-outline'} size={24} color="black" />
          </Pressable>
          <TextInput
            style={styles.addInput}
            placeholder="Tên phân loại mới"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <Pressable style={styles.addButton} onPress={handleAddCategory}>
            <Text style={styles.addButtonText}>Thêm</Text>
          </Pressable>
        </View>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Đóng</Text>
        </Pressable>
      </SafeAreaView>
      <ConfirmDeleteModal
        visible={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteCategory}
        itemName={deletingCategory?.name || ''}
      />
      <IconPickerModal 
        visible={isIconPickerVisible} 
        onClose={() => setIconPickerVisible(false)} 
        onSelectIcon={(icon: string) => {
          if (editingCategory) {
            setEditingCategory((cat: ProductCategory | null) => (cat ? { ...cat, icon_name: icon } : null));
          } else {
            setNewCategoryIcon(icon);
          }
          setIconPickerVisible(false);
        }} 
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 20, paddingHorizontal: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    list: { flex: 1 },
    itemContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    editingItemContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#eee' },
    itemText: { flex: 1, fontSize: 16, marginLeft: 10 },
    itemActions: { flexDirection: 'row', gap: 15 },
    editInput: { flex: 1, fontSize: 16, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 5, marginHorizontal: 10 },
    addContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20, borderTopWidth: 1, paddingTop: 10, borderColor: '#eee' },
    addInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginHorizontal: 10 },
    addButton: { backgroundColor: 'green', padding: 10, borderRadius: 5 },
    addButtonText: { color: 'white' },
    closeButton: { marginTop: 20, backgroundColor: 'gray', padding: 15, borderRadius: 5, alignItems: 'center' },
    closeButtonText: { color: 'white', fontWeight: 'bold' },
});

export default CategoryManagerModal;