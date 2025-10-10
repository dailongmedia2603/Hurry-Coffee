-- Cập nhật hàm để sử dụng Supabase Broadcast thay vì pg_notify
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
  channel_name TEXT := 'new_order_notifications';
  payload JSON;
BEGIN
  -- Xây dựng payload với một "event" name và dữ liệu đơn hàng
  payload = json_build_object(
    'type', 'broadcast',
    'event', 'new_order',
    'payload', json_build_object('new', NEW)
  );
  
  -- Gửi broadcast trên kênh đã định danh
  PERFORM pg_notify(channel_name, payload::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Đảm bảo trigger vẫn tồn tại và đúng
DROP TRIGGER IF EXISTS on_new_order ON public.orders;
CREATE TRIGGER on_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_order();