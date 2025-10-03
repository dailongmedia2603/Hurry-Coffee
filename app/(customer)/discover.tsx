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

const MenuItem = ({
  product,
  onAddToCart,
  onDecreaseFromCart,
  quantity,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
  onDecreaseFromCart: (product: Product) => void;
  quantity: number;
}) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.menuItemContainer}
      onPress={() => router.push(`/(customer)/product/${product.id}`)}
    >
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
      {quantity > 0 ? (
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onDecreaseFromCart(product)}
          >
            <Ionicons name="remove" size={20} color="#73509c" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onAddToCart(product)}
          >
            <Ionicons name="add" size={20} color="#73509c" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onAddToCart(product)}
        >
          <Ionicons name="add" size={24} color="#73509c" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default function DiscoverScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All Menu");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addItem, decreaseItem, getItemQuantity, totalItems, totalPrice } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: categoryData, error: categoryError } = await supabase.rpc(
        "get_distinct_categories"
      );
      if (categoryError) {
        console.error("Error fetching categories:", categoryError);
      } else if (categoryData) {
        const fetchedCategories = categoryData.map(
          (c: { category: string }) => c.category
        );
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
    addItem(product, 1, "M");
  };

  const handleDecreaseFromCart = (product: Product) => {
    decreaseItem(product.id, "M");
  };

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All Menu") {
      return products;
    }
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              activeCategory === category
                ? styles.categoryChipActive
                : styles.categoryChipInactive,
            ]}
            onPress={() => setActiveCategory(category)}
          >
            <Text
              style={[
                styles.categoryChipText,
                activeCategory === category
                  ? styles.categoryChipTextActive
                  : styles.categoryChipTextInactive,
              ]}
            >
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
          <TouchableOpacity
            onPress={() =>
              router.canGoBack() ? router.back() : router.push("/(customer)/")
            }
          >
            <Ionicons name="arrow-back" size={24} color="#161616" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{"Chi tiết nhà hàng"}</Text>
          <TouchableOpacity>
            <Ionicons name="search" size={24} color="#161616" />
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
            }}
            style={styles.restaurantImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons
              name="bicycle-outline"
              size={16}
              color="#656565"
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>{"Giao hàng nhanh"}</Text>
          </View>
          <Text style={styles.restaurantName}>{"Nhà hàng ABC"}</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons
                name="location-outline"
                size={16}
                color="#7C7C7C"
                style={styles.detailIcon}
              />
              <Text style={styles.subDetailText}>{"Bali, Indonesia"}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons
                name="star"
                size={16}
                color="#FFC107"
                style={styles.detailIcon}
              />
              <Text style={styles.subDetailText}>{"4.9 (1k+ đánh giá)"}</Text>
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
              <MenuItem
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onDecreaseFromCart={handleDecreaseFromCart}
                quantity={getItemQuantity(product.id, "M")}
              />
            ))
          )}
        </View>
      </ScrollView>
      {totalItems > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push("/(customer)/cart")}
          >
            <Ionicons name="basket-outline" size={28} color="#333" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buyNowButton}
            onPress={() => router.push("/(customer)/cart")}
          >
            <Text style={styles.buyNowButtonText}>
              Buy Now - {formatPrice(totalPrice)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FAFAFA",
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
    overflow: "hidden",
  },
  restaurantImage: {
    width: "100%",
    height: "100%",
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
    backgroundColor: "#FF6C44",
    borderColor: "#FF6C44",
  },
  categoryChipInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0E0E0",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  categoryChipTextInactive: {
    color: "#333333",
  },
  menuContainer: {
    marginHorizontal: 16,
    paddingBottom: 120,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  menuItemContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
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
    justifyContent: "center",
    marginRight: 12,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  menuItemDescription: {
    fontSize: 12,
    color: "#666",
    marginVertical: 4,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#73509c",
    marginTop: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0EBF8",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EBF8",
    borderRadius: 20,
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#73509c",
    minWidth: 20,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingBottom: Platform.OS === "ios" ? 34 : 12,
  },
  cartButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#fff",
  },
  cartBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FF6C44",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: "#FF3B30",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginLeft: 16,
  },
  buyNowButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});