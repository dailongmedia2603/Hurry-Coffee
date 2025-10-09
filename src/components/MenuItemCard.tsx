import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Product } from '@/types';
import { formatPrice } from '@/src/utils/formatters';
import { Link } from 'expo-router';

const MenuItemCard = ({ product, style }: { product: Product, style?: StyleProp<ViewStyle> }) => {
    const imageUrl = product.image_url;

    return (
        <Link href={`/(customer)/menu/${product.id}`} asChild>
            <Pressable style={[styles.card, style]}>
                <Image
                    source={imageUrl ? { uri: imageUrl } : require('@/assets/images/placeholder.png')}
                    style={styles.image}
                    resizeMode="cover"
                />
                <View style={styles.infoContainer}>
                    <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
                    <Text style={styles.price}>{formatPrice(product.price)}</Text>
                </View>
            </Pressable>
        </Link>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        width: '48%',
        marginBottom: 15,
    },
    image: {
        width: '100%',
        aspectRatio: 1,
    },
    infoContainer: {
        padding: 10,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
    },
    price: {
        fontSize: 14,
        color: '#00C853',
        fontWeight: 'bold',
    },
});

export default MenuItemCard;