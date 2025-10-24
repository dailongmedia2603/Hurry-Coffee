import React, { useState, useCallback, useEffect, useMemo } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import OrderCard from '@/src/components/OrderCard';
import { Order, Location, OrderStatus } from '@/types';
import { supabase } from "@/src/integrations/supabase/client";
import { useFocusEffect } from "expo-router";
import { storage } from "@/src/utils/storage";
import { useAuth } from "@/src/context/AuthContext";
import DateTimePicker from '@react-native-community/datetimepicker';

const ANONYMOUS_ID_KEY = 'anonymous_device_id';

type OrderWithDetails = Order & {
    restaurant_name: string;
    restaurant_image_url: string;
    items_count: number;
    order_type: 'delivery' | 'pickup';
    locations: Location | null;
};

const STATUS_OPTIONS: { label: string; value: OrderStatus | 'all' }[] = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Đang xử lý', value: 'Đang xử lý' },
    { label: 'Đang làm', value: 'Đang làm' },
    { label: 'Đang giao', value: 'Đang giao' },
    { label: 'Sẵn sàng', value: 'Sẵn sàng' },
    { label: 'Hoàn thành', value: 'Hoàn thành' },
    { label: 'Đã hủy', value: 'Đã hủy' },
];

export default function MyOrdersScreen() {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

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

            if (selectedStatus !== 'all') {
                query = query.eq('status', selectedStatus);
            }

            if (selectedDate) {
                const from = selectedDate.toISOString().split('T')[0];
                const to = new Date(selectedDate);
                to.setDate(to.getDate() + 1);
                const toString = to.toISOString().split('T')[0];
                query = query.gte('created_at', from).lt('created_at', toString);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            const ordersWithDetails = data.map(order => {
                const items_count = order.order_items[0]?.count || 0;
                let restaurant_name = 'Giao tận nơi';
                let restaurant_image_url = 'local_delivery_icon';

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
    }, [user, selectedStatus, selectedDate]);

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

    const filteredOrders = useMemo(() => {
        if (!searchQuery) {
            return orders;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return orders.filter(order => 
            order.id.substring(0, 8).toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery, orders]);

    const onDateChange = (event: any, selectedDateValue?: Date) => {
        setDatePickerVisible(Platform.OS === 'ios');
        if (selectedDateValue) {
            setSelectedDate(selectedDateValue);
        }
    };

    const clearFilters = () => {
        setSelectedStatus('all');
        setSelectedDate(null);
        setSearchQuery('');
    }

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.headerContainer}>
				<Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
			</View>
			<View style={styles.filtersContainer}>
				<View style={styles.searchBar}>
					<Ionicons name="search" size={20} color="#989898" style={{marginRight: 12}} />
					<TextInput 
						placeholder="Tìm theo mã đơn hàng..."
						style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
					/>
				</View>
				<TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
					<Ionicons name="options-outline" size={24} color="#333" />
				</TouchableOpacity>
			</View>

            {showFilters && (
                <View style={styles.filterPanel}>
                    <Text style={styles.filterSectionTitle}>Trạng thái</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusFilterContainer}>
                        {STATUS_OPTIONS.map(option => (
                            <TouchableOpacity
                                key={option.value}
                                style={[styles.statusButton, selectedStatus === option.value && styles.statusButtonActive]}
                                onPress={() => setSelectedStatus(option.value)}
                            >
                                <Text style={[styles.statusButtonText, selectedStatus === option.value && styles.statusButtonTextActive]}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.filterSectionTitle}>Thời gian</Text>
                    <View style={styles.dateFilterContainer}>
                        <TouchableOpacity style={styles.datePickerButton} onPress={() => setDatePickerVisible(true)}>
                            <Ionicons name="calendar-outline" size={20} color="#666" />
                            <Text style={styles.datePickerButtonText}>
                                {selectedDate ? selectedDate.toLocaleDateString('vi-VN') : 'Chọn ngày'}
                            </Text>
                        </TouchableOpacity>
                        {selectedDate && (
                            <TouchableOpacity onPress={() => setSelectedDate(null)}>
                                <Ionicons name="close-circle" size={24} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilters}>
                        <Text style={styles.clearFilterButtonText}>Xoá bộ lọc</Text>
                    </TouchableOpacity>
                </View>
            )}

            {isDatePickerVisible && (
                <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}

            {loading ? (
                <ActivityIndicator size="large" color="#73509c" style={{ marginTop: 20 }} />
            ) : filteredOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Không tìm thấy đơn hàng nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
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
    filterPanel: {
        backgroundColor: '#fff',
        padding: 16,
        paddingTop: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    statusFilterContainer: {
        paddingBottom: 12,
    },
    statusButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        marginRight: 10,
    },
    statusButtonActive: {
        backgroundColor: '#73509c',
    },
    statusButtonText: {
        color: '#374151',
        fontWeight: '500',
    },
    statusButtonTextActive: {
        color: '#fff',
    },
    dateFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    datePickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        padding: 12,
        borderRadius: 8,
        marginRight: 10,
    },
    datePickerButtonText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    clearFilterButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    clearFilterButtonText: {
        color: '#73509c',
        fontWeight: 'bold',
    }
});