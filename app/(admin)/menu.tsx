import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Product } from '@/types';
import ProductForm from '@/src/components/admin/ProductForm';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
};

export default function MenuManagementScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách sản phẩm.');
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const openAddModal = () => {
    setSelectedProduct(null);
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa "${product.name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from('products').delete().eq('id', product.id);
            if (error) {
              Alert.alert('Lỗi', 'Không thể xóa sản phẩm.');
            } else {
              fetchProducts();
            }
          },
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productRow}>
      <Image source={{ uri: item.image_url || 'https://via.placeholder.com/100' }} style={styles.productImage} />
      <Text style={[styles.tableCell, { flex: 3 }]}>{item.name}</Text>
      <Text style={[styles.tableCell, { flex: 2 }]}>{item.category}</Text>
      <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>{formatPrice(item.price)}</Text>
      <View style={[styles.actions, { flex: 2 }]}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
          <Ionicons name="pencil" size={20} color="#1d4ed8" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={20} color="#b91c1c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý Thực đơn</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addButtonText}>Thêm món</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1f2937" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, { flex: 3, marginLeft: 60 }]}>Tên món</Text>
            <Text style={[styles.headerText, { flex: 2 }]}>Danh mục</Text>
            <Text style={[styles.headerText, { flex: 2, textAlign: 'right' }]}>Giá</Text>
            <Text style={[styles.headerText, { flex: 2, textAlign: 'center' }]}>Hành động</Text>
          </View>
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={renderProductItem}
          />
        </View>
      )}

      <ProductForm
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={fetchProducts}
        product={selectedProduct}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1f2937' },
  addButton: { flexDirection: 'row', backgroundColor: '#1f2937', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  table: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e2e8f0', padding: 16, backgroundColor: '#f8fafc' },
  headerText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  productRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  productImage: { width: 40, height: 40, borderRadius: 8, marginRight: 16 },
  tableCell: { fontSize: 16, color: '#334155' },
  actions: { flexDirection: 'row', justifyContent: 'center' },
  actionButton: { padding: 8, marginHorizontal: 4 },
});