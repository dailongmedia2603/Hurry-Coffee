import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/integrations/supabase/client';

export default function StaffProfileScreen() {
  const { user, profile } = useAuth();
  const [locationName, setLocationName] = useState<string | null>(null);
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
          setLocationName('Không tìm thấy địa điểm');
        } else if (data) {
          const names = data.map(item => (item.locations as any)?.name).filter(Boolean).join(', ');
          setLocationName(names || null);
        }
        setLoadingLocation(false);
      } else {
        setLocationName(null);
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
      <View style={styles.container}>
        <View style={styles.profileHeader}>
          <Ionicons name="person-circle-outline" size={100} color="#73509c" />
          <Text style={styles.profileName}>{profile.full_name || 'Nhân viên'}</Text>
          <Text style={styles.profileEmail}>{user.email || user.phone}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{profile.role === 'staff' ? 'Nhân viên' : 'Admin'}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="storefront-outline" size={24} color="#73509c" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Địa điểm làm việc</Text>
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#73509c" />
              ) : (
                <Text style={styles.infoValue}>{locationName || 'Chưa được gán'}</Text>
              )}
            </View>
          </View>
        </View>
      </View>
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});