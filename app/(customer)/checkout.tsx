import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '@/src/context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, totalPrice, totalItems, addItem, decreaseItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Lỗi", "Bạn cần đăng nhập để đặt hàng.");
        setLoading(false);
        return;
      }

      // 1. Create an order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({ user_id: user.id, total: totalPrice })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItems = items.map(item => ({
        order_id: newOrder.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Clear cart and navigate
      clearCart();
      router.replace('/(customer)/cart');
      Alert.alert("Thành công", "Đơn hàng của bạn đã được đặt thành công!");

    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng của bạn</Text>
        <View style={{ width: 24 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống.</Text>
        </View>
      ) : (
        <FlatList
            data={items}
            keyExtractor={(item) => `${item.product.id}-${item.size}`}
            renderItem={({ item }) => (
                <View style={styles.cartItem}>
                    <Image source={{ uri: item.product.image_url || 'https://via.placeholder.com/100' }} style={styles.itemImage} />
                    <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{item.product.name}</Text>
                        <Text style={styles.itemSize}>Size: {item.size}</Text>
                        <Text style={styles.itemPrice}>{formatPrice(item.product.price)}</Text>
                    </View>
                    <View style={styles.quantityControl}>
                        <TouchableOpacity onPress={() => decreaseItem(item.product.id, item.size)}>
                            <Ionicons name="remove-circle-outline" size={28} color="#73509c" />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => addItem(item.product, 1, item.size)}>
                            <Ionicons name="add-circle-outline" size={28} color="#73509c" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            contentContainerStyle={styles.listContainer}
        />
      )}

      {items.length > 0 && (
        <View style={styles.footer}>
            <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Tổng cộng ({totalItems} món)</Text>
                <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={handlePlaceOrder} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutButtonText}>Xác nhận Đơn hàng</Text>}
            </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#666' },
    listContainer: { padding: 16 },
    cartItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
    itemImage: { width: 70, height: 70, borderRadius: 8, marginRight: 12 },
    itemDetails: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: 'bold' },
    itemSize: { fontSize: 14, color: '#666', marginVertical: 4 },
    itemPrice: { fontSize: 16, fontWeight: '500', color: '#73509c' },
    quantityControl: { flexDirection: 'row', alignItems: 'center' },
    quantityText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 12 },
    footer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E0E0E0', padding: 16, paddingBottom: 34 },
    totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    totalLabel: { fontSize: 16, color: '#666' },
    totalPrice: { fontSize: 22, fontWeight: 'bold' },
    checkoutButton: { backgroundColor: '#73509c', padding: 16, borderRadius: 30, alignItems: 'center' },
    checkoutButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});