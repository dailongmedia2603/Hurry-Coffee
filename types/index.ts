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
}