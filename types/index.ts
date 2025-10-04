export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  created_at: string;
}

export type OrderStatus = 'Đang xử lý' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy';

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
}

export interface Location {
  id: string;
  name: string;
  address: string;
  image_url: string;
  distance: string;
  opening_hours: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  name: string;
  address: string;
  created_at: string;
}