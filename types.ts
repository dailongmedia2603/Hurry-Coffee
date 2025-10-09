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
  products: Product | null; // Dữ liệu product được join vào
};

export type Order = {
  id: string;
  user_id: string | null;
  total: number;
  status: string;
  created_at: string;
  notes: string | null;
  order_type: string | null;
  delivery_address: string | null;
  pickup_location_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  is_phone_verified: boolean | null;
  anonymous_device_id: string | null;
  order_items: OrderItem[]; // Thêm thuộc tính còn thiếu
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  role: 'user' | 'staff' | 'admin' | null;
  location_id: string | null;
};