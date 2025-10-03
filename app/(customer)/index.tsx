import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/integrations/supabase/client";
import { Product } from "../../types";
import MenuItemCard from "../../src/components/MenuItemCard";
import CategoryChip from "../../src/components/CategoryChip";

const categoryIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  Rice: "restaurant-outline",
  Snacks: "ice-cream-outline",
  Drinks: "beer-outline",
  default: "fast-food-outline",
};

export default function CustomerHomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; icon: keyof typeof Ionicons.glyphMap }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: categoryData, error: categoryError } = await supabase.rpc('get_distinct_categories');
      
      if (categoryError) {
        console.error("Error fetching categories:", categoryError);
      } else if (categoryData) {
        const fetchedCategories = categoryData.map((c: { category: string }) => ({
          name: c.category,
          icon: categoryIcons[c.category] || categoryIcons.default,
        }));
        setCategories([...fetchedCategories, { name: "More", icon: "ellipsis-horizontal-circle-outline" }]);
        if (fetchedCategories.length > 0) {
          setActiveCategory(fetchedCategories[0].name);
        }
      }

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (productError) {
        console.error("Error fetching products:", productError);
      } else if (productData) {
        setProducts(productData);
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!activeCategory || activeCategory === "More") {
      return products;
    }
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  const recommendedProducts = products.slice(0, 10);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={["#161616", "rgba(22, 22, 22, 0.1)"]}
        style={styles.gradient}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.locationLabel}>Location</Text>
            <View style={styles.locationDetails}>
              <Ionicons name="location-sharp" size={16} color="#fff" />
              <Text style={styles.locationText}>Bali, Indonesia</Text>
              <Ionicons name="chevron-down" size={16} color="#fff" />
            </View>
          </View>
          <Ionicons name="notifications-outline" size={28} color="#fff" />
        </View>
      </LinearGradient>
      <View style={styles.promoSection}>
        <View style={{ flex: 1 }}>
          <Text style={styles.promoTitle}>
            Grab Our Exclusive Food Discounts Now!
          </Text>
          <TouchableOpacity
            style={styles.orderButton}
            onPress={() => alert("Order Now Pressed!")}
          >
            <Text style={styles.orderButtonText}>Order Now</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.discountCircle}>
          <Text style={styles.discountText}>Discount</Text>
          <Text style={styles.discountValue}>35%</Text>
        </View>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search food"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity style={styles.filterButton}>
        <Ionicons name="options-outline" size={24} color="#ED1C24" />
      </TouchableOpacity>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      {categories.map((cat) => (
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

  const renderProductSection = (title: string, data: Product[]) => {
    if (loading) {
      return <ActivityIndicator size="large" color="#ED1C24" style={{ marginTop: 20 }} />;
    }
    if (data.length === 0 && !loading) {
      return null;
    }
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity>
            <Text style={styles.seeMore}>See more</Text>
          </TouchableOpacity>
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        <View style={styles.contentContainer}>
          {renderSearchBar()}
          {renderCategories()}
          {renderProductSection("Món ngon cho bạn", recommendedProducts)}
          {activeCategory && activeCategory !== "More" && renderProductSection(activeCategory, filteredProducts)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ED1C24",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerContainer: {
    backgroundColor: "#ED1C24",
    paddingBottom: 60,
  },
  gradient: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationLabel: {
    color: "#FAFAFA",
    fontSize: 12,
    marginBottom: 4,
  },
  locationDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    color: "#FAFAFA",
    fontSize: 14,
    fontWeight: "bold",
    marginHorizontal: 4,
  },
  promoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginTop: 20,
  },
  promoTitle: {
    color: "#FAFAFA",
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 40,
  },
  orderButton: {
    backgroundColor: "#FF6810",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: "flex-start",
    marginTop: 20,
  },
  orderButtonText: {
    color: "#FAFAFA",
    fontSize: 14,
    fontWeight: "bold",
  },
  discountCircle: {
    backgroundColor: "#fff",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginLeft: 10,
  },
  discountText: {
    fontSize: 12,
    color: "#333",
  },
  discountValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ED1C24",
  },
  contentContainer: {
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -40,
    paddingTop: 20,
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
  filterButton: {
    backgroundColor: "#FEECEB",
    borderRadius: 15,
    padding: 8,
  },
  categoriesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    color: "#ED1C24",
    fontWeight: "500",
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666'
  }
});