import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { UserAddress } from '@/types';

type AddressModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  address: UserAddress | null;
};

const AddressModal = ({ visible, onClose, onSave, address: existingAddress }: AddressModalProps) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingAddress) {
      setName(existingAddress.name);
      setAddress(existingAddress.address);
    } else {
      setName('');
      setAddress('');
    }
  }, [existingAddress, visible]);

  const handleSave = async () => {
    if (!name || !address) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ tên và địa chỉ.');
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        Alert.alert('Lỗi', 'Bạn cần đăng nhập để thực hiện việc này.');
        setLoading(false);
        return;
    }

    const addressData = {
      user_id: user.id,
      name,
      address,
    };

    let error;
    if (existingAddress) {
      // Update
      const { error: updateError } = await supabase
        .from('user_addresses')
        .update(addressData)
        .eq('id', existingAddress.id);
      error = updateError;
    } else {
      // Insert and then set as default
      const { data: newAddress, error: insertError } = await supabase
        .from('user_addresses')
        .insert(addressData)
        .select()
        .single();
      
      error = insertError;

      if (!error && newAddress) {
        // Set the newly created address as default
        const { error: rpcError } = await supabase.rpc('set_default_address', {
          p_user_id: user.id,
          p_address_id: newAddress.id,
        });

        if (rpcError) {
          // Log the error but don't block the user flow
          console.error("Failed to set new address as default:", rpcError);
        }
      }
    }

    setLoading(false);

    if (error) {
      console.error('Error saving address:', error);
      Alert.alert('Lỗi', 'Không thể lưu địa chỉ. Vui lòng thử lại.');
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{existingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View>
            <Text style={styles.label}>Tên người nhận</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên của bạn"
              value={name}
              onChangeText={setName}
            />
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập địa chỉ chi tiết"
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Lưu địa chỉ</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 15, fontSize: 16 },
  saveButton: { backgroundColor: '#73509c', padding: 16, borderRadius: 30, alignItems: 'center', marginTop: 24 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default AddressModal;