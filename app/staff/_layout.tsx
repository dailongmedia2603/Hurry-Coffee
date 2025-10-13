import React, { useState, useEffect } from "react";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from "react-native";
import AdminLoginScreen from "@/src/components/admin/AdminLoginScreen";
import { storage } from "@/src/utils/storage";

const ACTIVE_COLOR = "#73509c";
const INACTIVE_COLOR = "#9ca3af";
const AUDIO_UNLOCKED_KEY = 'audio_unlocked';

const AudioUnlocker = ({ onUnlocked }: { onUnlocked: () => void }) => {
  const [unlocking, setUnlocking] = useState(false);

  const handleUnlock = () => {
    setUnlocking(true);
    // SỬA LỖI: Sử dụng require để bundler có thể tìm thấy file âm thanh
    const audio = new Audio(require('@/assets/sounds/codon.mp3'));
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Audio unlocked and played successfully.");
        })
        .catch(error => {
          console.error("Audio could not be unlocked or played:", error);
        })
        .finally(() => {
          onUnlocked();
        });
    } else {
      onUnlocked();
    }
  };

  return (
    <View style={styles.unlockContainer}>
      <Ionicons name="volume-high-outline" size={64} color="#73509c" />
      <Text style={styles.unlockTitle}>Bật thông báo âm thanh</Text>
      <Text style={styles.unlockText}>
        Nhấn "Sẵn sàng" để đảm bảo bạn nghe được chuông báo khi có đơn hàng mới.
      </Text>
      <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock} disabled={unlocking}>
        {unlocking ? <ActivityIndicator color="#fff" /> : <Text style={styles.unlockButtonText}>Sẵn sàng</Text>}
      </TouchableOpacity>
    </View>
  );
};

export default function StaffLayout() {
  const { session, profile, loading, signOut } = useAuth();
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [checkingStorage, setCheckingStorage] = useState(true);

  useEffect(() => {
    const checkAudioStatus = async () => {
      const status = await storage.getItem(AUDIO_UNLOCKED_KEY);
      if (status === 'true') {
        setAudioUnlocked(true);
      }
      setCheckingStorage(false);
    };
    checkAudioStatus();
  }, []);

  const handleAudioUnlocked = () => {
    storage.setItem(AUDIO_UNLOCKED_KEY, 'true');
    setAudioUnlocked(true);
  };

  if (loading || checkingStorage) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#73509c" /></View>;
  }

  if (!session) {
    return <AdminLoginScreen />;
  }

  if (!profile) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#73509c" /></View>;
  }

  if (profile.role !== 'staff') {
    return <Redirect href={profile.role === 'admin' ? '/admin' : '/(customer)'} />;
  }

  if (!audioUnlocked) {
    return <AudioUnlocker onUnlocked={handleAudioUnlocked} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "bold" },
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#e5e7eb" },
        tabBarLabelStyle: { fontWeight: "500" },
        headerRight: () => (
          <TouchableOpacity onPress={signOut} style={{ marginRight: 16 }}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: "Đơn hàng",
          headerTitle: "Đơn hàng của khách",
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          headerTitle: "Hồ sơ nhân viên",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="order/[id]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
          headerTitle: "Chi tiết đơn hàng",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    unlockContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f3f4f6',
      padding: 20,
    },
    unlockTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#1f2937',
      marginTop: 20,
      marginBottom: 10,
    },
    unlockText: {
      fontSize: 16,
      color: '#4b5563',
      textAlign: 'center',
      marginBottom: 30,
    },
    unlockButton: {
      backgroundColor: '#73509c',
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 30,
    },
    unlockButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
});