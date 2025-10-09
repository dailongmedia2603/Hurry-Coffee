export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  created_at: string;
  original_price: number | null;
};

export type OrderItem = {
  id: number;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: Product | null;
};

export type OrderStatus = 'Đang xử lý' | 'Đã xác nhận' | 'Đang giao' | 'Đã giao' | 'Đã huỷ' | 'Hoàn thành';

export type Order = {
  id: string;
  user_id: string | null;
  total: number;
  status: OrderStatus | string;
  created_at: string;
  notes: string | null;
  order_type: string | null;
  delivery_address: string | null;
  pickup_location_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  is_phone_verified: boolean | null;
  anonymous_device_id: string | null;
  order_items: OrderItem[];
  // Các trường tùy chọn từ các truy vấn tùy chỉnh
  restaurant_image_url?: string;
  restaurant_name?: string;
  items_count?: number;
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  role: 'user' | 'staff' | 'admin' | null;
  location_id: string | null;
};

export type Location = {
  id: string;
  name: string;
  address: string;
  image_url: string | null;
  opening_hours: string | null;
  created_at: string;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type UserAddress = {
  id: string;
  user_id: string;
  name: string;
  address: string;
  created_at: string;
  is_default: boolean;
};

export type ProductCategory = {
  id: string;
  name: string;
  created_at: string;
  icon_name: string | null;
};