import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Product } from '@/types';
import ProductForm from '@/src/components/admin/ProductForm';
import ConfirmDeleteModal from '@/src/components/admin/ConfirmDeleteModal';
import CategoryManagerModal from '@/src/components/admin/CategoryManagerModal';

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export default function ManageProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalVisible, setFormModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách sản phẩm.');
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchProducts(); }, []));

  const openAddModal = () => {
    setSelectedProduct(null);
    setFormModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { error } = await supabase.from('products').delete().eq('id', itemToDelete);
    if (error) {
      Alert.alert('Lỗi', 'Không thể xóa sản phẩm.');
    } else {
      fetchProducts();
    }
    setConfirmModalVisible(false);
    setItemToDelete(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sản phẩm ({products.length})</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.manageButton} onPress={() => setCategoryModalVisible(true)}>
            <Ionicons name="options-outline" size={20} color="#73509c" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Thêm mới</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#73509c" style={styles.loader} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Image source={{ uri: item.image_url || 'https://via.placeholder.com/100' }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
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
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <ProductForm
        visible={isFormModalVisible}
        onClose={() => setFormModalVisible(false)}
        onSave={fetchProducts}
        product={selectedProduct}
      />

      <ConfirmDeleteModal
        visible={isConfirmModalVisible}
        onClose={() => {
          setConfirmModalVisible(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Xóa sản phẩm"
        message="Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
      />
      
      <CategoryManagerModal
        visible={isCategoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '600', flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  manageButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 10,
  },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#73509c', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
  loader: { marginTop: 20 },
  listContainer: { padding: 16 },
  itemCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  itemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  itemCategory: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '500', color: '#16a34a' },
  itemActions: { flexDirection: 'row' },
  actionButton: { padding: 8, marginLeft: 8 },
});