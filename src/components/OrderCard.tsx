import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Order, OrderStatus } from '@/types';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case 'Đang giao':
      return { color: '#2979FF', backgroundColor: '#E3F2FD', text: 'Đang giao' };
    case 'Hoàn thành':
      return { color: '#00C853', backgroundColor: '#E8F5E9', text: 'Hoàn thành' };
    case 'Đang xử lý':
      return { color: '#FF9100', backgroundColor: '#FFF3E0', text: 'Đang xử lý' };
    case 'Đang làm':
      return { color: '#3b82f6', backgroundColor: '#dbeafe', text: 'Đang làm' };
    case 'Sẵn sàng':
      return { color: '#FF9100', backgroundColor: '#FFF3E0', text: 'Sẵn sàng' };
    case 'Đã hủy':
      return { color: '#D50000', backgroundColor: '#FFEBEE', text: 'Đã hủy' };
    case 'Không gọi được':
      return { color: '#D50000', backgroundColor: '#FFEBEE', text: 'Không gọi được' };
    default:
      return { color: '#666', backgroundColor: '#F5F5F5', text: 'Không rõ' };
  }
};

const OrderCard = ({ order }: { order: Order }) => {
    const router = useRouter();
    const statusStyle = getStatusStyle(order.status);

    const imageSource = order.restaurant_image_url === 'local_delivery_icon'
        ? require('@/assets/images/delivery.png')
        : { uri: order.restaurant_image_url };

    return (
        <TouchableOpacity style={styles.card} onPress={() => router.push(`/order/${order.id}`)}>
            <Image source={imageSource} style={styles.restaurantImage} />
            <View style={styles.cardContent}>
                <View style={styles.header}>
                    <Text style={styles.restaurantName}>{order.restaurant_name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.text}</Text>
                    </View>
                </View>
                <Text style={styles.itemInfo}>{order.items_count} món hàng • {formatPrice(order.total)}</Text>
                <View style={styles.footer}>
                    <Text style={styles.date}>{new Date(order.created_at).toLocaleDateString('vi-VN')}</Text>
                    <TouchableOpacity style={styles.detailsButton}>
                        <Text style={styles.detailsButtonText}>Xem chi tiết</Text>
                        <Ionicons name="chevron-forward" size={16} color="#73509c" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        flexDirection: 'row',
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    restaurantImage: {
        width: 64,
        height: 64,
        borderRadius: 12,
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    itemInfo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 8,
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailsButtonText: {
        color: '#73509c',
        fontWeight: 'bold',
        marginRight: 4,
    },
});

export default OrderCard;