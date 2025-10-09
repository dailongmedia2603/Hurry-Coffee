import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { formatPrice, formatDisplayPhone } from '@/src/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Location, UserAddress, ConfirmationDetails } from '@/types';
import LocationPickerModal from './LocationPickerModal';
import AddressPickerModal from './AddressPickerModal';

type ConfirmationModalProps = {
    visible: boolean;
    onClose: () => void;
    onConfirm: (details: ConfirmationDetails) => void;
    loading: boolean;
    total: number;
};

const ConfirmationModal = ({ visible, onClose, onConfirm, loading, total }: ConfirmationModalProps) => {
    const { user } = useAuth();
    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);

    const [deliveryAddress, setDeliveryAddress] = useState<UserAddress | null>(null);
    const [isAddressPickerVisible, setAddressPickerVisible] = useState(false);

    const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
    const [isLocationPickerVisible, setLocationPickerVisible] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.full_name || '');
            setPhone(formatDisplayPhone(user.phone || ''));
            
            supabase.from('user_addresses').select('*').eq('user_id', user.id).then(({ data }) => {
                if (data) {
                    setUserAddresses(data);
                    const defaultAddress = data.find(addr => addr.is_default);
                    if (defaultAddress) setDeliveryAddress(defaultAddress);
                }
            });
        }
    }, [user, visible]);

    const handleConfirm = () => {
        if (!validateOrder()) return;
        onConfirm({
            customer_name: name,
            customer_phone: phone.replace(/\s/g, ''),
            notes,
            order_type: orderType,
            delivery_address: deliveryAddress,
            pickup_location: pickupLocation,
        });
    };

    const validateOrder = () => {
        // Basic validation
        return true;
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <SafeAreaView style={styles.container}>
                    <Text style={styles.title}>Xác nhận đơn hàng</Text>
                    <TextInput style={styles.input} placeholder="Tên của bạn" value={name} onChangeText={setName} />
                    <TextInput style={styles.input} placeholder="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                    <View style={styles.orderTypeSelector}>
                        <Pressable style={[styles.orderTypeButton, orderType === 'delivery' && styles.activeButton]} onPress={() => setOrderType('delivery')}>
                            <Text style={[styles.orderTypeButtonText, orderType === 'delivery' && styles.activeButtonText]}>Giao hàng</Text>
                        </Pressable>
                        <Pressable style={[styles.orderTypeButton, orderType === 'pickup' && styles.activeButton]} onPress={() => setOrderType('pickup')}>
                            <Text style={[styles.orderTypeButtonText, orderType === 'pickup' && styles.activeButtonText]}>Lấy tại cửa hàng</Text>
                        </Pressable>
                    </View>
                    {orderType === 'delivery' ? (
                        <Pressable style={styles.pickerButton} onPress={() => setAddressPickerVisible(true)}>
                            <Text>{deliveryAddress ? deliveryAddress.address : 'Chọn địa chỉ giao hàng'}</Text>
                        </Pressable>
                    ) : (
                        <Pressable style={styles.pickerButton} onPress={() => setLocationPickerVisible(true)}>
                            <Text>{pickupLocation ? pickupLocation.name : 'Chọn cửa hàng'}</Text>
                        </Pressable>
                    )}
                    <TextInput style={[styles.input, styles.notesInput]} placeholder="Ghi chú..." value={notes} onChangeText={setNotes} multiline />
                    <View style={styles.summary}>
                        <Text>Tổng cộng:</Text>
                        <Text style={styles.totalPrice}>{formatPrice(total)}</Text>
                    </View>
                    <Pressable style={styles.confirmButton} onPress={handleConfirm} disabled={loading}>
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.confirmButtonText}>Đặt hàng</Text>}
                    </Pressable>
                    <Pressable style={styles.closeButton} onPress={onClose}><Text>Đóng</Text></Pressable>
                </SafeAreaView>
            </KeyboardAvoidingView>
            <LocationPickerModal visible={isLocationPickerVisible} onClose={() => setLocationPickerVisible(false)} onSelect={setPickupLocation} />
            <AddressPickerModal visible={isAddressPickerVisible} onClose={() => setAddressPickerVisible(false)} onSelect={setDeliveryAddress} addresses={userAddresses} />
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
    input: { backgroundColor: 'white', padding: 10, borderRadius: 5, marginVertical: 5 },
    notesInput: { height: 80 },
    orderTypeSelector: { flexDirection: 'row', marginVertical: 10 },
    orderTypeButton: { flex: 1, padding: 10, borderWidth: 1, borderColor: 'gray', borderRadius: 5, alignItems: 'center', marginHorizontal: 5 },
    activeButton: { backgroundColor: 'blue' },
    orderTypeButtonText: { color: 'black' },
    activeButtonText: { color: 'white' },
    pickerButton: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginVertical: 5 },
    summary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTopWidth: 1, borderColor: '#eee' },
    totalPrice: { fontWeight: 'bold' },
    confirmButton: { backgroundColor: 'green', padding: 15, borderRadius: 5, alignItems: 'center', marginVertical: 10 },
    confirmButtonText: { color: 'white', fontWeight: 'bold' },
    closeButton: { alignItems: 'center' },
});

export default ConfirmationModal;