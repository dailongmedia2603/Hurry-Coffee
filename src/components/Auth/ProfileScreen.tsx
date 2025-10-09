import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { UserAddress } from '@/types';
import { formatDisplayPhone } from '@/src/utils/formatters';

const ProfileScreen = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;
      setLoadingAddresses(true);
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setAddresses(data);
      }
      setLoadingAddresses(false);
    };

    if (user) {
        fetchAddresses();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;
    const { error } = await supabase.rpc('set_default_address', {
      p_user_id: user.id,
      p_address_id: addressId,
    });

    if (error) {
      Alert.alert('Lỗi', 'Không thể đặt làm địa chỉ mặc định.');
    } else {
      setAddresses(prev =>
        prev.map(addr => ({
          ...addr,
          is_default: addr.id === addressId,
        }))
      );
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    Alert.alert(
      "Xác nhận xoá",
      "Bạn có chắc chắn muốn xoá địa chỉ này?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from('user_addresses').delete().eq('id', addressId);
            if (error) {
              Alert.alert('Lỗi', 'Không thể xoá địa chỉ.');
            } else {
              setAddresses(prev => prev.filter(addr => addr.id !== addressId));
            }
          }
        }
      ]
    );
  };

  if (authLoading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  if (!user || !profile) {
    return (
      <View style={styles.centered}>
        <Text>Vui lòng đăng nhập để xem thông tin.</Text>
        <Pressable onPress={() => router.replace('/(auth)/sign-in')} style={styles.button}>
          <Text style={styles.buttonText}>Đăng nhập</Text>
        </Pressable>
      </View>
    );
  }

  const displayName = profile.full_name || user.email;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Tài khoản của tôi' }} />
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person-circle-outline" size={80} color="#555" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{formatDisplayPhone(user?.phone || '')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Địa chỉ đã lưu</Text>
          <Pressable onPress={() => router.push('/address')}>
            <Text style={styles.addButton}>+ Thêm mới</Text>
          </Pressable>
        </View>
        {loadingAddresses ? <ActivityIndicator /> : (
          addresses.length > 0 ? (
            addresses.map(addr => (
              <View key={addr.id} style={styles.addressCard}>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressName}>{addr.name}</Text>
                  <Text style={styles.addressText}>{addr.address}</Text>
                  {addr.is_default && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Mặc định</Text></View>}
                </View>
                <View style={styles.addressActions}>
                  {!addr.is_default && (
                    <Pressable onPress={() => handleSetDefault(addr.id)} style={styles.actionButton}>
                      <Ionicons name="checkmark-circle-outline" size={22} color="#007AFF" />
                    </Pressable>
                  )}
                  <Pressable onPress={() => handleDeleteAddress(addr.id)} style={styles.actionButton}>
                    <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Bạn chưa có địa chỉ nào.</Text>
          )
        )}
      </View>

      <Pressable onPress={handleSignOut} style={styles.signOutButton}>
        <Text style={styles.signOutButtonText}>Đăng xuất</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  avatar: { marginRight: 20 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: 'bold' },
  profileEmail: { fontSize: 16, color: '#666', marginTop: 4 },
  section: { backgroundColor: 'white', marginTop: 10, padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  addButton: { color: '#007AFF', fontSize: 16 },
  addressCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  addressInfo: { flex: 1 },
  addressName: { fontSize: 16, fontWeight: '500' },
  addressText: { fontSize: 14, color: '#666', marginTop: 4 },
  defaultBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginTop: 5 },
  defaultBadgeText: { color: '#00C853', fontSize: 12, fontWeight: 'bold' },
  addressActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { padding: 5, marginLeft: 10 },
  emptyText: { color: '#888', textAlign: 'center', paddingVertical: 20 },
  signOutButton: { backgroundColor: '#FFEBEE', margin: 20, padding: 15, borderRadius: 10, alignItems: 'center' },
  signOutButtonText: { color: '#D50000', fontSize: 16, fontWeight: 'bold' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginTop: 20 },
  buttonText: { color: 'white', fontWeight: 'bold' },
});

export default ProfileScreen;