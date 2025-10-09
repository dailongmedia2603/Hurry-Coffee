import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { CartItem } from '@/types';
import { formatPrice } from '@/src/utils/formatters';
import { useCart } from '@/src/providers/CartProvider';
import { Ionicons } from '@expo/vector-icons';

const CartListItem = ({ item }: { item: CartItem }) => {
  const { updateQuantity } = useCart();
  const imageUrl = item.product?.image_url;

  return (
    <View style={styles.container}>
      <Image
        source={imageUrl ? { uri: imageUrl } : require('@/assets/images/placeholder.png')}
        style={styles.image}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.name} numberOfLines={1}>{item.product?.name || 'Sản phẩm không xác định'}</Text>
        <Text style={styles.price}>{formatPrice(item.product.price)}</Text>
      </View>
      <View style={styles.quantitySelector}>
        <Pressable onPress={() => updateQuantity(item.id, -1)}>
          <Ionicons name="remove-circle-outline" size={24} color="#555" />
        </Pressable>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <Pressable onPress={() => updateQuantity(item.id, 1)}>
          <Ionicons name="add-circle-outline" size={24} color="#555" />
        </Pressable>
      </View>
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
    backgroundColor: 'white',
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  image: {
    width: 60,
    height: 60,
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
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartListItem;