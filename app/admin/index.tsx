import { Redirect } from "expo-router";

export default function AdminRootIndex() {
  // Mặc định chuyển hướng đến trang quản lý sản phẩm
  return <Redirect href="/admin/products" />;
}