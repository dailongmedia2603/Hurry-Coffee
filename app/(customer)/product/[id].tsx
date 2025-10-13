import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/src/integrations/supabase/client';
import { Product } from '@/types';
import { useCart } from '@/src/context/CartContext';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const SIZES = [
  { name: 'S', priceModifier: 0 },
  { name: 'M', priceModifier: 5000 },
  { name: 'L', priceModifier: 10000 },
];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(SIZES[1]);
  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
      } else {
        setProduct(data);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const sizePayload = {
        name: selectedSize.name,
        price: product.price + selectedSize.priceModifier
    };
    addItem(product, quantity, sizePayload, [], []);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#73509c" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  const totalPrice = (product.price + selectedSize.priceModifier) * quantity;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detail</Text>
            <View style={styles.headerButton} />
          </View>
        </LinearGradient>

        <Image
          source={{ uri: product.image_url || 'https://via.placeholder.com/400' }}
          style={styles.productImage}
        />

        <View style={styles.contentContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDescription}>{product.description}</Text>

          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#FFC107" />
            <Text style={styles.ratingText}>4.9 (115 Reviews)</Text>
          </View>

          <View style={styles.separator} />

          <Text style={styles.sectionTitle}>Size</Text>
          <View style={styles.sizeSelectorContainer}>
            {SIZES.map((size) => (
              <TouchableOpacity
                key={size.name}
                style={[
                  styles.sizeButton,
                  selectedSize.name === size.name && styles.sizeButtonSelected,
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <Text
                  style={[
                    styles.sizeButtonText,
                    selectedSize.name === size.name && styles.sizeButtonTextSelected,
                  ]}
                >
                  {size.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.quantitySelector}>
            <TouchableOpacity
              onPress={() => setQuantity(q => Math.max(1, q - 1))}
              style={styles.quantityButton}
            >
              <Ionicons name="remove" size={22} color="#73509c" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              onPress={() => setQuantity(q => q + 1)}
              style={styles.quantityButton}
            >
              <Ionicons name="add" size={22} color="#73509c" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Text style={styles.addToCartButtonText}>Thêm giỏ hàng - {formatPrice(totalPrice)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerButton: {
    padding: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  productImage: {
    width: '100%',
    height: 350,
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingBottom: 120,
  },
  productName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sizeSelectorContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sizeButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeButtonSelected: {
    backgroundColor: '#73509c',
    borderColor: '#73509c',
  },
  sizeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  sizeButtonTextSelected: {
    color: '#fff',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  quantityButton: {
    padding: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 34,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#73509c',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});