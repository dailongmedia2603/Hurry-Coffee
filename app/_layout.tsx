// app/_layout.tsx
import { Stack } from "expo-router";
import { AuthProvider } from "@/src/context/AuthContext";
import { CartProvider } from "@/src/context/CartContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CartProvider>
    </AuthProvider>
  );
}