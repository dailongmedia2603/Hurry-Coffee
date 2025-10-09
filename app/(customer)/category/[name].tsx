import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/src/integrations/supabase/client';
import { Product } from '@/types';
import MenuItemCard from '@/src/components/MenuItemCard';

const CategoryScreen = () => {
  const { name: categoryName } = useLocalSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!categoryName) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', categoryName);

      if (data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [categoryName]);

  if (loading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Phân loại: ${categoryName}` }} />
      <FlatList
        data={products}
        renderItem={({ item }) => <MenuItemCard product={item} />}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={<Text style={styles.emptyText}>Không có sản phẩm nào trong phân loại này.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 10,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
});

export default CategoryScreen;