import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/integrations/supabase/client";
import { Product } from "../../types";
import { useRouter } from "expo-router";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const MenuItem = ({ product }: { product: Product }) => {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.menuItemContainer} onPress={() => router.push(`/(customer)/product/${product.id}`)}>
      <Image
        source={{ uri: product.image_url || "https://via.placeholder.com/100" }}
        style={styles.menuItemImage}
      />
      <View style={styles.menuItemDetails}>
        <Text style={styles.menuItemName}>{product.name}</Text>
        <Text style={styles.menuItemDescription} numberOfLines={2}>
          {product.description || "Mô tả món ăn đang được cập nhật."}
        </Text>
        <Text style={styles.menuItemPrice}>{formatPrice(product.price)}</Text>
      </View>
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={24} color="#73509c" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function DiscoverScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .limit(10);

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/(customer)/')}>
            <Ionicons name="arrow-back" size={24} color="#161616" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {"Chi tiết nhà hàng"}
          </Text>
          <TouchableOpacity>
            <Ionicons name="search" size={24} color="#161616" />
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop' }}
              style={styles.restaurantImage}
              resizeMode="cover"
            />
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="bicycle-outline" size={16} color="#656565" style={styles.detailIcon} />
            <Text style={styles.detailText}>
              {"Giao hàng nhanh"}
            </Text>
          </View>
          <Text style={styles.restaurantName}>
            {"Nhà hàng ABC"}
          </Text>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color="#7C7C7C" style={styles.detailIcon} />
              <Text style={styles.subDetailText}>
                {"Bali, Indonesia"}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="star" size={16} color="#FFC107" style={styles.detailIcon} />
              <Text style={styles.subDetailText}>
                {"4.9 (1k+ đánh giá)"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Thực đơn</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#73509c" />
          ) : (
            products.map((product) => (
              <MenuItem key={product.id} product={product} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: "#FFFFFF" 
  },
  scrollView: { 
    flex: 1, 
    backgroundColor: "#FAFAFA" 
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    color: "#161616",
    fontSize: 16,
    fontWeight: "bold",
  },
  imageContainer: {
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    height: 200,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    marginBottom: 28,
    marginHorizontal: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  detailIcon: {
    marginRight: 4,
  },
  detailText: {
    color: "#656565",
    fontSize: 12,
  },
  subDetailText: {
    color: "#7C7C7C",
    fontSize: 12,
  },
  restaurantName: {
    color: "#161616",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  menuContainer: {
    marginHorizontal: 16,
    paddingBottom: 100,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuItemContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  menuItemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#666',
    marginVertical: 4,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#73509c',
    marginTop: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EBF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
});