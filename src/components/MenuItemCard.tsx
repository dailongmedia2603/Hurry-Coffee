import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Product } from "../../types";
import { Ionicons } from "@expo/vector-icons";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

const MenuItemCard = ({ product }: { product: Product }) => {
  const oldPrice = product.price * 1.5; // Dummy old price

  return (
    <View style={styles.card}>
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
        <Text style={styles.oldPrice}>{formatPrice(oldPrice)}</Text>
      </View>
    </View>
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
    color: "#ED1C24",
  },
  oldPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
});

export default MenuItemCard;