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
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/integrations/supabase/client';

type OrderType = 'delivery' | 'pickup';

export interface ConfirmationDetails {
  orderType: OrderType;
  address: string;
  name: string;
  phone: string;
  isPhoneVerified: boolean;
}

type ConfirmationModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (details: ConfirmationDetails) => void;
  loading: boolean;
};

const ConfirmationModal = ({ visible, onClose, onConfirm, loading }: ConfirmationModalProps) => {
  const { user, profile } = useAuth();
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(profile?.full_name || '');
      setPhone(user.phone || '');
    }
  }, [user, profile, visible]);

  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại.');
      return;
    }
    setOtpLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+84${phone.replace(/^0+/, '')}`,
    });
    setOtpLoading(false);
    if (error) {
      Alert.alert('Lỗi gửi OTP', error.message);
    } else {
      setIsOtpSent(true);
      Alert.alert('Thành công', 'Mã OTP đã được gửi đến số điện thoại của bạn.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã OTP.');
      return;
    }
    setOtpLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: `+84${phone.replace(/^0+/, '')}`,
      token: otp,
      type: 'sms',
    });
    setOtpLoading(false);
    if (error) {
      Alert.alert('Lỗi xác thực', error.message);
    } else {
      setIsPhoneVerified(true);
      Alert.alert('Thành công', 'Số điện thoại đã được xác thực.');
    }
  };

  const handleConfirm = () => {
    if (!name || !phone || !address) {
        Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin.');
        return;
    }
    onConfirm({
      orderType,
      address,
      name,
      phone,
      isPhoneVerified,
    });
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
            <Text style={styles.headerTitle}>Xác nhận đơn hàng</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Hình thức nhận hàng</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, orderType === 'delivery' && styles.toggleButtonActive]}
                onPress={() => setOrderType('delivery')}
              >
                <Ionicons name="bicycle-outline" size={20} color={orderType === 'delivery' ? '#fff' : '#73509c'} />
                <Text style={[styles.toggleButtonText, orderType === 'delivery' && styles.toggleButtonTextActive]}>Giao đến</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, orderType === 'pickup' && styles.toggleButtonActive]}
                onPress={() => setOrderType('pickup')}
              >
                <Ionicons name="bag-handle-outline" size={20} color={orderType === 'pickup' ? '#fff' : '#73509c'} />
                <Text style={[styles.toggleButtonText, orderType === 'pickup' && styles.toggleButtonTextActive]}>Ghé lấy</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>
              {orderType === 'delivery' ? 'Địa chỉ giao hàng' : 'Chọn điểm ghé lấy'}
            </Text>
            <View style={styles.addressButton}>
                <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput 
                    style={styles.input}
                    placeholder={orderType === 'delivery' ? 'Nhập địa chỉ của bạn' : 'Chọn một cửa hàng'}
                    value={address}
                    onChangeText={setAddress}
                />
                <TouchableOpacity>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Tên người nhận" value={name} onChangeText={setName} />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Số điện thoại" keyboardType="phone-pad" value={phone} onChangeText={setPhone} editable={!isPhoneVerified} />
            </View>

            {isPhoneVerified ? (
                <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#00C853" />
                    <Text style={styles.verifiedText}>Số điện thoại đã được xác thực</Text>
                </View>
            ) : !isOtpSent ? (
              <TouchableOpacity style={styles.otpButton} onPress={handleSendOtp} disabled={otpLoading}>
                {otpLoading ? <ActivityIndicator color="#73509c" /> : <Text style={styles.otpButtonText}>Gửi mã OTP xác thực</Text>}
              </TouchableOpacity>
            ) : (
              <View>
                <View style={styles.inputContainer}>
                  <Ionicons name="keypad-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Nhập mã OTP" keyboardType="number-pad" value={otp} onChangeText={setOtp} />
                </View>
                <TouchableOpacity style={styles.otpButton} onPress={handleVerifyOtp} disabled={otpLoading}>
                  {otpLoading ? <ActivityIndicator color="#73509c" /> : <Text style={styles.otpButtonText}>Xác thực OTP</Text>}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Hoàn tất đặt hàng</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%', paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingVertical: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 12 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 30, padding: 4 },
  toggleButton: { flex: 1, flexDirection: 'row', paddingVertical: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 26 },
  toggleButtonActive: { backgroundColor: '#73509c' },
  toggleButtonText: { fontSize: 14, fontWeight: '600', color: '#73509c', marginLeft: 8 },
  toggleButtonTextActive: { color: '#fff' },
  addressButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 15, height: 50 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 15, height: 50, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  otpButton: { backgroundColor: '#E8E4F2', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  otpButtonText: { color: '#73509c', fontSize: 14, fontWeight: 'bold' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 10, borderRadius: 8, marginTop: 8 },
  verifiedText: { color: '#00C853', marginLeft: 8, fontWeight: '500' },
  confirmButton: { backgroundColor: '#73509c', padding: 16, borderRadius: 30, alignItems: 'center', marginTop: 20 },
  confirmButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default ConfirmationModal;