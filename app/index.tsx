import { Redirect } from "expo-router";

export default function RootIndex() {
  // By default, redirect to the customer-facing app.
  // The admin panel can be accessed by navigating to /admin
  return <Redirect href="/(customer)" />;
}