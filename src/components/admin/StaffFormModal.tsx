import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';

type StaffFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
};

const StaffFormModal = ({ visible, onClose, onSave }: StaffFormModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!email || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Mật khẩu yếu', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('create-staff-user', {
        body: { email, password },
      });

      if (error) {
        throw new Error(error.message);
      }

      Alert.alert('Thành công', 'Tài khoản nhân viên đã được tạo.');
      onSave();
      onClose();
    } catch (error: any) {
      console.error("Error creating staff user:", error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo tài khoản. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Thêm nhân viên mới</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
          </View>
          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Ít nhất 6 ký tự" />
          </View>
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
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, fontSize: 16 },
  saveButton: { backgroundColor: '#73509c', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default StaffFormModal;