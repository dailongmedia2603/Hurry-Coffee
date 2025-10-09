import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { OrderItem } from '@/types';
import { formatPrice } from '@/src/utils/formatters';

const OrderItemListItem = ({ item }: { item: OrderItem }) => {
  const imageUrl = item.products?.image_url;
  return (
    <View style={styles.container}>
      <Image
        source={imageUrl ? { uri: imageUrl } : require('@/assets/images/placeholder.png')}
        style={styles.image}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.name} numberOfLines={1}>{item.products?.name || 'Sản phẩm không xác định'}</Text>
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
      </View>
      <Text style={styles.quantity}>x{item.quantity}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: '#888',
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default OrderItemListItem;