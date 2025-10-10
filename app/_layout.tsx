import { Stack } from "expo-router";
import { AuthProvider } from "@/src/context/AuthContext";
import { useEffect } from 'react';
import { register } from '@/src/utils/registerServiceWorker';

export default function RootLayout() {
  useEffect(() => {
    register();
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}