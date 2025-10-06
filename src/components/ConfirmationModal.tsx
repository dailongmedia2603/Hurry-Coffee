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
import { Location, UserAddress } from '@/types';
import LocationPickerModal from './LocationPickerModal';
import AddressPickerModal from './AddressPickerModal';

type OrderType = 'delivery' | 'pickup';

export interface ConfirmationDetails {
  orderType: OrderType;
  address: string;
  locationId: string | null;
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
  
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [isAddressPickerVisible, setAddressPickerVisible] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(!!user);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLocationPickerVisible, setLocationPickerVisible] = useState(false);

  useEffect(() => {
    const fetchAddresses = async (userId: string) => {
      setAddressLoading(true);
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false }) // Ưu tiên địa chỉ mặc định
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user addresses:', error);
      } else if (data && data.length > 0) {
        setUserAddresses(data);
        setSelectedAddress(data[0]); // Tự động chọn địa chỉ đầu tiên (mặc định)
      } else {
        setUserAddresses([]);
        setSelectedAddress(null);
      }
      setAddressLoading(false);
    };

    if (visible) {
      if (user) {
        const userPhone = user.phone ? user.phone.replace(/^\+84/, '0') : '';
        setPhone(userPhone);
        setIsPhoneVerified(true);
        fetchAddresses(user.id);
      } else {
        setName('');
        setPhone('');
        setIsPhoneVerified(false);
        setUserAddresses([]);
        setSelectedAddress(null);
      }
      setCustomAddress('');
    }
  }, [user, profile, visible]);

  useEffect(() => {
    if (selectedAddress) {
      setName(selectedAddress.name);
    } else if (userAddresses.length === 0 && user) {
      setName(profile?.full_name || '');
    }
  }, [selectedAddress, userAddresses, profile, user]);

  const handleConfirm = () => {
    const isDelivery = orderType === 'delivery';
    const finalAddress = selectedAddress ? selectedAddress.address : customAddress;

    if (!name || !phone || (isDelivery && !finalAddress) || (!isDelivery && !selectedLocation)) {
        Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin.');
        return;
    }
    
    onConfirm({
      orderType,
      address: isDelivery ? finalAddress : selectedLocation!.name,
      locationId: isDelivery ? null : selectedLocation!.id,
      name,
      phone,
      isPhoneVerified,
    });
  };

  const renderDeliveryAddressInput = () => {
    if (addressLoading) {
      return (
        <View style={styles.addressButton}>
          <ActivityIndicator color="#73509c" />
        </View>
      );
    }

    if (userAddresses.length > 0) {
      return (
        <TouchableOpacity style={styles.addressButton} onPress={() => setAddressPickerVisible(true)}>
          <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressNameText} numberOfLines={1}>{selectedAddress?.name}</Text>
            <Text style={styles.addressDetailText} numberOfLines={1}>
              {selectedAddress ? selectedAddress.address : 'Chọn một địa chỉ'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.addressButton}>
        <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput 
          style={styles.input}
          placeholder='Nhập địa chỉ của bạn'
          value={customAddress}
          onChangeText={setCustomAddress}
        />
      </View>
    );
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
            {orderType === 'delivery' ? (
                renderDeliveryAddressInput()
            ) : (
                <TouchableOpacity style={styles.addressButton} onPress={() => setLocationPickerVisible(true)}>
                    <Ionicons name="storefront-outline" size={20} color="#666" style={styles.inputIcon} />
                    <Text style={[styles.input, !selectedLocation && styles.placeholderText]}>
                        {selectedLocation ? selectedLocation.name : 'Chọn một cửa hàng'}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
            )}

            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Tên người nhận" value={name} onChangeText={setName} />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Số điện thoại" keyboardType="phone-pad" value={phone} onChangeText={setPhone} editable={!user} />
            </View>

            {isPhoneVerified && (
                <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#00C853" />
                    <Text style={styles.verifiedText}>Số điện thoại đã được xác thực</Text>
                </View>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Hoàn tất đặt hàng</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <LocationPickerModal
        visible={isLocationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onSelect={(location) => {
          setSelectedLocation(location);
        }}
      />
      <AddressPickerModal
        visible={isAddressPickerVisible}
        onClose={() => setAddressPickerVisible(false)}
        addresses={userAddresses}
        onSelect={(address) => {
          setSelectedAddress(address);
          setAddressPickerVisible(false);
        }}
      />
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
  addressButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 15, minHeight: 50, paddingVertical: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 15, height: 50, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  placeholderText: { color: '#999' },
  otpButton: { backgroundColor: '#E8E4F2', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  otpButtonText: { color: '#73509c', fontSize: 14, fontWeight: 'bold' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 10, borderRadius: 8, marginTop: 8 },
  verifiedText: { color: '#00C853', marginLeft: 8, fontWeight: '500' },
  confirmButton: { backgroundColor: '#73509c', padding: 16, borderRadius: 30, alignItems: 'center', marginTop: 20 },
  confirmButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  addressNameText: { fontSize: 16, fontWeight: '500', color: '#333' },
  addressDetailText: { fontSize: 14, color: '#666' },
});

export default ConfirmationModal;