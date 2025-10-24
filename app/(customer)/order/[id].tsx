import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Order, OrderStatus, Product, Location, Topping } from '@/types';
import OrderStatusTracker from '@/src/components/OrderStatusTracker';
import { getAnonymousId } from '@/src/utils/anonymousId';
import ConfirmModal from '@/src/components/ConfirmModal';

type OrderItemWithProduct = {
  quantity: number;
  price: number;
  size: string | null;
  toppings: Topping[] | null;
  options: string[] | null;
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
    const [isCancelling, setIsCancelling] = useState(false);
    const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);

    const fetchOrderDetails = useCallback(async (isInitialLoad = false) => {
        if (!id) return;
        if (isInitialLoad) setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`*, order_items (quantity, price, size, toppings, options, products (*)), locations (*)`)
                .eq('id', id)
                .single();
            if (error) throw error;
            setOrder(data as any);
        } catch (error) {
            console.error('Error fetching order details:', error);
            setOrder(null);
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchOrderDetails(true);

        const channel = supabase
            .channel(`customer-order-${id}`)
            .on<OrderDetails>(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
                (payload) => {
                    // Khi có cập nhật, tải lại toàn bộ chi tiết đơn hàng
                    // để đảm bảo dữ liệu (bao gồm cả join) là mới nhất.
                    fetchOrderDetails(false);
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [id, fetchOrderDetails]);

    const handleCancelOrder = () => {
        setConfirmModalVisible(true);
    };

    const confirmCancellation = async () => {
        setConfirmModalVisible(false);
        setIsCancelling(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const body: { order_id: string, anonymous_device_id?: string } = { order_id: id! };

            if (!user) {
                body.anonymous_device_id = await getAnonymousId();
            }

            const { error } = await supabase.functions.invoke('cancel-order', { body });

            if (error) {
                throw new Error(error.message);
            }

            Alert.alert("Thành công", "Đơn hàng của bạn đã được hủy.");
            setOrder(prevOrder => prevOrder ? { ...prevOrder, status: 'Đã hủy' } : null);

        } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể hủy đơn hàng. Vui lòng thử lại.");
        } finally {
            setIsCancelling(false);
        }
    };

    if (loading) {
        return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" color="#73509c" /></SafeAreaView>;
    }

    if (!order) {
        return <SafeAreaView style={styles.centered}><Text>Không tìm thấy đơn hàng.</Text></SafeAreaView>;
    }

    const subtotal = order.order_items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = order.total - subtotal;
    const isCancelled = order.status === 'Đã hủy';
    const cancellationReason = isCancelled && order.notes?.startsWith('Lý do hủy: ') ? order.notes.substring(12) : null;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#000" /></TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết đơn hàng</Text>
                <View style={{ width: 24 }} /> 
            </View>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <OrderStatusTracker status={order.status} orderType={order.order_type} />
                
                {cancellationReason && (
                    <View style={styles.cancellationReasonContainer}>
                        <Ionicons name="information-circle-outline" size={24} color="#b91c1c" />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={styles.cancellationReasonTitle}>Đơn hàng đã bị hủy</Text>
                            <Text style={styles.cancellationReasonText}>Lý do: {cancellationReason}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Tóm tắt đơn hàng</Text>
                    {order.order_items.map((item, index) => (
                        <View key={index} style={[styles.itemContainer, index === order.order_items.length - 1 && { borderBottomWidth: 0 }]}>
                            <Image source={{ uri: item.products?.image_url || 'https://via.placeholder.com/100' }} style={styles.itemImage} />
                            <View style={styles.itemDetails}>
                                <View style={styles.itemHeaderRow}>
                                    <Text style={styles.itemName}>{item.quantity}x {item.products?.name}</Text>
                                    <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                                </View>
                                
                                {(item.size || (item.toppings && item.toppings.length > 0) || (item.options && item.options.length > 0)) && (
                                    <View style={styles.customizationsWrapper}>
                                        {item.size && <Text style={styles.customizationText}><Text style={styles.customizationLabel}>Size:</Text> {item.size}</Text>}
                                        {item.toppings && item.toppings.length > 0 && <Text style={styles.customizationText}><Text style={styles.customizationLabel}>Topping:</Text> {item.toppings.map(t => t.name).join(', ')}</Text>}
                                        {item.options && item.options.length > 0 && <Text style={styles.customizationText}><Text style={styles.customizationLabel}>Tuỳ chọn:</Text> {item.options.join(', ')}</Text>}
                                    </View>
                                )}
                            </View>
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
                    <View style={styles.addressContainer}><Ionicons name="storefront-outline" size={24} color="#73509c" /><View style={styles.addressTextContainer}><Text style={styles.addressLabel}>Địa điểm</Text><Text style={styles.addressValue}>{order.locations?.name || 'Đang xác định...'}</Text></View></View>
                    <View style={styles.addressSeparator} />
                    <View style={styles.addressContainer}><Ionicons name={order.order_type === 'delivery' ? "home-outline" : "bag-handle-outline"} size={24} color="#73509c" /><View style={styles.addressTextContainer}><Text style={styles.addressLabel}>{order.order_type === 'delivery' ? 'Giao đến' : 'Nhận tại'}</Text><Text style={styles.addressValue}>{order.order_type === 'delivery' ? order.delivery_address : order.locations?.name}</Text></View></View>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Chi tiết đơn hàng</Text>
                    <InfoRow label="Mã đơn hàng" value={`#${order.id.substring(0, 8)}`} />
                    <InfoRow label="Thời gian đặt" value={new Date(order.created_at).toLocaleString('vi-VN')} />
                    {!cancellationReason && <InfoRow label="Ghi chú" value={order.notes || 'Không có'} />}
                </View>

                {order.status === 'Đang xử lý' && (
                    <View style={styles.actionContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder} disabled={isCancelling}>
                            {isCancelling ? (
                                <ActivityIndicator color="#D50000" />
                            ) : (
                                <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
            <ConfirmModal
                visible={isConfirmModalVisible}
                onClose={() => setConfirmModalVisible(false)}
                onConfirm={confirmCancellation}
                title="Xác nhận hủy"
                message="Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác."
                confirmText="Xác nhận hủy"
                cancelText="Ở lại"
            />
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
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
    itemDetails: { flex: 1 },
    itemHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemName: { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1, marginRight: 8 },
    itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
    customizationsWrapper: {
        marginTop: 8,
        backgroundColor: '#fee2e2',
        borderRadius: 8,
        padding: 10,
    },
    customizationText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    customizationLabel: {
        fontWeight: '600',
        color: '#111827',
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    infoLabel: { fontSize: 16, color: '#666' },
    infoValue: { fontSize: 16, color: '#333', fontWeight: '500' },
    separator: { height: 1, backgroundColor: '#F0E0E0', marginVertical: 8 },
    totalPrice: { fontWeight: 'bold', fontSize: 18, color: '#73509c' },
    addressContainer: { flexDirection: 'row', alignItems: 'center' },
    addressTextContainer: { marginLeft: 12, flex: 1 },
    addressLabel: { fontSize: 14, color: '#666' },
    addressValue: { fontSize: 16, fontWeight: '500', color: '#333' },
    addressSeparator: { height: 20, width: 1, backgroundColor: '#E0E0E0', marginLeft: 12, marginVertical: 8 },
    actionContainer: {
        marginHorizontal: 16,
        marginTop: 24,
    },
    cancelButton: {
        backgroundColor: '#FFEBEE',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D50000',
    },
    cancelButtonText: {
        color: '#D50000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancellationReasonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fee2e2',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#fca5a5',
    },
    cancellationReasonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#b91c1c',
    },
    cancellationReasonText: {
        fontSize: 14,
        color: '#b91c1c',
        marginTop: 4,
    },
});