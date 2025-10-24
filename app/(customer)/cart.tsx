import React, { useState, useCallback, useEffect } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import OrderCard from '@/src/components/OrderCard';
import { Order, Location } from '@/types';
import { supabase } from "@/src/integrations/supabase/client";
import { useFocusEffect } from "expo-router";
import { storage } from "@/src/utils/storage";
import { useAuth } from "@/src/context/AuthContext";

const ANONYMOUS_ID_KEY = 'anonymous_device_id';

type OrderWithDetails = Order & {
    restaurant_name: string;
    restaurant_image_url: string;
    items_count: number;
    order_type: 'delivery' | 'pickup';
    locations: Location | null;
};

export default function MyOrdersScreen() {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase.from('orders').select(`
                *,
                order_type,
                order_items!left(count),
                locations(*)
            `);

            if (user) {
                query = query.eq('user_id', user.id);
            } else {
                const anonymousId = await storage.getItem(ANONYMOUS_ID_KEY);
                if (anonymousId) {
                    query = query.eq('anonymous_device_id', anonymousId);
                } else {
                    setOrders([]);
                    setLoading(false);
                    return;
                }
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            const ordersWithDetails = data.map(order => {
                const items_count = order.order_items[0]?.count || 0;
                let restaurant_name = 'Giao tận nơi';
                let restaurant_image_url = 'local_delivery_icon'; // Khóa đặc biệt cho ảnh cục bộ

                if (order.order_type === 'pickup' && order.locations) {
                    restaurant_name = order.locations.name;
                    restaurant_image_url = order.locations.image_url;
                }

                return {
                    ...order,
                    restaurant_name,
                    restaurant_image_url,
                    items_count,
                };
            });

            setOrders(ordersWithDetails as OrderWithDetails[]);

        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    useEffect(() => {
        const channel = supabase
            .channel('public:orders')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders' },
                (payload) => {
                    setOrders((currentOrders) =>
                        currentOrders.map((order) => {
                            if (order.id === payload.new.id) {
                                return { ...order, status: payload.new.status };
                            }
                            return order;
                        })
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

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