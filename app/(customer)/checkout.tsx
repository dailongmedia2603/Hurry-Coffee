import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert } from 'react-native';
import { useCart } from '@/src/providers/CartProvider';
import { useAuth } from '@/src/providers/AuthProvider';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '@/src/integrations/supabase/client';
import ConfirmationModal from '@/src/components/ConfirmationModal';
import { getAnonymousId } from '@/src/utils/anonymousId';
import { ConfirmationDetails } from '@/types';
import CartListItem from '@/src/components/CartListItem';
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
                    customer_name: details.customer_name,
                    customer_phone: details.customer_phone,
                    notes: details.notes,
                    order_type: details.order_type,
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

    if (items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Stack.Screen options={{ title: 'Giỏ hàng' }} />
                <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống.</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Giỏ hàng' }} />
            <FlatList
                data={items}
                renderItem={({ item }) => <CartListItem item={item} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 10 }}
                ListFooterComponent={
                    <>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalText}>Tổng cộng</Text>
                            <Text style={styles.totalPrice}>{formatPrice(total)}</Text>
                        </View>
                        <Pressable style={styles.checkoutButton} onPress={() => setModalVisible(true)}>
                            <Text style={styles.checkoutButtonText}>Xác nhận đơn hàng</Text>
                        </Pressable>
                    </>
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
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 18, color: '#666' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
    totalText: { fontSize: 18, fontWeight: 'bold' },
    totalPrice: { fontSize: 18, fontWeight: 'bold', color: 'green' },
    checkoutButton: { backgroundColor: 'green', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    checkoutButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default CheckoutScreen;