import { Stack } from 'expo-router';
import { AuthProvider } from '@/src/providers/AuthProvider';
import { CartProvider } from '@/src/providers/CartProvider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CartProvider>
    </AuthProvider>
  );
}