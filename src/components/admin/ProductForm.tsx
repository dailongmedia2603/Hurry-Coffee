import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Product } from '@/types';

type ProductFormProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  product: Product | null;
};

const ProductForm = ({ visible, onClose, onSave, product: existingProduct }: ProductFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setDescription(existingProduct.description || '');
      setPrice(existingProduct.price.toString());
      setCategory(existingProduct.category || '');
      setImageUrl(existingProduct.image_url || '');
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCategory('');
      setImageUrl('');
    }
  }, [existingProduct, visible]);

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền tên và giá sản phẩm.');
      return;
    }

    setLoading(true);
    const productData = {
      name,
      description,
      price: parseFloat(price),
      category,
      image_url: imageUrl,
    };

    const { error } = existingProduct
      ? await supabase.from('products').update(productData).eq('id', existingProduct.id)
      : await supabase.from('products').insert(productData);

    setLoading(false);

    if (error) {
      Alert.alert('Lỗi', 'Không thể lưu sản phẩm.');
    } else {
      onSave();
      onClose();
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{existingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={styles.label}>Tên sản phẩm</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>Mô tả</Text>
            <TextInput style={styles.input} value={description} onChangeText={setDescription} multiline />
            <Text style={styles.label}>Giá (VND)</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />
            <Text style={styles.label}>Phân loại</Text>
            <TextInput style={styles.input} value={category} onChangeText={setCategory} />
            <Text style={styles.label}>URL Hình ảnh</Text>
            <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} />
          </ScrollView>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Lưu</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, fontSize: 16 },
  saveButton: { backgroundColor: '#73509c', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ProductForm;