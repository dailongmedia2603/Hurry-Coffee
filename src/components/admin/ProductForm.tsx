import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/src/integrations/supabase/client';
import { decode } from 'base64-arraybuffer';

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
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setDescription(existingProduct.description || '');
      setPrice(String(existingProduct.price));
      setCategory(existingProduct.category || '');
      setImage(existingProduct.image_url);
    } else {
      // Reset form for new product
      setName('');
      setDescription('');
      setPrice('');
      setCategory('');
      setImage(null);
    }
  }, [existingProduct, visible]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    if (!uri.startsWith('file://')) {
      // This is likely already a URL, no need to re-upload
      return uri;
    }
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const contentType = `image/${fileExt}`;
      const filePath = `public/${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, blob, { contentType, upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Lỗi', 'Không thể tải ảnh lên.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !price || !category) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền tên, giá và danh mục.');
      return;
    }

    setLoading(true);
    let imageUrl = image;
    if (image && image.startsWith('file://')) {
      imageUrl = await uploadImage(image);
      if (!imageUrl) {
        setLoading(false);
        return;
      }
    }

    const productData = {
      name,
      description,
      price: parseFloat(price),
      category,
      image_url: imageUrl,
    };

    let error;
    if (existingProduct) {
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', existingProduct.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('products')
        .insert(productData);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      console.error('Error saving product:', error);
      Alert.alert('Lỗi', 'Không thể lưu sản phẩm.');
    } else {
      onSave();
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{existingProduct ? 'Sửa món ăn' : 'Thêm món mới'}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.productImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={40} color="#999" />
                  <Text style={styles.imagePlaceholderText}>Chọn ảnh</Text>
                </View>
              )}
            </TouchableOpacity>
            {uploading && <ActivityIndicator style={{ marginVertical: 10 }} />}

            <Text style={styles.label}>Tên món ăn</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text style={styles.label}>Mô tả</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline />

            <Text style={styles.label}>Giá (VND)</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />

            <Text style={styles.label}>Danh mục</Text>
            <TextInput style={styles.input} value={category} onChangeText={setCategory} />
          </ScrollView>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading || uploading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Lưu</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { backgroundColor: 'white', borderRadius: 16, padding: 24, width: '90%', maxWidth: 600, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  label: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 15, fontSize: 16 },
  textArea: { height: 100 },
  saveButton: { backgroundColor: '#1f2937', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  imagePicker: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  productImage: { width: 150, height: 150, borderRadius: 12, backgroundColor: '#eee' },
  imagePlaceholder: { width: 150, height: 150, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { marginTop: 8, color: '#999' },
});

export default ProductForm;