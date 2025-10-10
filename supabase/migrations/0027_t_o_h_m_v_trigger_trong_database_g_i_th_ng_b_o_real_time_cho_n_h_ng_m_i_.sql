-- 1. Tạo một hàm để gửi thông báo qua một kênh tùy chỉnh
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  -- Chuyển đổi bản ghi đơn hàng mới thành JSON
  -- và thêm các thông tin cần thiết cho thông báo
  payload = json_build_object(
    'new', NEW
  );
  
  -- Gửi thông báo trên kênh 'new_order_channel' với payload là dữ liệu đơn hàng
  PERFORM pg_notify('new_order_channel', payload::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Tạo một trigger để tự động gọi hàm trên sau mỗi lần có đơn hàng mới
DROP TRIGGER IF EXISTS on_new_order ON public.orders;
CREATE TRIGGER on_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_order();