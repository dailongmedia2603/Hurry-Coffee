import { View, Text, FlatList, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import LocationCard from '@/src/components/LocationCard';
import { Location } from '@/types';
import { supabase } from "@/src/integrations/supabase/client";
import { useDebounce } from 'use-debounce';

const LocationsScreen = () => {
	const [locations, setLocations] = useState<Location[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedQuery] = useDebounce(searchQuery, 300);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);


	useEffect(() => {
		const fetchLocations = async () => {
			setLoading(true);
			let query = supabase.from('locations').select('*');
			if (debouncedQuery) {
				query = query.ilike('name', `%${debouncedQuery}%`);
			}
			const { data, error } = await query.order('name', { ascending: true });

			if (data) {
				setLocations(data);
			}
			setLoading(false);
		};

		fetchLocations();
	}, [debouncedQuery]);

	const filteredLocations = locations.filter(location =>
		location.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	if (loading) {
		return <ActivityIndicator style={styles.centered} size="large" />;
	}

	return (
		<View style={styles.container}>
			<Stack.Screen options={{ title: 'Chọn cửa hàng' }} />
			<TextInput
				style={styles.searchInput}
				placeholder="Tìm kiếm cửa hàng..."
				value={searchQuery}
				onChangeText={setSearchQuery}
			/>
			<FlatList
				data={filteredLocations}
				renderItem={({ item }) => <LocationCard location={item} onPress={() => setSelectedLocation(item)} />}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContainer}
				ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy cửa hàng nào.</Text>}
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
	searchInput: {
		backgroundColor: 'white',
		padding: 15,
		margin: 10,
		borderRadius: 10,
		fontSize: 16,
	},
	listContainer: {
		paddingHorizontal: 10,
	},
	emptyText: {
		textAlign: 'center',
		marginTop: 50,
		fontSize: 16,
		color: '#666',
	},
});

export default LocationsScreen;