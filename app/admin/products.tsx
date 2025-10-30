import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Product, ProductCategory } from '@/types';
import ProductForm from '@/src/components/admin/ProductForm';
import ConfirmDeleteModal from '@/src/components/admin/ConfirmDeleteModal';
import CategoryManagerModal from '@/src/components/admin/CategoryManagerModal';
import ToppingManagerModal from '@/src/components/admin/ToppingManagerModal';
import ImportProductsModal from '@/src/components/admin/ImportProductsModal';
import { useScreenSize } from '@/src/hooks/useScreenSize';

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export default function ManageProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormModalVisible, setFormModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isToppingModalVisible, setToppingModalVisible] = useState(false);
  const [isImportModalVisible, setImportModalVisible] = useState(false);
  const { width, isDesktop } = useScreenSize();

  const numColumns = isDesktop ? Math.min(5, Math.max(1, Math.floor((width - 32) / 280))) : 1;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('product_categories').select('*').order('name', { ascending: true })
    ]);

    if (productsRes.error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách sản phẩm.');
    } else {
      setProducts(productsRes.data || []);
    }

    if (categoriesRes.error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách phân loại.');
    } else {
      setCategories(categoriesRes.data || []);
    }
    setLoading(false);
  }, []);

  useFocusEffect(fetchData);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) {
      return products;
    }
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

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
      fetchData();
    }
    setConfirmModalVisible(false);
    setItemToDelete(null);
  };

  const renderItem = ({ item }: { item: Product }) => {
    if (!isDesktop) {
      // Mobile List Layout
      return (
        <View style={styles.mobileItemCard}>
          <Image source={{ uri: item.image_url || 'https://via.placeholder.com/100' }} style={styles.mobileItemImage} />
          <View style={styles.mobileItemInfo}>
            <View>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemCategory}>{item.category || 'Chưa phân loại'}</Text>
            </View>
            <View style={styles.mobileCardFooter}>
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
        </View>
      );
    }

    // Desktop Grid Layout
    return (
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
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sản phẩm ({filteredProducts.length})</Text>
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

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollView}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory ? styles.categoryChipActive : {}]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryChipText, !selectedCategory ? styles.categoryChipTextActive : {}]}>Tất cả</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategory === cat.name ? styles.categoryChipActive : {}]}
              onPress={() => setSelectedCategory(cat.name)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat.name ? styles.categoryChipTextActive : {}]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#73509c" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredProducts}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={isDesktop ? styles.listContainer : styles.mobileListContainer}
        />
      )}

      <ProductForm
        visible={isFormModalVisible}
        onClose={() => setFormModalVisible(false)}
        onSave={fetchData}
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
        onSuccess={fetchData}
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
  mobileListContainer: { paddingHorizontal: 0, paddingVertical: 8 },
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
    maxWidth: 264,
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
  mobileCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  filterContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterScrollView: {
    alignItems: 'center',
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: '#f0eaf8',
    borderColor: '#73509c',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  categoryChipTextActive: {
    color: '#73509c',
    fontWeight: '600',
  },
});