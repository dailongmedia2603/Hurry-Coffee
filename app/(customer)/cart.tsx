import React, { useState, useCallback } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import OrderCard from '@/src/components/OrderCard';
import { Order } from '@/types';
import { supabase } from "@/src/integrations/supabase/client";
import { useFocusEffect } from "expo-router";

// This is a temporary type extension until we create a proper view in Supabase
type OrderWithDetails = Order & {
    restaurant_name: string;
    restaurant_image_url: string;
    items_count: number;
};

export default function MyOrdersScreen() {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setOrders([]);
                return;
            }

            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items(count)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const ordersWithDetails = data.map(order => ({
                ...order,
                // These are mock details for now. In a real app, you'd join tables or fetch this info.
                restaurant_name: 'Nhà hàng Hurry Coffee',
                restaurant_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto.format&fit=crop',
                items_count: order.order_items[0]?.count || 0,
            }));

            setOrders(ordersWithDetails);

        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.headerContainer}>
				<Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
			</View>
			<View style={styles.filtersContainer}>
				<View style={styles.searchBar}>
					<Ionicons name="search" size={20} color="#989898" style={{marginRight: 12}} />
					<TextInput 
						placeholder="Tìm kiếm đơn hàng..."
						style={styles.searchInput}
					/>
				</View>
				<TouchableOpacity style={styles.filterButton}>
					<Ionicons name="options-outline" size={24} color="#333" />
				</TouchableOpacity>
			</View>
            {loading ? (
                <ActivityIndicator size="large" color="#73509c" style={{ marginTop: 20 }} />
            ) : orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Bạn chưa có đơn hàng nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={({ item }) => <OrderCard order={item} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    onRefresh={fetchOrders}
                    refreshing={loading}
                />
            )}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
	headerContainer: {
		backgroundColor: '#FFFFFF',
		paddingVertical: 20,
		paddingHorizontal: 16,
		alignItems: 'center',
		borderBottomWidth: 1,
		borderBottomColor: '#E0E0E0',
	},
	headerTitle: {
		color: "#161616",
		fontSize: 20,
		fontWeight: "bold",
	},
	filtersContainer: {
		flexDirection: 'row',
		padding: 16,
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
	},
	searchBar: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FAFAFA",
		borderColor: "#DCDCDC",
		borderRadius: 30,
		borderWidth: 1,
		paddingHorizontal: 16,
		height: 50,
		marginRight: 12,
	},
	searchInput: {
		color: "#333",
		fontSize: 14,
		flex: 1,
	},
	filterButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: '#FAFAFA',
		borderColor: '#DCDCDC',
		borderWidth: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	listContainer: {
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 100,
	},
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
});