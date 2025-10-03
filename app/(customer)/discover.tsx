import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/src/integrations/supabase/client";
import { Product } from "@/types";
import { useRouter } from "expo-router";
import { useCart } from "@/src/context/CartContext";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const MenuItem = ({ product, onAddToCart }: { product: Product, onAddToCart: (product: Product) => void }) => {
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
      <TouchableOpacity style={styles.addButton} onPress={() => onAddToCart(product)}>
        <Ionicons name="add" size={24} color="#73509c" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function DiscoverScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All Menu");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addItem, totalItems, totalPrice } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: categoryData, error: categoryError } = await supabase.rpc('get_distinct_categories');
      if (categoryError) {
        console.error("Error fetching categories:", categoryError);
      } else if (categoryData) {
        const fetchedCategories = categoryData.map((c: { category: string }) => c.category);
        setCategories(["All Menu", ...fetchedCategories]);
      }

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*");

      if (productError) {
        console.error("Error fetching products:", productError);
      } else {
        setProducts(productData || []);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddToCart = (product: Product) => {
    addItem(product, 1, 'M');
  };

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All Menu") {
      return products;
    }
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              activeCategory === category ? styles.categoryChipActive : styles.categoryChipInactive,
            ]}
            onPress={() => setActiveCategory(category)}
          >
            <Text style={[
              styles.categoryChipText,
              activeCategory === category ? styles.categoryChipTextActive : styles.categoryChipTextInactive,
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

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

        {renderCategories()}

        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Thực đơn</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#73509c" />
          ) : (
            filteredProducts.map((product) => (
              <MenuItem key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))
          )}
        </View>
      </ScrollView>
      {totalItems > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={() => router.push('/(customer)/cart')}>
            <View style={styles.cartInfo}>
                <Text style={styles.cartBarText}>{totalItems} món</Text>
                <Text style={styles.cartBarPrice}>{formatPrice(totalPrice)}</Text>
            </View>
            <View style={styles.viewCartButton}>
                <Text style={styles.viewCartText}>Xem giỏ hàng</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
        </TouchableOpacity>
      )}
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
    marginBottom: 16,
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
  categoriesContainer: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: '#FF6C44',
    borderColor: '#FF6C44',
  },
  categoryChipInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  categoryChipTextInactive: {
    color: '#333333',
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
    marginRight: 12,
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
  cartBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 16,
    right: 16,
    backgroundColor: '#73509c',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cartInfo: {
    flexDirection: 'column',
  },
  cartBarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cartBarPrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  viewCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
});