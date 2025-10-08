import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/src/integrations/supabase/client';
import { Location } from '@/types';

type LocationFormProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  location: Location | null;
};

const LocationForm = ({ visible, onClose, onSave, location: existingLocation }: LocationFormProps) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (existingLocation) {
        setName(existingLocation.name);
        setAddress(existingLocation.address);
        setImageUrl(existingLocation.image_url || '');
        setOpeningHours(existingLocation.opening_hours || '');
        setGoogleMapsUrl(existingLocation.google_maps_url || '');
      } else {
        setName('');
        setAddress('');
        setImageUrl('');
        setOpeningHours('');
        setGoogleMapsUrl('');
      }
      setSelectedImage(null);
    }
  }, [existingLocation, visible]);

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
    if (!name || !address) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền tên và địa chỉ.');
      return;
    }

    setLoading(true);
    
    try {
      let finalImageUrl = existingLocation?.image_url || '';

      if (selectedImage) {
        if (!selectedImage.base64) {
          throw new Error("Không tìm thấy dữ liệu base64 của ảnh.");
        }

        setUploading(true);
        const fileExt = selectedImage.mimeType?.split('/')[1] || 'jpg';
        const filePath = `public/${Date.now()}.${fileExt}`;
        const contentType = selectedImage.mimeType ?? 'image/jpeg';

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('location-images')
          .upload(filePath, decode(selectedImage.base64), { contentType, upsert: false });

        setUploading(false);

        if (uploadError) throw uploadError;
        if (!uploadData?.path) throw new Error("Tải ảnh lên thất bại, không nhận được đường dẫn file.");

        const { data: urlData } = supabase.storage.from('location-images').getPublicUrl(uploadData.path);
        finalImageUrl = urlData.publicUrl;
      }

      const locationData = { 
        name, 
        address, 
        image_url: finalImageUrl, 
        opening_hours: openingHours, 
        google_maps_url: googleMapsUrl,
        ...(existingLocation && { id: existingLocation.id }) // Thêm id nếu là cập nhật
      };

      // Gọi Edge Function để xử lý việc lưu và geocoding
      const { error } = await supabase.functions.invoke('save-location', {
        body: locationData,
      });

      if (error) throw error;

      onSave();
      onClose();

    } catch (error: any) {
      console.error("Save location error:", error);
      // Hiển thị lỗi từ Edge Function nếu có
      const errorMessage = error.context?.error_message || error.message || 'Không thể lưu địa điểm.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{existingLocation ? 'Sửa địa điểm' : 'Thêm địa điểm'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={styles.label}>Tên địa điểm</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} />
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
            <Text style={styles.label}>Giờ mở cửa</Text>
            <TextInput style={styles.input} value={openingHours} onChangeText={setOpeningHours} />
            <Text style={styles.label}>URL Google Maps</Text>
            <TextInput style={styles.input} value={googleMapsUrl} onChangeText={setGoogleMapsUrl} />
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
  imagePicker: { width: '100%', height: 150, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginTop: 4, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center' },
  imagePlaceholderText: { marginTop: 8, color: '#6b7280' },
});

export default LocationForm;