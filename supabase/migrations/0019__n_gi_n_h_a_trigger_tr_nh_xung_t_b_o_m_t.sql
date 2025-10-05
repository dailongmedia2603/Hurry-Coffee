CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Hàm này chỉ dùng cho việc đăng ký của người dùng thông thường.
  -- Việc tạo tài khoản admin/nhân viên sẽ do Edge Function xử lý riêng.
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name'
  );
  -- Cột 'role' sẽ tự động lấy giá trị mặc định là 'user'.
  RETURN new;
END;
$$;