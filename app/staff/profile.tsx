import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/integrations/supabase/client';

export default function StaffProfileScreen() {
  const { user, profile } = useAuth();
  const [locationNames, setLocationNames] = useState<string[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      if (user) {
        setLoadingLocation(true);
        const { data, error } = await supabase
          .from('staff_locations')
          .select('locations(name)')
          .eq('staff_id', user.id);
        
        if (error) {
          console.error("Error fetching locations:", error);
          setLocationNames([]);
        } else if (data) {
          const names = data
            .map(item => {
              if (item.locations && typeof item.locations === 'object' && 'name' in item.locations) {
                return (item.locations as { name: string }).name;
              }
              return null;
            })
            .filter((name): name is string => name !== null);
          setLocationNames(names);
        }
        setLoadingLocation(false);
      } else {
        setLocationNames([]);
      }
    };

    if (user) {
      fetchLocations();
    }
  }, [user]);

  if (!user || !profile) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#73509c" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.profileHeader}>
          <Ionicons name="person-circle-outline" size={100} color="#73509c" />
          <Text style={styles.profileName}>{profile.full_name || 'Nhân viên'}</Text>
          <Text style={styles.profileEmail}>{user.email || user.phone}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{profile.role === 'staff' ? 'Nhân viên' : 'Admin'}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Địa điểm làm việc</Text>
          {loadingLocation ? (
            <ActivityIndicator size="small" color="#73509c" style={{ marginTop: 8 }} />
          ) : locationNames.length > 0 ? (
            <View>
              {locationNames.map((name, index) => (
                <View key={index} style={styles.locationChip}>
                  <Ionicons name="storefront-outline" size={16} color="#4b5563" style={{ marginRight: 8 }} />
                  <Text style={styles.locationChipText} numberOfLines={1}>{name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noLocationText}>Chưa được gán địa điểm</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f3f4f6" },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  profileHeader: { 
    alignItems: "center", 
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  profileName: { 
    color: "#161616", 
    fontSize: 22, 
    fontWeight: "bold", 
    marginTop: 16,
    marginBottom: 4 
  },
  profileEmail: { 
    color: "#7C7C7C", 
    fontSize: 16,
    marginBottom: 16,
  },
  roleBadge: {
    backgroundColor: '#E8E4F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#73509c',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  locationChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  noLocationText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
});