import React from "react";
import { View, Text, Image, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { Product } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const MenuItemCard = ({ product, style }: { product: Product, style?: ViewStyle }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/product/${product.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.card, style]}>
      <Image
        source={{ uri: product.image_url || "https://via.placeholder.com/150" }}
        style={styles.image}
      />
      <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
      <Text style={styles.description} numberOfLines={1}>{product.description || "Resto Mbok Ijah"}</Text>
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={16} color="#FFC107" />
        <Text style={styles.ratingText}>4.9 (115 review)</Text>
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        {product.original_price && product.original_price > product.price ? (
          <Text style={styles.oldPrice}>{formatPrice(product.original_price)}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    width: 160,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F0F0F0',
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  description: {
    fontSize: 12,
    color: "#666",
    marginVertical: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#666",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#73509c",
  },
  oldPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
});

export default MenuItemCard;