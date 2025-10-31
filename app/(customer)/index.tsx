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
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/src/integrations/supabase/client";
import { Product, ProductCategory, Topping } from "@/types";
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

const MenuItem = ({
  product,
  onOpenOptions,
  quantity,
}: {
  product: Product;
  onOpenOptions: (product: Product) => void;
  quantity: number;
}) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.menuItemContainer}
      onPress={() => onOpenOptions(product)}
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
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityBadgeText}>{quantity}</Text>
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
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All Menu");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addItem, getProductQuantity, totalItems, totalPrice } = useCart();
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: categoryData, error: categoryError } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');

      if (categoryError) {
        console.error("Error fetching categories:", categoryError);
      } else if (categoryData) {
        setCategories([{ id: 'all', name: "All Menu", icon_name: "grid-outline", created_at: '' }, ...categoryData]);
        setActiveCategory("All Menu");
      }

      const { data: productData, error: productError } = await supabase.from("products").select("*");
      if (productError) console.error("Error fetching products:", productError);
      else setProducts(productData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleOpenOptions = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  const handleAddToCartFromModal = (product: Product, quantity: number, size: { name: string; price: number }, toppings: Topping[], options: string[]) => {
    addItem(product, quantity, size, toppings, options);
    handleCloseModal();
  };

  const productsToShow = useMemo(() => {
    let filtered = products;
    if (activeCategory !== "All Menu") {
      filtered = filtered.filter((product) => product.category === activeCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [activeCategory, products, searchQuery]);

  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesContainer}
    >
      {categories.map((cat) => (
        <CategoryChip
          key={cat.id}
          label={cat.name}
          icon={cat.icon_name as any || 'fast-food-outline'}
          isActive={activeCategory === cat.name}
          onPress={() => setActiveCategory(cat.name)}
        />
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{"Đặt món"}</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm món nhanh"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {renderCategories()}
        <View style={styles.menuContainer}>
          {loading ? <ActivityIndicator size="large" color="#73509c" /> : (
            productsToShow.map((product) => (
              <MenuItem
                key={product.id}
                product={product}
                onOpenOptions={handleOpenOptions}
                quantity={getProductQuantity(product.id)}
              />
            ))
          )}
          {productsToShow.length === 0 && !loading && (
            <Text style={styles.placeholderText}>Không tìm thấy món ăn nào.</Text>
          )}
        </View>
      </ScrollView>
      {totalItems > 0 && (
        <View style={styles.footer}>
            <TouchableOpacity style={styles.cartButton} onPress={() => router.push("/checkout")}>
                <Ionicons name="cart-outline" size={28} color="#333" />
                <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{totalItems}</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buyNowButton} onPress={() => router.push("/checkout")}>
                <Text style={styles.buyNowButtonText}>
                  Xem giỏ hàng - {formatPrice(totalPrice)}
                </Text>
            </TouchableOpacity>
        </View>
      )}
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
  header: { flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAFA", paddingVertical: 20, paddingHorizontal: 16 },
  headerTitle: { color: "#161616", fontSize: 20, fontWeight: "bold" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  menuContainer: { marginHorizontal: 16, paddingBottom: 160 },
  menuItemContainer: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, marginBottom: 12, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  menuItemImage: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  menuItemDetails: { flex: 1, justifyContent: "center", marginRight: 12 },
  menuItemName: { fontSize: 16, fontWeight: "bold" },
  menuItemDescription: { fontSize: 12, color: "#666", marginVertical: 4 },
  menuItemPrice: { fontSize: 14, fontWeight: "bold", color: "#73509c", marginTop: 4 },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0EBF8", justifyContent: "center", alignItems: "center" },
  quantityBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#73509c',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  quantityBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: { 
    position: "absolute", 
    bottom: Platform.OS === "ios" ? 90 : 70, 
    left: 0, 
    right: 0, 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    backgroundColor: "#fff", 
    borderTopWidth: 1, 
    borderTopColor: "#f0f0f0" 
  },
  cartButton: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: "#e0e0e0", justifyContent: "center", alignItems: "center", position: "relative", backgroundColor: "#fff" },
  cartBadge: { position: "absolute", top: 0, right: 0, backgroundColor: "#FF6C44", borderRadius: 10, width: 20, height: 20, justifyContent: "center", alignItems: "center" },
  cartBadgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  buyNowButton: { flex: 1, backgroundColor: "#73509c", paddingVertical: 16, borderRadius: 30, alignItems: "center", marginLeft: 16 },
  buyNowButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  placeholderText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666'
  }
});