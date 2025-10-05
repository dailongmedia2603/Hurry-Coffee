import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TextInput,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/src/integrations/supabase/client";
import { Product, ProductCategory } from "@/types";
import MenuItemCard from "@/src/components/MenuItemCard";
import CategoryChip from "@/src/components/CategoryChip";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthContext";

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [promoImageUrl, setPromoImageUrl] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch promo image URL
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'promo_image_url')
        .single();
      
      if (settingsData?.value) {
        setPromoImageUrl(settingsData.value);
      }

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (productError) {
        console.error("Error fetching products:", productError);
        setLoading(false);
        return;
      }
      
      const allProducts = productData || [];
      setProducts(allProducts);

      const categoriesWithProducts = [...new Set(allProducts.map(p => p.category).filter(Boolean))] as string[];

      if (categoriesWithProducts.length > 0) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('product_categories')
          .select('*')
          .in('name', categoriesWithProducts)
          .order('name');
        
        if (categoryError) {
          console.error("Error fetching categories:", categoryError);
          setCategories([{ id: 'all', name: "Tất cả", icon_name: "grid-outline", created_at: '' }]);
        } else {
          setCategories([
            { id: 'all', name: "Tất cả", icon_name: "grid-outline", created_at: '' }, 
            ...(categoryData || [])
          ]);
        }
      } else {
        setCategories([{ id: 'all', name: "Tất cả", icon_name: "grid-outline", created_at: '' }]);
      }

      setActiveCategory("Tất cả");
      setLoading(false);
    };

    fetchData();
  }, []);

  const categoryFilteredProducts = useMemo(() => {
    if (!activeCategory || activeCategory === "Tất cả") {
      return products;
    }
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  const searchedProducts = useMemo(() => {
    if (!searchQuery) {
      return [];
    }
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, products]);

  const recommendedProducts = products.slice(0, 10);

  const renderHeader = () => (
    <LinearGradient
      colors={["#402c75", "#73509c"]}
      style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}
    >
      <View style={styles.topBar}>
        <View style={styles.userInfoContainer}>
          <Ionicons name="person-circle-outline" size={32} color="#fff" style={{ marginRight: 8 }} />
          <View>
            {user && profile ? (
              <>
                <Text style={styles.userName}>{profile.full_name || 'Người dùng'}</Text>
                <Text style={styles.userPhone}>{user.phone}</Text>
              </>
            ) : (
              <Text style={styles.userName}>Chưa đăng nhập</Text>
            )}
          </View>
        </View>
        <Ionicons name="notifications-outline" size={28} color="#fff" />
      </View>
      <Image
        source={{ uri: promoImageUrl || 'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png' }}
        style={styles.promoImage}
        resizeMode="cover"
      />
    </LinearGradient>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm món nhanh"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );

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

  const renderProductSection = (title: string, data: Product[], isSearchResult = false) => {
    if (loading && !isSearchResult) {
      return <ActivityIndicator size="large" color="#73509c" style={{ marginTop: 20 }} />;
    }
    if (data.length === 0 && !loading) {
      if (isSearchResult) {
        return <Text style={styles.placeholderText}>Không tìm thấy món ăn nào.</Text>;
      }
      return null;
    }
    const isRecommendedSection = title === "Món ngon cho bạn";
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {!isRecommendedSection && !isSearchResult && (
            <TouchableOpacity onPress={() => router.push(`/(customer)/category/${title}`)}>
              <Text style={styles.seeMore}>Tất cả</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={data}
          renderItem={({ item }) => <MenuItemCard product={item} />}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {renderHeader()}
        <View style={styles.contentContainer}>
          {renderSearchBar()}
          {searchQuery ? (
            renderProductSection("Kết quả tìm kiếm", searchedProducts, true)
          ) : (
            <>
              {renderCategories()}
              {activeCategory === "Tất cả" ? (
                <>
                  {renderProductSection("Món ngon cho bạn", recommendedProducts)}
                  {categories
                    .filter((cat) => cat.name !== "Tất cả")
                    .map((cat) => {
                      const categoryProducts = products.filter((p) => p.category === cat.name);
                      if (categoryProducts.length === 0) return null;
                      return (
                        <View key={cat.id}>
                          {renderProductSection(
                            cat.name,
                            categoryProducts
                          )}
                        </View>
                      )
                    })}
                </>
              ) : (
                renderProductSection(activeCategory, categoryFilteredProducts)
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#402c75",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerContainer: {
    paddingBottom: 60,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userPhone: {
    color: '#E0E0E0',
    fontSize: 12,
  },
  promoImage: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    alignSelf: 'center',
    marginTop: 20,
  },
  contentContainer: {
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -40,
    paddingTop: 20,
    paddingBottom: 100,
    flex: 1,
  },
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
    flexDirection: "row",
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  seeMore: {
    fontSize: 14,
    color: "#73509c",
    fontWeight: "500",
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666'
  }
});