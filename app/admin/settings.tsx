import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { useAuth } from '@/src/context/AuthContext';
import { useScreenSize } from '@/src/hooks/useScreenSize';

const PROFILE_FEATURE_KEY = 'feature_profile_enabled';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { isDesktop } = useScreenSize();

  // State cho tính năng hồ sơ
  const [isProfileFeatureEnabled, setIsProfileFeatureEnabled] = useState(true);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [savingFeatures, setSavingFeatures] = useState(false);

  const fetchSettings = async () => {
    setLoadingFeatures(true);

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .eq('key', PROFILE_FEATURE_KEY);
    
    if (error) {
      Alert.alert('Lỗi', 'Không thể tải cài đặt ứng dụng.');
    } else {
      const profileSetting = data.find(s => s.key === PROFILE_FEATURE_KEY);
      // Mặc định là true nếu không có cài đặt trong DB
      setIsProfileFeatureEnabled(profileSetting ? profileSetting.value === 'true' : true);
    }

    setLoadingFeatures(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleProfileFeature = async (newValue: boolean) => {
    setSavingFeatures(true);
    setIsProfileFeatureEnabled(newValue);

    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: PROFILE_FEATURE_KEY, value: String(newValue) });

    if (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt. Vui lòng thử lại.');
      setIsProfileFeatureEnabled(!newValue);
    }
    setSavingFeatures(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cài đặt ứng dụng</Text>
        {Platform.OS !== 'web' && !isDesktop && (
          <TouchableOpacity onPress={signOut}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView>
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>Quản lý tính năng</Text>
          <Text style={styles.subtitle}>Bật hoặc tắt các tính năng cho người dùng cuối.</Text>

          <View style={styles.featureRow}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureLabel}>Hồ sơ & Xác thực SĐT</Text>
              <Text style={styles.featureDescription}>Cho phép người dùng đăng nhập, quản lý hồ sơ và xác thực số điện thoại sau khi đặt hàng.</Text>
            </View>
            {loadingFeatures ? <ActivityIndicator color="#73509c" /> : (
              <Switch
                trackColor={{ false: "#d1d5db", true: "#a78bfa" }}
                thumbColor={isProfileFeatureEnabled ? "#73509c" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={handleToggleProfileFeature}
                value={isProfileFeatureEnabled}
                disabled={savingFeatures}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  contentWrapper: {
    maxWidth: 960,
    width: '100%',
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  featureInfo: { flex: 1, marginRight: 16 },
  featureLabel: { fontSize: 16, fontWeight: '500', color: '#111827' },
  featureDescription: { fontSize: 13, color: '#6b7280', marginTop: 4 },
});