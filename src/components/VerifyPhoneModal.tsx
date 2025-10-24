import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';

type VerifyPhoneModalProps = {
  visible: boolean;
  phone: string;
  onClose: () => void;
};

const VerifyPhoneModal = ({ visible, phone, onClose }: VerifyPhoneModalProps) => {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const otpInputs = useRef<(TextInput | null)[]>([]);

  // Reset state when modal is closed/opened
  useEffect(() => {
    if (!visible) {
      setOtpSent(false);
      setOtp('');
      setLoading(false);
      setErrorMessage('');
    }
  }, [visible]);

  const formatPhoneNumber = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/^(?:\+84|0)/, '');
    return `+84${cleaned}`;
  };

  const handleSendOtp = async () => {
    if (!phone) {
      setErrorMessage("Không có số điện thoại để xác minh.");
      return;
    }
    setLoading(true);
    setErrorMessage('');
    const formattedPhone = formatPhoneNumber(phone);
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });

    if (error) {
      console.error("Lỗi gửi OTP:", error);
      setErrorMessage("Có lỗi xảy ra khi gửi OTP. Vui lòng thử lại.");
    } else {
      setOtpSent(true);
    }
    setLoading(false);
  };

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6 || loading) return;
    
    setLoading(true);
    setErrorMessage('');
    const formattedPhone = formatPhoneNumber(phone);
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });

    if (error) {
      console.error("Lỗi xác thực OTP:", error);
      setErrorMessage("Mã OTP không hợp lệ. Vui lòng thử lại.");
      setLoading(false);
    } else {
      onClose();
    }
  }, [otp, phone, loading, onClose]);

  useEffect(() => {
    if (otp.length === 6) {
      handleVerifyOtp();
    }
  }, [otp, handleVerifyOtp]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = otp.split('');
    newOtp[index] = text;
    setOtp(newOtp.join(''));
    if (text && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent: { key } }: any, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          {!otpSent ? (
            <>
              <Ionicons name="checkmark-circle-outline" size={48} color="#00C853" style={styles.icon} />
              <Text style={styles.title}>Đặt đơn thành công!</Text>
              <Text style={styles.message}>Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý đơn hàng của bạn ngay.</Text>
              
              <View style={styles.separator} />

              <Text style={styles.subTitle}>Xác minh số điện thoại</Text>
              <Text style={styles.message}>Xác minh ngay để quản lý đơn hàng và nhận các ưu đãi hấp dẫn nhé!</Text>
              <TouchableOpacity style={styles.actionButton} onPress={handleSendOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Xác minh ngay</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Ionicons name="shield-checkmark-outline" size={48} color="#73509c" style={styles.icon} />
              <Text style={styles.title}>Xác minh số điện thoại</Text>
              <Text style={styles.message}>Nhập mã OTP được gửi đến số {phone}.</Text>
              <View style={styles.otpContainer}>
                {[...Array(6)].map((_, index) => (
                  <TextInput
                    key={index}
                    ref={(el) => { otpInputs.current[index] = el; }}
                    style={[styles.otpInput, otp[index] ? styles.otpInputFilled : null]}
                    keyboardType="number-pad"
                    maxLength={1}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    value={otp[index] || ''}
                  />
                ))}
              </View>
              {loading && <ActivityIndicator color="#73509c" style={{ marginTop: 10 }} />}
            </>
          )}
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { width: '90%', maxWidth: 340, backgroundColor: 'white', borderRadius: 24, padding: 24, alignItems: 'center' },
  closeButton: { position: 'absolute', top: 16, right: 16 },
  icon: { marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4, textAlign: 'center' },
  message: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  separator: { height: 1, backgroundColor: '#e5e7eb', width: '100%', marginVertical: 20 },
  actionButton: { backgroundColor: '#73509c', paddingVertical: 14, borderRadius: 12, alignItems: 'center', width: '100%' },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  otpInput: { width: 48, height: 56, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, textAlign: 'center', fontSize: 22, fontWeight: 'bold', color: '#333' },
  otpInputFilled: { borderColor: '#73509c' },
  errorText: { color: 'red', marginTop: 12, textAlign: 'center' },
});

export default VerifyPhoneModal;