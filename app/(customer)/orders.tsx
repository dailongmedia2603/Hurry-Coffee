import React, { useState, useMemo } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import LocationCard from '@/src/components/LocationCard';
import { Location } from '@/types';

const MOCK_LOCATIONS: Location[] = [
  {
    id: 'LOC001',
    name: 'Hurry Coffee - Quận 1',
    address: '123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM',
    image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop',
    distance: '2.5 km',
    opening_hours: '7:00 - 22:00',
  },
  {
    id: 'LOC002',
    name: 'Hurry Coffee - Quận 3',
    address: '456 Võ Văn Tần, Phường 5, Quận 3, TP.HCM',
    image_url: 'https://images.unsplash.com/photo-1511920183353-3c7c95a5742c?q=80&w=1974&auto=format&fit=crop',
    distance: '4.1 km',
    opening_hours: '6:30 - 22:30',
  },
  {
    id: 'LOC003',
    name: 'Hurry Coffee - Gò Vấp',
    address: '789 Quang Trung, Phường 10, Gò Vấp, TP.HCM',
    image_url: 'https://images.unsplash.com/photo-1525896523256-314f24a78705?q=80&w=2070&auto=format&fit=crop',
    distance: '8.9 km',
    opening_hours: '7:00 - 23:00',
  },
];

export default function LocationsScreen() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLocations = useMemo(() => {
        if (!searchQuery) {
            return MOCK_LOCATIONS;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return MOCK_LOCATIONS.filter(location => 
            location.name.toLowerCase().includes(lowercasedQuery) || 
            location.address.toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.headerContainer}>
				<Text style={styles.headerTitle}>Hệ thống cửa hàng</Text>
			</View>
			<View style={styles.filtersContainer}>
				<View style={styles.searchBar}>
					<Ionicons name="search" size={20} color="#989898" style={{marginRight: 12}} />
					<TextInput 
						placeholder="Tìm kiếm cửa hàng..."
						style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
					/>
				</View>
				<TouchableOpacity style={styles.filterButton}>
					<Ionicons name="map-outline" size={24} color="#333" />
				</TouchableOpacity>
			</View>
			<FlatList
				data={filteredLocations}
				renderItem={({ item }) => <LocationCard location={item} />}
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