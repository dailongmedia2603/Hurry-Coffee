import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Order, OrderStatus, Product, Location } from '@/types';
import OrderStatusTracker from '@/src/components/OrderStatusTracker';

type OrderItemWithProduct = {
  quantity: number;
  price: number;
  products: Product | null;
};

type OrderDetails = Omit<Order, 'items_count' | 'restaurant_name' | 'restaurant_image_url'> & {
  order_items: OrderItemWithProduct[];
  delivery_address: string | null;
  customer_name: string | null;
  notes: string | null;
  locations: Location | null;
  order_type: 'delivery' | 'pickup';
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const InfoRow = ({ label, value, valueStyle }: { label: string, value: string, valueStyle?: object }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
  </View>
);

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchOrderDetails = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        quantity,
                        price,
                        products (*)
                    ),
                    locations (*)
                `)
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching order details:', error);
            } else {
                setOrder(data as any);
            }
            setLoading(false);
        };

        fetchOrderDetails();
    }, [id]);

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#73509c" />
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text>Không tìm thấy đơn hàng.</Text>
            </SafeAreaView>
        );
    }

    const subtotal = order.order_items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = order.total - subtotal;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết đơn hàng</Text>
                <View style={{ width: 24 }} /> 
            </View>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <OrderStatusTracker status={order.status} />

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Tóm tắt đơn hàng</Text>
                    {order.order_items.map((item, index) => (
                        <View key={index} style={styles.itemContainer}>
                            <Image 
                                source={{ uri: item.products?.image_url || 'https://via.placeholder.com/100' }} 
                                style={styles.itemImage} 
                            />
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName}>{item.quantity}x {item.products?.name}</Text>
                            </View>
                            <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Chi phí</Text>
                    <InfoRow label="Tạm tính" value={formatPrice(subtotal)} />
                    <InfoRow label="Phí giao hàng" value={formatPrice(deliveryFee)} />
                    <View style={styles.separator} />
                    <InfoRow label="Tổng cộng" value={formatPrice(order.total)} valueStyle={styles.totalPrice} />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Thông tin giao hàng</Text>
                    <View style={styles.addressContainer}>
                        <Ionicons name="storefront-outline" size={24} color="#73509c" />
                        <View style={styles.addressTextContainer}>
                            <Text style={styles.addressLabel}>Nhà hàng</Text>
                            <Text style={styles.addressValue}>Nhà hàng Hurry Coffee</Text>
                        </View>
                    </View>
                    <View style={styles.addressSeparator} />
                    <View style={styles.addressContainer}>
                        <Ionicons name={order.order_type === 'delivery' ? "home-outline" : "bag-handle-outline"} size={24} color="#73509c" />
                        <View style={styles.addressTextContainer}>
                            <Text style={styles.addressLabel}>{order.order_type === 'delivery' ? 'Giao đến' : 'Nhận tại'}</Text>
                            <Text style={styles.addressValue}>
                                {order.order_type === 'delivery' ? order.delivery_address : order.locations?.name}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Chi tiết đơn hàng</Text>
                    <InfoRow label="Mã đơn hàng" value={`#${order.id.substring(0, 8)}`} />
                    <InfoRow label="Thời gian đặt" value={new Date(order.created_at).toLocaleString('vi-VN')} />
                    <InfoRow label="Ghi chú" value={order.notes || 'Không có'} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center', marginHorizontal: 8 },
    scrollContainer: { paddingBottom: 40, backgroundColor: '#FAFAFA' },
    card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginHorizontal: 16, marginTop: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    itemContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    itemImage: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
    itemDetails: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: '500' },
    itemPrice: { fontSize: 16, fontWeight: 'bold' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    infoLabel: { fontSize: 16, color: '#666' },
    infoValue: { fontSize: 16, color: '#333', fontWeight: '500' },
    separator: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 8 },
    totalPrice: { fontWeight: 'bold', fontSize: 18, color: '#73509c' },
    addressContainer: { flexDirection: 'row', alignItems: 'center' },
    addressTextContainer: { marginLeft: 12, flex: 1 },
    addressLabel: { fontSize: 14, color: '#666' },
    addressValue: { fontSize: 16, fontWeight: '500', color: '#333' },
    addressSeparator: { height: 20, width: 1, backgroundColor: '#E0E0E0', marginLeft: 12, marginVertical: 8 },
});