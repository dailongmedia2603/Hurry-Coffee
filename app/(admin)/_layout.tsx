import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1f2937", // Dark gray background
        },
        headerTintColor: "#ffffff", // White text
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Admin Dashboard" }} />
    </Stack>
  );
}