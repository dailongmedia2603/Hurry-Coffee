import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Product } from '@/types';
import ProductForm from '@/src/components/admin/ProductForm';
import ConfirmDeleteModal from '@/src/components/admin/ConfirmDeleteModal';
import CategoryManagerModal from '@/src/components/admin/CategoryManagerModal';
import ToppingManagerModal from '@/src/components/admin/ToppingManagerModal';
import ImportProductsModal from '@/src/components/admin/ImportProductsModal';
import { useScreenSize } from '@/src/hooks/useScreenSize';

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export default function ManageProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalVisible, setFormModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isToppingModalVisible, setToppingModalVisible] = useState(false);
  const [isImportModalVisible, setImportModalVisible] = useState(false);
  const { width } = useScreenSize();

  const numColumns = Math.min(5, Math.max(1, Math.floor((width - 32) / 280)));

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
          <TouchableOpacity style={styles.manageButton} onPress={() => setImportModalVisible(true)}>
            <Ionicons name="cloud-upload-outline" size={20} color="#73509c" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.manageButton} onPress={() => setCategoryModalVisible(true)}>
            <Ionicons name="options-outline" size={20} color="#73509c" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.manageButton} onPress={() => setToppingModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#73509c" />
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
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Image source={{ uri: item.image_url || 'https://via.placeholder.com/280' }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category || 'Chưa phân loại'}</Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
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
      <ToppingManagerModal
        visible={isToppingModalVisible}
        onClose={() => setToppingModalVisible(false)}
      />
      <ImportProductsModal
        visible={isImportModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={fetchProducts}
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
  loader: { marginTop: 20, flex: 1 },
  listContainer: { padding: 8 },
  itemCard: { 
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#fff', 
    margin: 8,
    borderRadius: 12, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  itemImage: { 
    width: '100%', 
    height: 140,
    backgroundColor: '#f3f4f6',
  },
  itemInfo: { 
    flex: 1,
    padding: 12,
  },
  itemName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 4,
    minHeight: 40,
  },
  itemCategory: { 
    fontSize: 12, 
    color: '#6b7280', 
    marginBottom: 4 
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
  },
  itemPrice: { 
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a' 
  },
  itemActions: { 
    flexDirection: 'row' 
  },
  actionButton: { 
    padding: 4,
    marginLeft: 8 
  },
});