import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';

interface StaffProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  location_name: string | null;
}

type StaffFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  staffMember: StaffProfile | null;
};

const StaffFormModal = ({ visible, onClose, onSave, staffMember }: StaffFormModalProps) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [loading, setLoading] = useState(false);
  const isEditing = !!staffMember;

  useEffect(() => {
    if (visible) {
      if (isEditing) {
        setFullName(staffMember.full_name || '');
        setEmail(staffMember.email || '');
        setRole(staffMember.role === 'admin' ? 'admin' : 'staff');
        setPassword('');
      } else {
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('staff');
      }
    }
  }, [staffMember, visible]);

  const handleSave = async () => {
    if (!isEditing && (!email || !password || !fullName)) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ tên, email và mật khẩu.');
      return;
    }
    if (isEditing && !fullName) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên.');
      return;
    }
    if (password && password.length < 6) {
      Alert.alert('Mật khẩu yếu', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      let error;
      if (isEditing) {
        const { error: updateError } = await supabase.functions.invoke('update-staff-user', {
          body: {
            user_id: staffMember.id,
            full_name: fullName,
            password: password || undefined,
            role: role,
          },
        });
        error = updateError;
      } else {
        const { error: createError } = await supabase.functions.invoke('create-staff-user', {
          body: { email, password, full_name: fullName, role: role },
        });
        error = createError;
      }

      if (error) throw new Error(error.message);

      Alert.alert('Thành công', `Tài khoản đã được ${isEditing ? 'cập nhật' : 'tạo'} thành công.`);
      onSave();
      onClose();
    } catch (error: any) {
      console.error("Error saving staff user:", error);
      Alert.alert('Lỗi', error.message || 'Không thể lưu tài khoản. Vui lòng thử lại.');
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
            <Text style={styles.headerTitle}>{isEditing ? 'Sửa thông tin' : 'Thêm nhân viên mới'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
          </View>
          <View>
            <Text style={styles.label}>Tên</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
            <Text style={styles.label}>Email</Text>
            <TextInput style={[styles.input, isEditing && styles.disabledInput]} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!isEditing} />
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder={isEditing ? "Để trống nếu không đổi" : "Ít nhất 6 ký tự"} />
            <Text style={styles.label}>Quyền</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'staff' && styles.roleButtonActive]}
                onPress={() => setRole('staff')}
              >
                <Text style={[styles.roleButtonText, role === 'staff' && styles.roleButtonTextActive]}>Nhân viên</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'admin' && styles.roleButtonActive]}
                onPress={() => setRole('admin')}
              >
                <Text style={[styles.roleButtonText, role === 'admin' && styles.roleButtonTextActive]}>Admin</Text>
              </TouchableOpacity>
            </View>
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
  disabledInput: { backgroundColor: '#e5e7eb', color: '#6b7280' },
  saveButton: { backgroundColor: '#73509c', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  roleSelector: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 4 },
  roleButton: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  roleButtonActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  roleButtonText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  roleButtonTextActive: { color: '#73509c' },
});

export default StaffFormModal;