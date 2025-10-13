import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/src/integrations/supabase/client';
import { Product, ProductCategory, Topping } from '@/types';
import CategoryPickerModal from './CategoryPickerModal';

const formatCurrency = (value: string) => {
  if (!value) return '';
  const num = value.replace(/[^\d]/g, '');
  if (num === '' || isNaN(parseInt(num, 10))) return '';
  return new Intl.NumberFormat('vi-VN').format(parseInt(num, 10));
};

const parseCurrency = (value: string) => {
  return value.replace(/[^\d]/g, '');
};

type ProductFormProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  product: Product | null;
};

type SizeOption = { name: string; price: string };

const ProductForm = ({ visible, onClose, onSave, product: existingProduct }: ProductFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  
  const [sizes, setSizes] = useState<SizeOption[]>([{ name: 'M', price: '' }]);
  const [availableOptions, setAvailableOptions] = useState<string[]>(['Ít ngọt', 'Không đá', 'Đá riêng']);
  const [newOption, setNewOption] = useState('');
  
  const [allToppings, setAllToppings] = useState<Topping[]>([]);
  const [selectedToppingIds, setSelectedToppingIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [allCategories, setAllCategories] = useState<ProductCategory[]>([]);
  const [isCategoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    const [catRes, topRes] = await Promise.all([
      supabase.from('product_categories').select('*').order('name'),
      supabase.from('toppings').select('*').order('name')
    ]);
    if (catRes.data) setAllCategories(catRes.data);
    if (topRes.data) setAllToppings(topRes.data);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (visible) {
      fetchData();
      if (existingProduct) {
        setName(existingProduct.name);
        setDescription(existingProduct.description || '');
        setCategory(existingProduct.category || '');
        setImageUrl(existingProduct.image_url || '');
        setSizes(existingProduct.sizes?.map(s => ({ name: s.name, price: formatCurrency(s.price.toString()) })) || [{ name: 'M', price: formatCurrency(existingProduct.price.toString()) }]);
        setAvailableOptions(existingProduct.available_options || []);
        
        supabase.from('product_toppings').select('topping_id').eq('product_id', existingProduct.id)
          .then(({ data }) => {
            if (data) {
              setSelectedToppingIds(new Set(data.map(t => t.topping_id)));
            }
          });

      } else {
        setName('');
        setDescription('');
        setCategory('');
        setImageUrl('');
        setSizes([{ name: 'M', price: '' }]);
        setAvailableOptions(['Ít ngọt', 'Không đá', 'Đá riêng']);
        setSelectedToppingIds(new Set());
      }
      setSelectedImage(null);
      setNewOption('');
    }
  }, [existingProduct, visible, fetchData]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
      setImageUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name || sizes.some(s => !s.name || !s.price)) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền tên sản phẩm và đầy đủ thông tin các size.');
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
        const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, decode(selectedImage.base64), { contentType, upsert: true });
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

    const basePrice = sizes.length > 0 ? parseFloat(parseCurrency(sizes[0].price)) : 0;

    const productData = {
      id: existingProduct?.id,
      name,
      description,
      price: basePrice,
      category,
      image_url: finalImageUrl,
      sizes: sizes.map(s => ({ name: s.name, price: parseFloat(parseCurrency(s.price)) })),
      available_options: availableOptions.filter(o => o.trim() !== ''),
    };

    const { data: savedProduct, error: productError } = await supabase.from('products').upsert(productData).select().single();

    if (productError || !savedProduct) {
      setLoading(false);
      Alert.alert('Lỗi', productError?.message || 'Không thể lưu sản phẩm.');
      return;
    }

    const { error: deleteToppingsError } = await supabase.from('product_toppings').delete().eq('product_id', savedProduct.id);
    if (deleteToppingsError) {
      console.error("Error clearing old toppings:", deleteToppingsError);
    }

    if (selectedToppingIds.size > 0) {
      const toppingsToInsert = Array.from(selectedToppingIds).map(topping_id => ({
        product_id: savedProduct.id,
        topping_id,
      }));
      const { error: insertToppingsError } = await supabase.from('product_toppings').insert(toppingsToInsert);
      if (insertToppingsError) {
        console.error("Error inserting new toppings:", insertToppingsError);
      }
    }

    setLoading(false);
    onSave();
    onClose();
  };

  // Functions to manage dynamic inputs
  const handleSizeChange = (index: number, field: 'name' | 'price', value: string) => {
    const newSizes = [...sizes];
    newSizes[index][field] = field === 'price' ? formatCurrency(value) : value;
    setSizes(newSizes);
  };
  const addSize = () => setSizes([...sizes, { name: '', price: '' }]);
  const removeSize = (index: number) => setSizes(sizes.filter((_, i) => i !== index));

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...availableOptions];
    newOptions[index] = value;
    setAvailableOptions(newOptions);
  };
  const addOption = () => {
    if (newOption.trim()) {
      setAvailableOptions([...availableOptions, newOption.trim()]);
      setNewOption('');
    }
  };
  const removeOption = (index: number) => setAvailableOptions(availableOptions.filter((_, i) => i !== index));

  const toggleTopping = (id: string) => {
    const newSet = new Set(selectedToppingIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedToppingIds(newSet);
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
          <ScrollView showsVerticalScrollIndicator={false}>
            {dataLoading ? <ActivityIndicator /> : (
              <>
                <Text style={styles.label}>Tên sản phẩm</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} />
                
                <Text style={styles.label}>Mô tả</Text>
                <TextInput style={styles.input} value={description} onChangeText={setDescription} multiline />
                
                <Text style={styles.label}>Phân loại</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setCategoryPickerVisible(true)}>
                  <Text style={[styles.pickerButtonText, !category && styles.placeholderText]}>{category || 'Chọn một phân loại'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
                
                <Text style={styles.label}>Hình ảnh</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.imagePreview} /> : <View style={styles.imagePlaceholder}><Ionicons name="camera-outline" size={40} color="#9ca3af" /><Text style={styles.imagePlaceholderText}>Chọn ảnh</Text></View>}
                </TouchableOpacity>
                {uploading && <ActivityIndicator style={{ marginTop: 10 }} color="#73509c" />}

                <Text style={styles.sectionTitle}>Các loại Size</Text>
                {sizes.map((size, index) => (
                  <View key={index} style={styles.dynamicRow}>
                    <TextInput style={[styles.input, styles.sizeNameInput]} placeholder="Tên size (S, M, L...)" value={size.name} onChangeText={(val) => handleSizeChange(index, 'name', val)} />
                    <TextInput style={[styles.input, styles.sizePriceInput]} placeholder="Giá (VND)" value={size.price} onChangeText={(val) => handleSizeChange(index, 'price', val)} keyboardType="numeric" />
                    <TouchableOpacity onPress={() => removeSize(index)}><Ionicons name="trash-outline" size={24} color="#ef4444" /></TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addButton} onPress={addSize}><Text style={styles.addButtonText}>+ Thêm Size</Text></TouchableOpacity>

                <Text style={styles.sectionTitle}>Các tùy chọn (không tính phí)</Text>
                {availableOptions.map((option, index) => (
                  <View key={index} style={styles.dynamicRow}>
                    <TextInput style={[styles.input, {flex: 1}]} value={option} onChangeText={(val) => handleOptionChange(index, val)} />
                    <TouchableOpacity onPress={() => removeOption(index)}><Ionicons name="trash-outline" size={24} color="#ef4444" /></TouchableOpacity>
                  </View>
                ))}
                <View style={styles.dynamicRow}>
                  <TextInput style={[styles.input, {flex: 1}]} placeholder="Tên tùy chọn mới" value={newOption} onChangeText={setNewOption} />
                  <TouchableOpacity style={styles.addCircleButton} onPress={addOption}><Ionicons name="add-circle" size={28} color="#73509c" /></TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Topping có sẵn cho món này</Text>
                {allToppings.map(topping => (
                  <TouchableOpacity key={topping.id} style={styles.toppingRow} onPress={() => toggleTopping(topping.id)}>
                    <Ionicons name={selectedToppingIds.has(topping.id) ? 'checkbox' : 'square-outline'} size={24} color={selectedToppingIds.has(topping.id) ? "#73509c" : "#ccc"} />
                    <Text style={styles.toppingName}>{topping.name}</Text>
                    <Text style={styles.toppingPrice}>+{formatCurrency(topping.price.toString())}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Lưu</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <CategoryPickerModal visible={isCategoryPickerVisible} onClose={() => setCategoryPickerVisible(false)} categories={allCategories} onSelect={(cat) => { setCategory(cat); setCategoryPickerVisible(false); }} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, fontSize: 16 },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, height: 50 },
  pickerButtonText: { fontSize: 16, color: '#111827' },
  placeholderText: { color: '#9ca3af' },
  imagePicker: { width: '100%', height: 150, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginTop: 4, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center' },
  imagePlaceholderText: { marginTop: 8, color: '#6b7280' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 16 },
  dynamicRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  sizeNameInput: { width: '35%' },
  sizePriceInput: { flex: 1 },
  addButton: { paddingVertical: 8, alignItems: 'center', backgroundColor: '#eef2ff', borderRadius: 8 },
  addButtonText: { color: '#4f46e5', fontWeight: '500' },
  addCircleButton: { paddingLeft: 8 },
  toppingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  toppingName: { flex: 1, marginLeft: 12, fontSize: 16 },
  toppingPrice: { fontSize: 16, color: '#6b7280' },
  saveButton: { backgroundColor: '#73509c', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ProductForm;