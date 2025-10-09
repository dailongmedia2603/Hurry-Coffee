import React, { useState, useMemo, useCallback } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import LocationCard from '@/src/components/LocationCard';
import { Location } from '@/types';
import { supabase } from "@/src/integrations/supabase/client";
import { useAuth } from "@/src/context/AuthContext";
import { useFocusEffect } from "expo-router";

export default function LocationsScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchLocations = useCallback(async () => {
        setLoading(true);

        let defaultAddress: { latitude: number | null, longitude: number | null } | null = null;

        if (user) {
            const { data: addressData } = await supabase
                .from('user_addresses')
                .select('latitude, longitude')
                .eq('user_id', user.id)
                .eq('is_default', true)
                .single();
            
            if (addressData && addressData.latitude && addressData.longitude) {
                defaultAddress = addressData;
            }
        }

        let data, error;

        if (defaultAddress) {
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_locations_with_distance', {
                p_lat: defaultAddress.latitude,
                p_lon: defaultAddress.longitude,
            });
            data = rpcData;
            error = rpcError;
        } else {
            const { data: selectData, error: selectError } = await supabase
                .from('locations')
                .select('*')
                .order('created_at', { ascending: true });
            data = selectData;
            error = selectError;
        }

        if (error) {
            console.error('Error fetching locations:', error);
        } else {
            setLocations(data || []);
        }
        setLoading(false);
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchLocations();
        }, [fetchLocations])
    );

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
	},
	searchInput: {
		color: "#333",
		fontSize: 14,
		flex: 1,
	},
	listContainer: {
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 100,
	},
});