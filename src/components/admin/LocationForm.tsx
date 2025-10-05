import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [distance, setDistance] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingLocation) {
      setName(existingLocation.name);
      setAddress(existingLocation.address);
      setImageUrl(existingLocation.image_url || '');
      setOpeningHours(existingLocation.opening_hours || '');
      setDistance(existingLocation.distance || '');
      setGoogleMapsUrl(existingLocation.google_maps_url || '');
    } else {
      setName('');
      setAddress('');
      setImageUrl('');
      setOpeningHours('');
      setDistance('');
      setGoogleMapsUrl('');
    }
  }, [existingLocation, visible]);

  const handleSave = async () => {
    if (!name || !address) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền tên và địa chỉ.');
      return;
    }

    setLoading(true);
    const locationData = { name, address, image_url: imageUrl, opening_hours: openingHours, distance, google_maps_url: googleMapsUrl };

    const { error } = existingLocation
      ? await supabase.from('locations').update(locationData).eq('id', existingLocation.id)
      : await supabase.from('locations').insert(locationData);

    setLoading(false);

    if (error) {
      Alert.alert('Lỗi', 'Không thể lưu địa điểm.');
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
            <Text style={styles.headerTitle}>{existingLocation ? 'Sửa địa điểm' : 'Thêm địa điểm'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={styles.label}>Tên địa điểm</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} />
            <Text style={styles.label}>URL Hình ảnh</Text>
            <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} />
            <Text style={styles.label}>Giờ mở cửa</Text>
            <TextInput style={styles.input} value={openingHours} onChangeText={setOpeningHours} />
            <Text style={styles.label}>Khoảng cách</Text>
            <TextInput style={styles.input} value={distance} onChangeText={setDistance} />
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
});

export default LocationForm;