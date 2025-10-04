import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const otpInputs = useRef<(TextInput | null)[]>([]);

  const formatPhoneNumber = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/^(?:\+84|0)/, '');
    return `+84${cleaned}`;
  };

  async function signInWithPhone() {
    if (!phone) {
      setErrorMessage("Vui lòng nhập số điện thoại của bạn.");
      return;
    }
    setLoading(true);
    setErrorMessage('');
    const formattedPhone = formatPhoneNumber(phone);
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (error) {
      console.error("Lỗi chi tiết khi gửi OTP:", JSON.stringify(error, null, 2));
      setErrorMessage("Có lỗi xảy ra khi gửi OTP. Vui lòng thử lại.");
    } else {
      setOtpSent(true);
    }
    setLoading(false);
  }

  async function verifyOtp() {
    if (!phone || otp.length !== 6) {
      setErrorMessage("Vui lòng nhập đủ 6 số của mã OTP.");
      return;
    }
    setLoading(true);
    setErrorMessage('');
    const formattedPhone = formatPhoneNumber(phone);
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });

    if (error) {
      console.error("Lỗi chi tiết khi xác thực OTP:", JSON.stringify(error, null, 2));
      setErrorMessage("Mã OTP không hợp lệ. Vui lòng thử lại.");
    }
    setLoading(false);
  }

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
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png' }}
        style={styles.logo}
      />
      <Text style={styles.title}>Đăng nhập</Text>
      <Text style={styles.subtitle}>Vui lòng đăng nhập để xem hồ sơ và các ưu đãi dành riêng cho bạn.</Text>
      
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

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
          <Text style={styles.otpPrompt}>Nhập mã OTP được gửi đến số điện thoại của bạn.</Text>
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
          <TouchableOpacity style={styles.button} onPress={verifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Xác nhận</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setOtpSent(false); setErrorMessage(''); setOtp(''); }}>
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
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
  },
  otpPrompt: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  otpInputFilled: {
    borderColor: '#73509c',
  },
});