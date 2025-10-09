import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Location } from '@/types';

type LocationCardProps = {
    location: Location;
    onPress: () => void;
};

const LocationCard = ({ location, onPress }: LocationCardProps) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={{ uri: location.image_url || undefined }} style={styles.locationImage} />
            <View style={styles.cardContent}>
                <Text style={styles.locationName}>{location.name}</Text>
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.locationAddress}>{location.address}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    locationImage: {
        width: '100%',
        height: 140,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    cardContent: {
        padding: 12,
    },
    locationName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationAddress: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
        flex: 1,
    },
});

export default LocationCard;