-- Thêm cột is_default vào bảng user_addresses
ALTER TABLE public.user_addresses
ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;

-- Tạo hàm để xử lý việc đặt địa chỉ mặc định một cách an toàn
CREATE OR REPLACE FUNCTION set_default_address(
  p_user_id uuid,
  p_address_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Bỏ đánh dấu tất cả địa chỉ mặc định hiện có của người dùng
  UPDATE public.user_addresses
  SET is_default = false
  WHERE user_id = p_user_id AND is_default = true;

  -- Đặt địa chỉ được chọn làm mặc định mới
  UPDATE public.user_addresses
  SET is_default = true
  WHERE id = p_address_id AND user_id = p_user_id;
END;
$$;