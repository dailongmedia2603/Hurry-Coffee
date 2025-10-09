import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { useAuth } from '@/src/providers/AuthProvider';
import { useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { Location } from '@/types';

const LocationsScreen = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    let fetchedLocations: Location[] | null = null;
    let fetchError: any = null;

    if (!user) {
      const { data, error } = await supabase.from('locations').select('*');
      fetchedLocations = data;
      fetchError = error;
    } else {
      const { data: defaultAddress } = await supabase
        .from('user_addresses')
        .select('latitude, longitude')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (defaultAddress && defaultAddress.latitude && defaultAddress.longitude) {
        const { data, error } = await supabase.rpc('get_locations_with_distance', {
          p_lat: defaultAddress.latitude,
          p_lon: defaultAddress.longitude,
        });
        fetchedLocations = data;
        fetchError = error;
      } else {
        const { data, error } = await supabase.from('locations').select('*');
        fetchedLocations = data;
        fetchError = error;
      }
    }

    if (!fetchError && fetchedLocations) {
      setLocations(fetchedLocations.map(loc => ({ ...loc, distance: loc.distance ?? null })));
    }
    
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchLocations();
    }, [fetchLocations])
  );

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDirections = (mapsUrl: string | null) => {
    if (mapsUrl) {
      Linking.openURL(mapsUrl);
    }
  };

  const renderLocationCard = ({ item }: { item: Location }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image_url || undefined }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#888" />
          <Text style={styles.infoText}>{item.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#888" />
          <Text style={styles.infoText}>Mở cửa: {item.opening_hours}</Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.distanceContainer}>
            {item.distance !== null && item.distance !== undefined && (
              <>
                <Ionicons name="navigate-circle-outline" size={16} color="#4A4A4A" />
                <Text style={styles.distanceText}>
                  {item.distance >= 1000
                    ? `${(item.distance / 1000).toFixed(1)} km`
                    : `${Math.round(item.distance)} m`}
                </Text>
              </>
            )}
          </View>
          <TouchableOpacity style={styles.directionsButton} onPress={() => handleDirections(item.google_maps_url)}>
            <Text style={styles.directionsButtonText}>Chỉ đường</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Hệ thống cửa hàng</Text>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm cửa hàng..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#888"
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#5D3E8E" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredLocations}
          renderItem={renderLocationCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FA',
  },
  headerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#EEE',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4A4A4A',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  distanceText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  directionsButton: {
    backgroundColor: '#5D3E8E',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  directionsButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default LocationsScreen;