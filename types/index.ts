export interface Topping {
  id: string;
  name: string;
  price: number;
  created_at: string;
}

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

export type OrderStatus = 'Đang xử lý' | 'Dang xu ly' | 'Đang làm' | 'Đang giao' | 'Sẵn sàng' | 'Hoàn thành' | 'Đã hủy' | 'Không liên hệ được';

export interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  items_count: number;
  restaurant_name: string;
  restaurant_image_url: string;
  order_type: 'delivery' | 'pickup';
  locations: Location | null;
  customer_name: string | null;
  customer_phone: string | null;
  is_phone_verified: boolean | null;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  image_url: string;
  opening_hours: string;
  google_maps_url: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number;
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