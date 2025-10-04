import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const formatPhoneNumber = (phoneNumber: string) => {
    // Xóa mọi ký tự không phải là số, sau đó xử lý
    // 1. Xóa mã quốc gia +84 hoặc số 0 ở đầu nếu có
    const cleaned = phoneNumber.replace(/^(?:\+84|0)/, '');
    // 2. Trả về số điện thoại với định dạng +84...
    return `+84${cleaned}`;
  };

  async function signInWithPhone() {
    if (!phone) {
      Alert.alert("Vui lòng nhập số điện thoại của bạn.");
      return;
    }
    setLoading(true);
    const formattedPhone = formatPhoneNumber(phone);
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (error) {
      console.error("Lỗi chi tiết khi gửi OTP:", JSON.stringify(error, null, 2));
      Alert.alert('Lỗi gửi OTP', error.message);
    } else {
      setOtpSent(true);
      Alert.alert('Thành công', 'Mã OTP đã được gửi đến số điện thoại của bạn.');
    }
    setLoading(false);
  }

  async function verifyOtp() {
    if (!phone || !otp) {
      Alert.alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    setLoading(true);
    const formattedPhone = formatPhoneNumber(phone);
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });

    if (error) {
      console.error("Lỗi chi tiết khi xác thực OTP:", JSON.stringify(error, null, 2));
      Alert.alert('Lỗi xác thực', error.message);
    }
    // Không cần làm gì thêm, listener onAuthStateChange trong AuthContext sẽ xử lý việc cập nhật session.
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png' }}
        style={styles.logo}
      />
      <Text style={styles.title}>Đăng nhập</Text>
      <Text style={styles.subtitle}>Vui lòng đăng nhập để xem hồ sơ và các ưu đãi dành riêng cho bạn.</Text>
      
      {!otpSent ? (
        <>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
          <TouchableOpacity style={styles.button} onPress={signInWithPhone} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Gửi mã OTP</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.inputContainer}>
            <Ionicons name="keypad-outline" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mã OTP"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
            />
          </View>
          <TouchableOpacity style={styles.button} onPress={verifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Xác nhận</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setOtpSent(false)}>
            <Text style={styles.linkText}>Nhập lại số điện thoại</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    width: '100%',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#73509c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#73509c',
    marginTop: 20,
  },
});