import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, ScrollView, Image, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/src/integrations/supabase/client';
import { UserAddress } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';

const ProfileMenuItem = ({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap, label: string, onPress: () => void }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemContent}>
      <Ionicons name={icon} size={24} color="#161616" style={styles.menuIcon} />
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward-outline" size={20} color="#666" />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { user, profile, signOut, refetchProfile } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) {
        setAddressLoading(false);
        return;
      }
      setAddressLoading(true);
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching addresses for profile:', error);
      } else {
        setAddresses(data || []);
      }
      setAddressLoading(false);
    };

    fetchAddresses();
  }, [user]);

  const handleAvatarChange = async () => {
    if (!user) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Chúng tôi cần quyền truy cập thư viện ảnh để bạn có thể chọn ảnh đại diện.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const image = result.assets[0];
    if (!image.base64) {
      return;
    }

    setUploading(true);
    const fileExt = image.uri.split('.').pop();
    const filePath = `${user.id}/${new Date().getTime()}.${fileExt}`;
    const contentType = image.mimeType ?? 'image/jpeg';

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(image.base64), { contentType, upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refetchProfile();
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      Alert.alert('Lỗi', error.message || 'Không thể tải lên ảnh đại diện.');
    } finally {
      setUploading(false);
    }
  };

  const displayName = addresses[0]?.name || profile?.full_name || 'Tên người dùng';

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#f5e9d3', '#ffffff']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.3]}
        style={styles.gradient}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
        </View>

        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleAvatarChange} disabled={uploading}>
            <Image
              source={{ uri: profile?.avatar_url || 'https://cdn.icon-icons.com/icons2/1378/PNG/512/avatardefault_92824.png' }}
              style={styles.avatar}
            />
            {uploading ? (
              <ActivityIndicator style={styles.avatarOverlay} size="large" color="#fff" />
            ) : (
              <View style={styles.editIconContainer}>
                <Ionicons name="pencil" size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{user?.phone}</Text>
        </View>

        <View style={styles.menuContainer}>
          <ProfileMenuItem icon="location-outline" label="Địa chỉ nhận nước" onPress={() => router.push('/(customer)/address')} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={24} color="#D50000" />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  scrollView: { flex: 1, backgroundColor: "transparent" },
  scrollContentContainer: { paddingBottom: 120 },
  header: { alignItems: "center", backgroundColor: "transparent", paddingVertical: 20, marginBottom: 10 },
  headerTitle: { color: "#161616", fontSize: 20, fontWeight: "bold" },
  profileHeader: { alignItems: "center", marginBottom: 32 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16, borderWidth: 3, borderColor: '#fff' },
  avatarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 50 },
  editIconContainer: { position: 'absolute', bottom: 16, right: 0, backgroundColor: '#73509c', padding: 8, borderRadius: 16, borderWidth: 2, borderColor: '#fff' },
  profileName: { color: "#161616", fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  profileEmail: { color: "#7C7C7C", fontSize: 16 },
  menuContainer: { marginHorizontal: 16 },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", borderColor: "#DCDCDC", borderRadius: 12, borderWidth: 1, paddingVertical: 18, paddingHorizontal: 16, marginBottom: 12 },
  menuItemContent: { flexDirection: "row", alignItems: "center" },
  menuIcon: { marginRight: 16 },
  menuLabel: { color: "#161616", fontSize: 16 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 16, marginTop: 24, padding: 16, backgroundColor: '#FFEBEE', borderRadius: 12 },
  logoutButtonText: { color: '#D50000', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});