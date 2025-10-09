import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert } from 'react-native';
import { useCart } from '@/src/providers/CartProvider';
import { useAuth } from '@/src/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/integrations/supabase/client';
import ConfirmationModal from '@/src/components/ConfirmationModal';
import { getAnonymousId } from '@/src/utils/anonymousId';
import { ConfirmationDetails } from '@/types';
import OrderItemListItem from '@/src/components/OrderItemListItem';
import { formatPrice } from '@/src/utils/formatters';

const CheckoutScreen = () => {
    const { items, total, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const handlePlaceOrder = async (details: ConfirmationDetails) => {
        setLoading(true);
        try {
            const anonymousId = user ? null : await getAnonymousId();
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user?.id,
                    anonymous_device_id: anonymousId,
                    total,
                    status: 'Đang xử lý',
                    ...details,
                    delivery_address: details.delivery_address?.address,
                    pickup_location_id: details.pickup_location?.id,
                })
                .select()
                .single();

            if (orderError) throw orderError;

            const orderItems = items.map(item => ({
                order_id: orderData.id,
                product_id: item.product.id,
                quantity: item.quantity,
                price: item.product.price,
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            clearCart();
            setModalVisible(false);
            router.push(`/order/${orderData.id}`);

        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể đặt hàng.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={items}
                renderItem={({ item }) => <OrderItemListItem item={item} />}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={<Text style={styles.title}>Giỏ hàng của bạn</Text>}
                ListFooterComponent={
                    <View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalText}>Tổng cộng</Text>
                            <Text style={styles.totalPrice}>{formatPrice(total)}</Text>
                        </View>
                        <Pressable style={styles.checkoutButton} onPress={() => setModalVisible(true)}>
                            <Text style={styles.checkoutButtonText}>Xác nhận đơn hàng</Text>
                        </Pressable>
                    </View>
                }
            />
            <ConfirmationModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onConfirm={handlePlaceOrder}
                loading={loading}
                total={total}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    title: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#eee' },
    totalText: { fontSize: 18, fontWeight: 'bold' },
    totalPrice: { fontSize: 18, fontWeight: 'bold', color: 'green' },
    checkoutButton: { backgroundColor: 'green', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 20 },
    checkoutButtonText: { color: 'white', fontWeight: 'bold' },
});

export default CheckoutScreen;