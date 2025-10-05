import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/src/integrations/supabase/client';
import { Product } from '@/types';

type ProductFormProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  product: Product | null;
};

const formatCurrency = (value: string) => {
  if (!value) return '';
  const num = value.replace(/[^\d]/g, '');
  if (num === '' || isNaN(parseInt(num, 10))) return '';
  return new Intl.NumberFormat('vi-VN').format(parseInt(num, 10));
};

const parseCurrency = (value: string) => {
  return value.replace(/[^\d]/g, '');
};

const ProductForm = ({ visible, onClose, onSave, product: existingProduct }: ProductFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formattedPrice, setFormattedPrice] = useState('');
  const [formattedOriginalPrice, setFormattedOriginalPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (existingProduct) {
        setName(existingProduct.name);
        setDescription(existingProduct.description || '');
        setFormattedPrice(formatCurrency(existingProduct.price.toString()));
        setFormattedOriginalPrice(existingProduct.original_price ? formatCurrency(existingProduct.original_price.toString()) : '');
        setCategory(existingProduct.category || '');
        setImageUrl(existingProduct.image_url || '');
      } else {
        setName('');
        setDescription('');
        setFormattedPrice('');
        setFormattedOriginalPrice('');
        setCategory('');
        setImageUrl('');
      }
      setSelectedImage(null);
    }
  }, [existingProduct, visible]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
      setImageUrl(result.assets[0].uri); // For local preview
    }
  };

  const handleSave = async () => {
    if (!name || !formattedPrice) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền tên và giá sản phẩm.');
      return;
    }

    setLoading(true);
    let finalImageUrl = existingProduct?.image_url || '';

    if (selectedImage && selectedImage.base64) {
      setUploading(true);
      const fileExt = selectedImage.uri.split('.').pop();
      const filePath = `public/${Date.now()}.${fileExt}`;
      const contentType = selectedImage.mimeType ?? 'image/jpeg';

      try {
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, decode(selectedImage.base64), { contentType, upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      } catch (error: any) {
        Alert.alert('Lỗi tải ảnh', error.message);
        setLoading(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const productData = {
      name,
      description,
      price: parseFloat(parseCurrency(formattedPrice)),
      original_price: formattedOriginalPrice ? parseFloat(parseCurrency(formattedOriginalPrice)) : null,
      category,
      image_url: finalImageUrl,
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
            <TextInput style={styles.input} value={formattedPrice} onChangeText={(text) => setFormattedPrice(formatCurrency(text))} keyboardType="numeric" />
            <Text style={styles.label}>Giá gốc (VND) - Tùy chọn</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Nhập giá gốc để hiển thị giảm giá"
              value={formattedOriginalPrice} 
              onChangeText={(text) => setFormattedOriginalPrice(formatCurrency(text))} 
              keyboardType="numeric" 
            />
            <Text style={styles.label}>Phân loại</Text>
            <TextInput style={styles.input} value={category} onChangeText={setCategory} />
            
            <Text style={styles.label}>Hình ảnh</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={40} color="#9ca3af" />
                  <Text style={styles.imagePlaceholderText}>Chọn ảnh</Text>
                </View>
              )}
            </TouchableOpacity>
            {uploading && <ActivityIndicator style={{ marginTop: 10 }} color="#73509c" />}

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
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, fontSize: 16 },
  saveButton: { backgroundColor: '#73509c', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  imagePicker: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#6b7280',
  },
});

export default ProductForm;