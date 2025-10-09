import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { formatPrice } from '@/src/utils/formatters';
import { useRouter } from 'expo-router';
import { Order, OrderStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case 'Đã xác nhận':
      return { color: '#00C853', backgroundColor: '#E8F5E9', text: 'Đã xác nhận' };
    case 'Đang giao':
      return { color: '#2979FF', backgroundColor: '#E3F2FD', text: 'Đang giao' };
    case 'Hoàn thành':
      return { color: '#00C853', backgroundColor: '#E8F5E9', text: 'Hoàn thành' };
    case 'Đã huỷ':
    case 'Đã hủy':
      return { color: '#D50000', backgroundColor: '#FFEBEE', text: 'Đã hủy' };
    case 'Đang xử lý':
      return { color: '#FF9100', backgroundColor: '#FFF3E0', text: 'Đang xử lý' };
    case 'Đang làm':
      return { color: '#3b82f6', backgroundColor: '#dbeafe', text: 'Đang làm' };
    case 'Sẵn sàng':
      return { color: '#FF9100', backgroundColor: '#FFF3E0', text: 'Sẵn sàng' };
    default:
      return { color: '#666', backgroundColor: '#F5F5F5', text: status };
  }
};

const OrderCard = ({ order }: { order: Order }) => {
    const router = useRouter();
    const statusStyle = getStatusStyle(order.status as OrderStatus);

    const imageSource = order.restaurant_image_url === 'local_delivery_icon'
        ? require('@/assets/images/delivery.png')
        : (order.restaurant_image_url ? { uri: order.restaurant_image_url } : require('@/assets/images/placeholder.png'));

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
                    <Text style={styles.timestamp}>
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: vi })}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        flexDirection: 'row',
        overflow: 'hidden',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    restaurantImage: {
        width: 80,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        padding: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    statusBadge: {
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
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
    },
    timestamp: {
        fontSize: 12,
        color: '#999',
    },
});

export default OrderCard;