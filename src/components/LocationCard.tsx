import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Location } from '@/types';
import * as Linking from 'expo-linking';

const LocationCard = ({ location, onPress }: { location: Location, onPress: () => void }) => {
    const handleDirections = () => {
        if (location.google_maps_url) {
            Linking.openURL(location.google_maps_url);
        }
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            {location.image_url ? (
                <Image source={{ uri: location.image_url }} style={styles.locationImage} />
            ) : (
                <View style={[styles.locationImage, styles.imagePlaceholder]}>
                    <Ionicons name="storefront-outline" size={40} color="#ccc" />
                </View>
            )}
            <View style={styles.cardContent}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationAddress} numberOfLines={2}>{location.address}</Text>
                {location.opening_hours && <Text style={styles.openingHours}>{location.opening_hours}</Text>}
                <TouchableOpacity style={styles.directionsButton} onPress={handleDirections}>
                    <Ionicons name="navigate-circle-outline" size={20} color="#007AFF" />
                    <Text style={styles.directionsText}>Chỉ đường</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        flexDirection: 'row',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    locationImage: {
        width: 100,
        height: '100%',
    },
    imagePlaceholder: {
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        padding: 10,
        flex: 1,
        justifyContent: 'center',
    },
    locationName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    locationAddress: {
        fontSize: 14,
        color: '#666',
        marginVertical: 4,
    },
    openingHours: {
        fontSize: 12,
        color: 'green',
    },
    directionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    directionsText: {
        marginLeft: 5,
        color: '#007AFF',
        fontWeight: 'bold',
    },
});

export default LocationCard;