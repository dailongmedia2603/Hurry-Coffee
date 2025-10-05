-- Cập nhật hàm handle_new_user để nó không chạy khi một admin tạo tài khoản nhân viên.
-- Điều này ngăn chặn xung đột "khóa chính" vì Edge Function sẽ tự xử lý việc tạo hồ sơ.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Chỉ chạy trigger cho các lượt đăng ký thông thường,
  -- bỏ qua nếu người dùng được tạo bởi admin (được đánh dấu bằng user_metadata).
  IF new.raw_user_meta_data ->> 'created_by_admin' = 'true' THEN
    RETURN new; -- Bỏ qua, không làm gì cả.
  END IF;

  -- Tiếp tục logic cũ cho người dùng thông thường.
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name'
  );
  RETURN new;
END;
$function$