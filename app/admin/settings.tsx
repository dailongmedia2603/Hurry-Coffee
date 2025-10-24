import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/src/integrations/supabase/client';
import { useAuth } from '@/src/context/AuthContext';
import { useScreenSize } from '@/src/hooks/useScreenSize';

const PROMO_IMAGE_KEY = 'promo_image_url';
const PROFILE_FEATURE_KEY = 'feature_profile_enabled';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { isDesktop } = useScreenSize();

  // State cho ảnh quảng cáo
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);
  const [uploading, setUploading] = useState(false);

  // State cho tính năng hồ sơ
  const [isProfileFeatureEnabled, setIsProfileFeatureEnabled] = useState(true);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [savingFeatures, setSavingFeatures] = useState(false);

  const fetchSettings = async () => {
    setLoadingImage(true);
    setLoadingFeatures(true);

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value');
    
    if (error) {
      Alert.alert('Lỗi', 'Không thể tải cài đặt ứng dụng.');
    } else {
      const settingsMap = new Map(data.map(setting => [setting.key, setting.value]));
      
      setImageUrl(settingsMap.get(PROMO_IMAGE_KEY) || null);

      const profileEnabledValue = settingsMap.get(PROFILE_FEATURE_KEY);
      setIsProfileFeatureEnabled(profileEnabledValue === 'true' || profileEnabledValue === undefined);
    }

    setLoadingImage(false);
    setLoadingFeatures(false);
  };

  useEffect(() => {
    fetchSettings();
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

  const handleSaveImage = async () => {
    if (!selectedImage || !selectedImage.base64) return;

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

  const handleToggleProfileFeature = async (newValue: boolean) => {
    setSavingFeatures(true);
    setIsProfileFeatureEnabled(newValue);

    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: PROFILE_FEATURE_KEY, value: String(newValue) });

    if (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt. Vui lòng thử lại.');
      setIsProfileFeatureEnabled(!newValue);
    }
    setSavingFeatures(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cài đặt ứng dụng</Text>
        {Platform.OS !== 'web' && !isDesktop && (
          <TouchableOpacity onPress={signOut}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Ảnh quảng cáo ở trang chủ</Text>
        <Text style={styles.subtitle}>Ảnh này sẽ hiển thị ở đầu màn hình Menu của khách hàng.</Text>
        
        <View style={styles.imageContainer}>
          {loadingImage ? (
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

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveImage} disabled={uploading || !selectedImage}>
          {uploading ? <ActivityIndicator color="#fff" /> : (<><Ionicons name="save-outline" size={20} color="#fff" /><Text style={styles.saveButtonText}>Lưu thay đổi</Text></>)}
        </TouchableOpacity>

        <View style={styles.separator} />

        <Text style={styles.title}>Quản lý tính năng</Text>
        <Text style={styles.subtitle}>Bật hoặc tắt các tính năng cho người dùng cuối.</Text>

        <View style={styles.featureRow}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureLabel}>Hồ sơ & Xác thực SĐT</Text>
            <Text style={styles.featureDescription}>Cho phép người dùng đăng nhập, quản lý hồ sơ và xác thực số điện thoại sau khi đặt hàng.</Text>
          </View>
          {loadingFeatures ? <ActivityIndicator color="#73509c" /> : (
            <Switch
              trackColor={{ false: "#d1d5db", true: "#a78bfa" }}
              thumbColor={isProfileFeatureEnabled ? "#73509c" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={handleToggleProfileFeature}
              value={isProfileFeatureEnabled}
              disabled={savingFeatures}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  imageContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#e5e7eb', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  changeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 16 },
  changeButtonText: { color: '#73509c', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#73509c', paddingVertical: 14, borderRadius: 8 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  separator: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 24 },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  featureInfo: { flex: 1, marginRight: 16 },
  featureLabel: { fontSize: 16, fontWeight: '500', color: '#111827' },
  featureDescription: { fontSize: 13, color: '#6b7280', marginTop: 4 },
});