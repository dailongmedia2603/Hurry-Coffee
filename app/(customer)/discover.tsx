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
import ProductOptionsModal from "@/src/components/ProductOptionsModal";
import CategoryChip from "@/src/components/CategoryChip";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const categoryIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  "Cà phê": "cafe-outline",
  "Đồ ăn": "fast-food-outline",
  "Trà": "leaf-outline",
  Rice: "restaurant-outline",
  Snacks: "ice-cream-outline",
  Drinks: "beer-outline",
  default: "fast-food-outline",
};

const MenuItem = ({
  product,
  onAddToCart,
  onDecreaseFromCart,
  onOpenOptions,
  quantity,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
  onDecreaseFromCart: (product: Product) => void;
  onOpenOptions: (product: Product) => void;
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
          onPress={() => onOpenOptions(product)}
        >
          <Ionicons name="add" size={24} color="#73509c" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default function DiscoverScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; icon: keyof typeof Ionicons.glyphMap }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All Menu");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addItem, decreaseItem, getProductQuantity, totalItems, totalPrice } = useCart();
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: categoryData, error: categoryError } = await supabase.rpc(
        "get_distinct_categories"
      );
      if (categoryError) {
        console.error("Error fetching categories:", categoryError);
      } else if (categoryData) {
        const fetchedCategories = categoryData.map((c: { category: string }) => ({
          name: c.category,
          icon: categoryIcons[c.category] || categoryIcons.default,
        }));
        setCategories([{ name: "All Menu", icon: "grid-outline" }, ...fetchedCategories]);
        setActiveCategory("All Menu");
      }

      const { data: productData, error: productError } = await supabase.from("products").select("*");
      if (productError) console.error("Error fetching products:", productError);
      else setProducts(productData || []);
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

  const handleOpenOptions = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  const handleAddToCartFromModal = (product: Product, quantity: number, size: string) => {
    addItem(product, quantity, size);
    handleCloseModal();
  };

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All Menu") return products;
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      {categories.slice(0, 4).map((cat) => ( // Giới hạn 4 danh mục để vừa vặn
        <CategoryChip
          key={cat.name}
          label={cat.name}
          icon={cat.icon}
          isActive={activeCategory === cat.name}
          onPress={() => setActiveCategory(cat.name)}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push("/(customer)/")}>
            <Ionicons name="arrow-back" size={24} color="#161616" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{"Đặt món"}</Text>
          <TouchableOpacity>
            <Ionicons name="search" size={24} color="#161616" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.restaurantName}>{"Chọn món để đặt ngay"}</Text>
        </View>

        {renderCategories()}
        <View style={styles.menuContainer}>
          {loading ? <ActivityIndicator size="large" color="#73509c" /> : (
            filteredProducts.map((product) => (
              <MenuItem
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onDecreaseFromCart={handleDecreaseFromCart}
                onOpenOptions={handleOpenOptions}
                quantity={getProductQuantity(product.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>
          <TouchableOpacity style={styles.cartButton} onPress={() => router.push("/(customer)/checkout")}>
              <Ionicons name="cart-outline" size={28} color="#333" />
              {totalItems > 0 && (
                <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{totalItems}</Text></View>
              )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyNowButton} onPress={() => router.push("/(customer)/checkout")}>
              <Text style={styles.buyNowButtonText}>
                {totalItems > 0 ? `Xem giỏ hàng - ${formatPrice(totalPrice)}` : 'Xem giỏ hàng'}
              </Text>
          </TouchableOpacity>
      </View>
      <ProductOptionsModal
        visible={isModalVisible}
        product={selectedProduct}
        onClose={handleCloseModal}
        onAddToCart={handleAddToCartFromModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollView: { flex: 1, backgroundColor: "#FAFAFA" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FAFAFA", paddingVertical: 20, paddingHorizontal: 16 },
  headerTitle: { color: "#161616", fontSize: 16, fontWeight: "bold" },
  detailsContainer: { marginBottom: 16, marginHorizontal: 16, marginTop: 16 },
  restaurantName: { color: "#161616", fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  categoriesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  menuContainer: { marginHorizontal: 16, paddingBottom: 120 },
  menuItemContainer: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, marginBottom: 12, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  menuItemImage: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  menuItemDetails: { flex: 1, justifyContent: "center", marginRight: 12 },
  menuItemName: { fontSize: 16, fontWeight: "bold" },
  menuItemDescription: { fontSize: 12, color: "#666", marginVertical: 4 },
  menuItemPrice: { fontSize: 14, fontWeight: "bold", color: "#73509c", marginTop: 4 },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0EBF8", justifyContent: "center", alignItems: "center" },
  quantityControl: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0EBF8", borderRadius: 20 },
  quantityButton: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  quantityText: { fontSize: 16, fontWeight: "bold", color: "#73509c", minWidth: 20, textAlign: "center" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 20, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0", paddingBottom: Platform.OS === "ios" ? 34 : 12 },
  cartButton: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: "#e0e0e0", justifyContent: "center", alignItems: "center", position: "relative", backgroundColor: "#fff" },
  cartBadge: { position: "absolute", top: 0, right: 0, backgroundColor: "#FF6C44", borderRadius: 10, width: 20, height: 20, justifyContent: "center", alignItems: "center" },
  cartBadgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  buyNowButton: { flex: 1, backgroundColor: "#73509c", paddingVertical: 16, borderRadius: 30, alignItems: "center", marginLeft: 16 },
  buyNowButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});