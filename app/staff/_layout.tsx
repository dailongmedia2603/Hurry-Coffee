import React, { useState } from "react";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from "react-native";
import AdminLoginScreen from "@/src/components/admin/AdminLoginScreen";
import useOrderNotifications from "@/src/hooks/useOrderNotifications";

const ACTIVE_COLOR = "#73509c";
const INACTIVE_COLOR = "#9ca3af";

// Component mới để "mở khóa" âm thanh
const AudioUnlocker = ({ onUnlocked }: { onUnlocked: () => void }) => {
  const [unlocking, setUnlocking] = useState(false);

  const handleUnlock = () => {
    setUnlocking(true);
    
    // Tạo một đối tượng audio với file âm thanh thật
    const audio = new Audio('/assets/sounds/codon.mp3');
    
    // Cố gắng phát nó. Đây là hành động quan trọng do người dùng khởi xướng.
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Nếu phát thành công, dừng lại ngay lập tức.
        // Trình duyệt đã ghi nhận quyền phát âm thanh cho trang này.
        audio.pause();
        console.log("Audio unlocked successfully.");
      }).catch(error => {
        // Nếu bị lỗi, ghi lại để gỡ lỗi.
        console.error("Audio could not be unlocked automatically:", error);
      }).finally(() => {
        // Dù thành công hay thất bại, vẫn tiếp tục vào app.
        setTimeout(() => onUnlocked(), 100);
      });
    } else {
      // Fallback cho trình duyệt cũ không hỗ trợ promise
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
        {unlocking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.unlockButtonText}>Sẵn sàng</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function StaffLayout() {
  const { session, profile, loading, signOut } = useAuth();
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  
  // Kích hoạt hook thông báo
  useOrderNotifications();

  if (loading) {
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

  // Hiển thị màn hình mở khóa âm thanh trước
  if (!audioUnlocked) {
    return <AudioUnlocker onUnlocked={() => setAudioUnlocked(true)} />;
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