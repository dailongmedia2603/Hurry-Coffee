import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Order, OrderStatus, Product, Location, Topping } from '@/types';
import OrderStatusTracker from '@/src/components/OrderStatusTracker';
import { formatDisplayPhone } from '@/src/utils/formatters';
import * as Linking from 'expo-linking';
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

export default function StaffOrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);

    const fetchOrderDetails = async () => {
        if (!id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select(`*, order_items (quantity, price, size, toppings, options, products (*)), locations (*)`)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching order details:', error);
            setOrder(null);
        } else {
            setOrder(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrderDetails();

        const channel = supabase
            .channel(`staff-order-${id}`)
            .on<OrderDetails>(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${id}`,
                },
                (payload) => {
                    setOrder((currentOrder) => {
                        if (currentOrder) {
                            return { ...currentOrder, ...payload.new };
                        }
                        return currentOrder;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const handleUpdateStatus = async (newStatus: OrderStatus) => {
        if (!order) return;
        setUpdating(true);

        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);
        
        if (error) {
            setUpdating(false);
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn hàng.');
        } else {
            setOrder(currentOrder => 
                currentOrder ? { ...currentOrder, status: newStatus } : null
            );
            setUpdating(false);
        }
    };

    const handleUncontactable = () => {
        if (!order) return;
        setConfirmModalVisible(true);
    };

    const confirmUncontactable = async () => {
        setConfirmModalVisible(false);
        if (!order) return;

        setUpdating(true);
        const { error } = await supabase
            .from('orders')
            .update({ status: 'Không gọi được' })
            .eq('id', id);
        
        if (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
        } else {
            setOrder(currentOrder => 
                currentOrder ? { ...currentOrder, status: 'Không gọi được' } : null
            );
        }
        setUpdating(false);
    };

    const handleCallCustomer = () => {
        if (order && order.customer_phone) {
            Linking.openURL(`tel:${order.customer_phone}`);
        }
    };

    const renderActionButtons = () => {
        if (!order) return null;

        const getNextStatus = (): OrderStatus | null => {
            switch (order.status) {
                case 'Đang xử lý': return 'Đang làm';
                case 'Đang làm': return 'Hoàn thành';
                case 'Sẵn sàng': case 'Đang giao': return 'Hoàn thành';
                default: return null;
            }
        };

        const getButtonText = (): string => {
            switch (order.status) {
                case 'Đang xử lý': return 'Bắt đầu làm';
                case 'Đang làm': return 'Hoàn thành';
                case 'Sẵn sàng': return 'Hoàn thành (Khách đã lấy)';
                case 'Đang giao': return 'Hoàn thành (Đã giao)';
                default: return '';
            }
        };

        const nextStatus = getNextStatus();
        const isCompleting = nextStatus === 'Hoàn thành';
        const isActionable = !['Hoàn thành', 'Đã hủy', 'Không gọi được'].includes(order.status);

        const mainActionButton = nextStatus ? (
            <TouchableOpacity 
                style={[styles.actionButton, isCompleting && styles.completeButton]} 
                onPress={() => handleUpdateStatus(nextStatus)}
                disabled={updating}
            >
                {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>{getButtonText()}</Text>}
            </TouchableOpacity>
        ) : null;

        const callButton = isActionable && order.customer_phone ? (
            <TouchableOpacity 
                style={[styles.secondaryButton, { backgroundColor: '#e0f2fe', borderColor: '#0284c7' }]} 
                onPress={handleCallCustomer}
                disabled={updating}
            >
                <Ionicons name="call-outline" size={20} color="#0284c7" />
                <Text style={[styles.secondaryButtonText, { color: '#0284c7' }]}>Gọi</Text>
            </TouchableOpacity>
        ) : null;

        const uncontactableButton = isActionable ? (
            <TouchableOpacity 
                style={[styles.secondaryButton, { backgroundColor: '#fee2e2', borderColor: '#ef4444' }]} 
                onPress={handleUncontactable}
                disabled={updating}
            >
                <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                <Text style={[styles.secondaryButtonText, { color: '#ef4444' }]}>Không gọi được</Text>
            </TouchableOpacity>
        ) : null;

        if (!mainActionButton && !uncontactableButton && !callButton) {
            return null;
        }

        return (
            <View style={styles.actionContainer}>
                <View style={styles.mainActionsRow}>
                    {mainActionButton}
                </View>
                {(callButton || uncontactableButton) && (
                    <View style={styles.secondaryActionsContainer}>
                        {uncontactableButton}
                        {callButton}
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" color="#73509c" /></SafeAreaView>;
    }

    if (!order) {
        return <SafeAreaView style={styles.centered}><Text>Không tìm thấy đơn hàng.</Text></SafeAreaView>;
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
                <OrderStatusTracker status={order.status} orderType={order.order_type} />
                {renderActionButtons()}
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
                    <Text style={styles.cardTitle}>Thông tin</Text>
                    <InfoRow label="Tên khách hàng" value={order.customer_name || 'Không có'} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Số điện thoại</Text>
                        <TouchableOpacity onPress={handleCallCustomer}>
                            <Text style={[styles.infoValue, styles.phoneLink]}>
                                {formatDisplayPhone(order.customer_phone) || 'Không có'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <InfoRow label="Loại đơn" value={order.order_type === 'delivery' ? 'Giao hàng' : 'Ghé lấy'} />
                    <InfoRow label="Địa điểm" value={order.locations?.name || 'Đang xác định...'} />
                    <InfoRow label={order.order_type === 'delivery' ? 'Địa chỉ giao' : 'Nơi nhận'} value={order.order_type === 'delivery' ? (order.delivery_address || '') : (order.locations?.name || '')} />
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Chi tiết đơn hàng</Text>
                    <InfoRow label="Mã đơn hàng" value={`#${order.id.substring(0, 8)}`} />
                    <InfoRow label="Thời gian đặt" value={new Date(order.created_at).toLocaleString('vi-VN')} />
                    <InfoRow label="Ghi chú" value={order.notes || 'Không có'} />
                </View>
            </ScrollView>
            <ConfirmModal
                visible={isConfirmModalVisible}
                onClose={() => setConfirmModalVisible(false)}
                onConfirm={confirmUncontactable}
                title="Xác nhận trạng thái"
                message="Bạn có muốn cập nhật trạng thái đơn hàng này thành 'Không gọi được' không?"
                confirmText="Xác nhận"
                cancelText="Hủy"
                icon="call-outline"
                iconColor="#ef4444"
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
    scrollContainer: { paddingBottom: 40 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginHorizontal: 16, marginTop: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    itemContainer: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    itemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
    itemDetails: { flex: 1 },
    itemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemName: { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1, marginRight: 8 },
    itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
    customizationsWrapper: { marginTop: 8, backgroundColor: '#fee2e2', borderRadius: 8, padding: 10 },
    customizationText: { fontSize: 14, color: '#374151', lineHeight: 20 },
    customizationLabel: { fontWeight: '600', color: '#111827' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    infoLabel: { fontSize: 16, color: '#666' },
    infoValue: { fontSize: 16, color: '#333', fontWeight: '500', flex: 1, textAlign: 'right' },
    separator: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 8 },
    totalPrice: { fontWeight: 'bold', fontSize: 18, color: '#73509c' },
    actionContainer: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
    mainActionsRow: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
    actionButton: { flex: 1, backgroundColor: '#73509c', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
    completeButton: { backgroundColor: '#00C853' },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    secondaryActionsContainer: { flexDirection: 'row', gap: 12 },
    secondaryButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
    secondaryButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    phoneLink: { color: '#3b82f6', textDecorationLine: 'underline' },
});