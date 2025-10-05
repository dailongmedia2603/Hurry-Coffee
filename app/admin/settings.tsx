import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/src/integrations/supabase/client';

const PROMO_IMAGE_KEY = 'promo_image_url';

export default function SettingsScreen() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchCurrentImage = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', PROMO_IMAGE_KEY)
      .single();
    
    if (data?.value) {
      setImageUrl(data.value);
    } else {
      setImageUrl(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentImage();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
      setImageUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!selectedImage) {
      Alert.alert('Chưa có thay đổi', 'Vui lòng chọn một ảnh mới trước khi lưu.');
      return;
    }
    if (!selectedImage.base64) {
        Alert.alert('Lỗi', 'Không thể đọc dữ liệu ảnh.');
        return;
    }

    setUploading(true);
    try {
      const fileExt = selectedImage.uri.split('.').pop();
      const filePath = `public/promo-banner-${Date.now()}.${fileExt}`;
      const contentType = selectedImage.mimeType ?? 'image/jpeg';

      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(filePath, decode(selectedImage.base64), { contentType, upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('app-assets').getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('app_settings')
        .upsert({ key: PROMO_IMAGE_KEY, value: publicUrl });

      if (dbError) throw dbError;

      Alert.alert('Thành công', 'Đã cập nhật ảnh quảng cáo.');
      setImageUrl(publicUrl);
      setSelectedImage(null);

    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu ảnh.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Ảnh quảng cáo ở trang chủ</Text>
        <Text style={styles.subtitle}>Ảnh này sẽ hiển thị ở đầu màn hình Menu của khách hàng.</Text>
        
        <View style={styles.imageContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#73509c" />
          ) : (
            <Image 
              source={{ uri: imageUrl || 'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png' }} 
              style={styles.imagePreview} 
            />
          )}
        </View>

        <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={20} color="#73509c" />
          <Text style={styles.changeButtonText}>Thay đổi ảnh</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={uploading || !selectedImage}>
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 16,
  },
  changeButtonText: { color: '#73509c', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#73509c',
    paddingVertical: 14,
    borderRadius: 8,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});