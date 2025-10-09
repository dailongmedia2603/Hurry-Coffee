import { View, Text, StyleSheet, ActivityIndicator, FlatList, ScrollView, Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { supabase } from '@/src/integrations/supabase/client';
import { Order, OrderStatus, Product, Location } from '@/types';
import OrderStatusTracker from '@/src/components/OrderStatusTracker';
import OrderItemListItem from '@/src/components/OrderItemListItem';
import { formatPrice, formatDisplayPhone } from '@/src/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

const OrderDetailsScreen = () => {
    const { id } = useLocalSearchParams();
    const orderId = Array.isArray(id) ? id[0] : id;
    const router = useRouter();

    const [order, setOrder] = useState<Order | null>(null);
    const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId) return;

        const fetchOrder = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: orderError } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        order_items (
                            *,
                            products (*)
                        )
                    `)
                    .eq('id', orderId)
                    .single();

                if (orderError) throw orderError;
                setOrder(data as Order);

                if (data.order_type === 'pickup' && data.pickup_location_id) {
                    const { data: locationData, error: locationError } = await supabase
                        .from('locations')
                        .select('*')
                        .eq('id', data.pickup_location_id)
                        .single();
                    if (locationError) throw locationError;
                    setPickupLocation(locationData);
                }

            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();

        const subscription = supabase
            .channel(`orders:${orderId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
                (payload) => {
                    setOrder(prevOrder => ({ ...prevOrder, ...payload.new }) as Order);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };

    }, [orderId]);

    const handleCall = () => {
        if (order?.customer_phone) {
            Linking.openURL(`tel:${order.customer_phone}`);
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
    }
    if (error || !order) {
        return <Text style={styles.errorText}>Không tìm thấy đơn hàng hoặc đã có lỗi xảy ra.</Text>;
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: `Đơn hàng #${order.id.slice(0, 6)}` }} />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <OrderStatusTracker status={order.status as OrderStatus} orderType={order.order_type} />
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Thông tin đơn hàng</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={20} color="#555" />
                        <Text style={styles.infoText}>{order.customer_name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={20} color="#555" />
                        <Text style={styles.infoText}>{formatDisplayPhone(order.customer_phone || '')}</Text>
                        <Pressable onPress={handleCall} style={styles.callButton}>
                            <Text style={styles.callButtonText}>Gọi</Text>
                        </Pressable>
                    </View>
                    {order.order_type === 'delivery' && (
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={20} color="#555" />
                            <Text style={styles.infoText}>{order.delivery_address}</Text>
                        </View>
                    )}
                    {order.order_type === 'pickup' && pickupLocation && (
                         <View style={styles.infoRow}>
                            <Ionicons name="storefront-outline" size={20} color="#555" />
                            <Text style={styles.infoText}>Nhận tại: {pickupLocation.name}</Text>
                        </View>
                    )}
                     <View style={styles.infoRow}>
                        <Ionicons name="reader-outline" size={20} color="#555" />
                        <Text style={styles.infoText}>Ghi chú: {order.notes || 'Không có'}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Các món đã đặt</Text>
                    <FlatList
                        data={order.order_items}
                        renderItem={({ item }) => <OrderItemListItem item={item} />}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                    />
                    <View style={styles.totalRow}>
                        <Text style={styles.totalText}>Tổng cộng</Text>
                        <Text style={styles.totalPrice}>{formatPrice(order.total)}</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    scrollContainer: { padding: 15 },
    errorText: { flex: 1, textAlign: 'center', marginTop: 50, fontSize: 16 },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    infoText: { fontSize: 16, marginLeft: 10, flex: 1 },
    callButton: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 15 },
    callButtonText: { color: '#00C853', fontWeight: 'bold' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
    totalText: { fontSize: 18, fontWeight: 'bold' },
    totalPrice: { fontSize: 18, fontWeight: 'bold', color: '#00C853' },
});

export default OrderDetailsScreen;