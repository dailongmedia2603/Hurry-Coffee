import React from "react";
import { SafeAreaView, View, ScrollView, Image, Text, TouchableOpacity, StyleSheet, TextInput, FlatList } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import OrderCard from '@/src/components/OrderCard';
import { Order } from '@/types';

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD001',
    created_at: '2024-10-03T10:00:00Z',
    status: 'Đang giao',
    total: 150000,
    items_count: 3,
    restaurant_name: 'Nhà hàng ABC',
    restaurant_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop',
  },
  {
    id: 'ORD002',
    created_at: '2024-10-02T18:30:00Z',
    status: 'Hoàn thành',
    total: 250000,
    items_count: 5,
    restaurant_name: 'Quán ăn XYZ',
    restaurant_image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'ORD003',
    created_at: '2024-10-03T11:00:00Z',
    status: 'Đang xử lý',
    total: 95000,
    items_count: 2,
    restaurant_name: 'Cà phê The Coffee House',
    restaurant_image_url: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1974&auto=format&fit=crop',
  },
  {
    id: 'ORD004',
    created_at: '2024-09-30T12:00:00Z',
    status: 'Đã hủy',
    total: 120000,
    items_count: 2,
    restaurant_name: 'Nhà hàng ABC',
    restaurant_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop',
  },
];

export default function MyOrdersScreen() {
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
			<FlatList
				data={MOCK_ORDERS}
				renderItem={({ item }) => <OrderCard order={item} />}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContainer}
				showsVerticalScrollIndicator={false}
			/>
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
});