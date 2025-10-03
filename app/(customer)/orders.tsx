import React, { useState, useMemo, useEffect } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import LocationCard from '@/src/components/LocationCard';
import { Location } from '@/types';
import { supabase } from "@/src/integrations/supabase/client";

export default function LocationsScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLocations = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('locations')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching locations:', error);
            } else {
                setLocations(data || []);
            }
            setLoading(false);
        };

        fetchLocations();
    }, []);

    const filteredLocations = useMemo(() => {
        if (!searchQuery) {
            return locations;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return locations.filter(location => 
            location.name.toLowerCase().includes(lowercasedQuery) || 
            location.address.toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery, locations]);

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#73509c" />
            </SafeAreaView>
        );
    }

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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
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