import { Redirect } from "expo-router";
import { Platform } from "react-native";

export default function RootIndex() {
  // Chỉ thực hiện logic này trên nền tảng web
  if (Platform.OS === 'web') {
    // Lấy hostname từ URL của trình duyệt
    const hostname = window.location.hostname;

    // Điều hướng đến trang admin nếu hostname chứa 'admin'
    if (hostname.startsWith('admin.')) {
      return <Redirect href="/admin" />;
    }

    // Điều hướng đến trang nhân viên nếu hostname chứa 'staff'
    if (hostname.startsWith('staff.')) {
      return <Redirect href="/staff" />;
    }
  }

  // Mặc định, điều hướng đến trang khách hàng cho tất cả các trường hợp khác
  // (bao gồm cả khi chạy trên di động hoặc trên domain chính)
  return <Redirect href="/(customer)" />;
}