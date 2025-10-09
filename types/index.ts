export type Location = {
  id: string;
  name: string;
  address: string;
  image_url: string | null;
  opening_hours: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  distance?: number | null;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  original_price?: number | null;
  created_at?: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  icon_name: string;
  created_at?: string;
};

export type UserAddress = {
  id: string;
  user_id: string;
  name: string;
  address: string;
  is_default: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at?: string;
};

export type OrderStatus = 'Đang xử lý' | 'Đang giao hàng' | 'Đã giao' | 'Đã hủy' | 'Đã xác nhận' | 'Sẵn sàng';

export type OrderItem = {
  id: number;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: Product;
};

export type Order = {
  id: string;
  user_id: string | null;
  total: number;
  status: OrderStatus;
  created_at: string;
  notes: string | null;
  order_type: 'delivery' | 'pickup' | null;
  delivery_address: string | null;
  pickup_location_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  is_phone_verified: boolean | null;
  anonymous_device_id: string | null;
  order_items: OrderItem[];
  items_count?: number;
  locations?: Location;
};

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
};