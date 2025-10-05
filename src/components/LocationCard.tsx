import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Location } from '@/types';
import * as Linking from 'expo-linking';

const LocationCard = ({ location }: { location: Location }) => {
    const handleDirections = () => {
        if (location.google_maps_url) {
            Linking.openURL(location.google_maps_url);
        } else {
            Alert.alert("Không có chỉ đường", "Địa chỉ này chưa có thông tin chỉ đường trên bản đồ.");
        }
    };

    return (
        <TouchableOpacity style={styles.card}>
            <Image source={{ uri: location.image_url }} style={styles.locationImage} />
            <View style={styles.cardContent}>
                <Text style={styles.locationName} numberOfLines={1}>{location.name}</Text>
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color="#666" style={styles.icon} />
                    <Text style={styles.infoText} numberOfLines={1}>{location.address}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={14} color="#666" style={styles.icon} />
                    <Text style={styles.infoText}>Mở cửa: {location.opening_hours}</Text>
                </View>
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.directionsButton} onPress={handleDirections}>
                        <Text style={styles.directionsButtonText}>Chỉ đường</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    locationImage: {
        width: '100%',
        height: 150,
    },
    cardContent: {
        padding: 12,
    },
    locationName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    icon: {
        marginRight: 6,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
    },
    directionsButton: {
        backgroundColor: '#73509c',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    directionsButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default LocationCard;