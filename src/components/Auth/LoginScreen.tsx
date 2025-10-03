import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); // This is the OTP code
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  async function signInWithPhone() {
    if (!phone) {
        Alert.alert("Vui lòng nhập số điện thoại của bạn.");
        return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+84${phone.replace(/^0+/, '')}`, // Vietnamese phone numbers
    });

    if (error) {
      Alert.alert('Lỗi', error.message);
    } else {
      setOtpSent(true);
      Alert.alert('Thành công', 'Mã OTP đã được gửi đến số điện thoại của bạn.');
    }
    setLoading(false);
  }

  async function verifyOtp() {
    if (!phone || !password) {
        Alert.alert("Vui lòng nhập đầy đủ thông tin.");
        return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: `+84${phone.replace(/^0+/, '')}`,
      token: password,
      type: 'sms',
    });

    if (error) {
      Alert.alert('Lỗi', error.message);
    }
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
              value={password}
              onChangeText={setPassword}
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