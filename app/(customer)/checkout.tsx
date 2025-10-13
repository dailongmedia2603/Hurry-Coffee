import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '@/src/context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import ConfirmationModal, { ConfirmationDetails } from '@/src/components/ConfirmationModal';
import { getAnonymousId } from '@/src/utils/anonymousId';

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
  const [notes, setNotes] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);

  const handlePlaceOrder = async (details: ConfirmationDetails) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let anonymousId: string | null = null;
      if (!user) {
        anonymousId = await getAnonymousId();
      }

      const { data: newOrderData, error: orderError } = await supabase
        .from('orders')
        .insert({ 
            user_id: user?.id || null, 
            anonymous_device_id: anonymousId,
            total: totalPrice, 
            notes: notes,
            order_type: details.orderType,
            delivery_address: details.orderType === 'delivery' ? details.address : null,
            pickup_location_id: details.orderType === 'pickup' ? details.locationId : null,
            customer_name: details.name,
            customer_phone: details.phone,
            is_phone_verified: details.isPhoneVerified,
        })
        .select()
        .single();

      if (orderError) throw orderError;
      if (!newOrderData) throw new Error("Không nhận được dữ liệu đơn hàng sau khi tạo.");

      const newOrder = newOrderData;

      const orderItems = items.map(item => ({
        order_id: newOrder.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      if (details.orderType === 'delivery' && details.address) {
        supabase.functions.invoke('assign-order-to-location', {
          body: {
            order_id: newOrder.id,
            delivery_address: details.address,
          },
        }).then(({ error }) => {
          if (error) {
            console.error('Lỗi khi tự động phân phối đơn hàng:', error);
          }
        });
      }

      setModalVisible(false);
      clearCart();
      router.replace('/(customer)/cart');
      Alert.alert("Thành công", "Đơn hàng của bạn đã được đặt thành công!");

    } catch (error) {
      console.error("Chi tiết lỗi đặt hàng:", error);
      const message = (error && typeof error === 'object' && 'message' in error) 
        ? String(error.message) 
        : "Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.";
      
      Alert.alert("Lỗi Đặt Hàng", `Chi tiết: ${message}`);
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
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
                const toppingsPrice = item.toppings.reduce((sum, topping) => sum + topping.price, 0);
                const singleItemPrice = item.product.price + item.size.priceModifier + toppingsPrice;

                return (
                    <View style={styles.cartItem}>
                        <Image source={{ uri: item.product.image_url || 'https://via.placeholder.com/100' }} style={styles.itemImage} />
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemName}>{item.product.name}</Text>
                            <Text style={styles.itemOptions}>Size: {item.size.name}</Text>
                            {item.toppings.length > 0 && (
                                <Text style={styles.itemOptions}>
                                    Topping: {item.toppings.map(t => t.name).join(', ')}
                                </Text>
                            )}
                            {item.options.length > 0 && (
                                <Text style={styles.itemOptions}>
                                    Tuỳ chọn: {item.options.join(', ')}
                                </Text>
                            )}
                            <Text style={styles.itemPrice}>{formatPrice(singleItemPrice)}</Text>
                        </View>
                        <View style={styles.quantityControl}>
                            <TouchableOpacity onPress={() => decreaseItem(item.id)}>
                                <Ionicons name="remove-circle-outline" size={28} color="#73509c" />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{item.quantity}</Text>
                            <TouchableOpacity onPress={() => addItem(item.product, 1, item.size, item.toppings, item.options)}>
                                <Ionicons name="add-circle-outline" size={28} color="#73509c" />
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            }}
            contentContainerStyle={styles.listContainer}
            ListFooterComponent={
              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>Ghi chú</Text>
                <View style={styles.notesInputContainer}>
                  <Ionicons name="document-text-outline" size={20} color="#999" style={styles.notesIcon} />
                  <TextInput
                    placeholder="Thêm ghi chú cho nhà hàng..."
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />
                </View>
              </View>
            }
        />
      )}

      {items.length > 0 && (
        <View style={styles.footer}>
            <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Tổng cộng ({totalItems} món)</Text>
                <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={() => setModalVisible(true)} disabled={loading}>
                <Text style={styles.checkoutButtonText}>Xác nhận Đơn hàng</Text>
            </TouchableOpacity>
        </View>
      )}
      <ConfirmationModal 
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handlePlaceOrder}
        loading={loading}
      />
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
    itemOptions: { fontSize: 14, color: '#666', marginVertical: 2 },
    itemPrice: { fontSize: 16, fontWeight: '500', color: '#73509c', marginTop: 4 },
    quantityControl: { flexDirection: 'row', alignItems: 'center' },
    quantityText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 12 },
    footer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E0E0E0', padding: 16, paddingBottom: 34 },
    totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    totalLabel: { fontSize: 16, color: '#666' },
    totalPrice: { fontSize: 22, fontWeight: 'bold' },
    checkoutButton: { backgroundColor: '#73509c', padding: 16, borderRadius: 30, alignItems: 'center' },
    checkoutButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    notesSection: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    notesTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    notesInputContainer: {
      flexDirection: 'row',
      backgroundColor: '#f3f4f6',
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 10,
      minHeight: 80,
    },
    notesIcon: {
      marginRight: 10,
      marginTop: 5,
    },
    notesInput: {
      flex: 1,
      fontSize: 16,
      textAlignVertical: 'top',
    },
});