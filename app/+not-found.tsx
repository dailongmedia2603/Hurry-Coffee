import { Redirect } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function NotFoundScreen() {
  const { profile, loading, session } = useAuth();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#73509c" />
      </View>
    );
  }

  if (session && profile) {
    if (profile.role === 'admin') {
      return <Redirect href="/admin" />;
    }
    if (profile.role === 'staff') {
      return <Redirect href="/(staff)/orders" />;
    }
  }

  // For customers or guests
  return <Redirect href="/(customer)" />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});