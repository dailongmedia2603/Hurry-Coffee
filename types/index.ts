export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category: string | null;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: Product;
}

export type OrderStatus = 'Đang xử lý' | 'Đang làm' | 'Đang giao' | 'Sẵn sàng' | 'Hoàn thành' | 'Đã hủy';

export interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  items_count?: number;
  order_type: 'delivery' | 'pickup';
  locations: Location | null;
  customer_name: string | null;
  customer_phone: string | null;
  is_phone_verified: boolean | null;
  order_items?: OrderItem[];
  user_id: string | null;
  notes: string | null;
  delivery_address: string | null;
  pickup_location_id: string | null;
  anonymous_device_id: string | null;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  image_url: string;
  opening_hours: string;
  google_maps_url: string | null;
}

export interface UserAddress {
  id: string;
  user_id: string;
  name: string;
  address: string;
  created_at: string;
  is_default?: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon_name: string | null;
  created_at: string;
}