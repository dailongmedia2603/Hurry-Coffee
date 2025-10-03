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
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types";

export default function CustomerHomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
      } else if (data) {
        setProducts(data);
        const uniqueCategories = [
          "Tất cả",
          ...new Set(data.map((p) => p.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const filteredProducts =
    selectedCategory === "Tất cả"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const renderMenu = () => {
    if (loading) {
      return (
        <ActivityIndicator size="large" color="#ED1C24" style={{ marginTop: 20 }} />
      );
    }

    if (filteredProducts.length === 0) {
      return <Text style={styles.placeholderText}>Không có sản phẩm nào.</Text>;
    }

    return (
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => <ProductCard product={item} />}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false} // Let the parent ScrollView handle scrolling
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={["#161616", "rgba(22, 22, 22, 0)"]}
            style={styles.gradient}
          >
            <View style={styles.topBar}>
              <Image
                source={{
                  uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/seeq2pxu_expires_30_days.png",
                }}
                resizeMode={"stretch"}
                style={styles.logo}
              />
              <Image
                source={{
                  uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/s73of7zs_expires_30_days.png",
                }}
                resizeMode={"stretch"}
                style={styles.menuIcons}
              />
            </View>
            <View style={styles.locationBar}>
              <View>
                <Text style={styles.locationLabel}>Location</Text>
                <View style={styles.locationDetails}>
                  <Image
                    source={{
                      uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/w3g57b4u_expires_30_days.png",
                    }}
                    resizeMode={"stretch"}
                    style={styles.locationIcon}
                  />
                  <Text style={styles.locationText}>Bali, Indonesia</Text>
                  <Image
                    source={{
                      uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/aywv6hho_expires_30_days.png",
                    }}
                    resizeMode={"stretch"}
                    style={styles.locationIcon}
                  />
                </View>
              </View>
              <Image
                source={{
                  uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/dssp8ljt_expires_30_days.png",
                }}
                resizeMode={"stretch"}
                style={styles.notificationIcon}
              />
            </View>
          </LinearGradient>

          <View style={styles.promoSection}>
            <View style={styles.promoTextContainer}>
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
            <Image
              source={{
                uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/ymq9lokj_expires_30_days.png",
              }}
              resizeMode={"stretch"}
              style={styles.promoImage}
            />
          </View>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Thực đơn của chúng tôi</Text>

          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContainer}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category &&
                      styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category &&
                        styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {renderMenu()}
        </View>
      </ScrollView>
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
    backgroundColor: "#EFEFEF",
  },
  headerContainer: {
    backgroundColor: "#ED1C24",
    paddingBottom: 20,
    marginBottom: 20,
  },
  gradient: {
    paddingTop: 16,
    paddingBottom: 80,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 32,
    marginBottom: 21,
  },
  logo: {
    width: 54,
    height: 21,
  },
  menuIcons: {
    width: 69,
    height: 14,
  },
  locationBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
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
  locationIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
  },
  locationText: {
    color: "#FAFAFA",
    fontSize: 14,
    marginRight: 8,
  },
  notificationIcon: {
    width: 28,
    height: 28,
  },
  promoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: -60,
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    color: "#FAFAFA",
    fontSize: 28,
    fontWeight: "bold",
    width: "90%",
    marginBottom: 20,
  },
  orderButton: {
    backgroundColor: "#FF6810",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: "flex-start",
  },
  orderButtonText: {
    color: "#FAFAFA",
    fontSize: 14,
    fontWeight: "bold",
  },
  promoImage: {
    width: 100,
    height: 100,
    marginTop: -20,
  },
  menuContainer: {
    paddingHorizontal: 16,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginTop: 20,
  },
  categoryContainer: {
    paddingBottom: 20,
  },
  categoryButton: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  categoryButtonActive: {
    backgroundColor: "#ED1C24",
    borderColor: "#ED1C24",
  },
  categoryText: {
    color: "#333",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#FFF",
  },
});