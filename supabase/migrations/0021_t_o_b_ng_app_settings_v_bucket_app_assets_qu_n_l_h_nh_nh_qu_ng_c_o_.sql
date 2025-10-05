-- 1. Tạo bảng để lưu trữ các cài đặt chung của ứng dụng
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bật Row Level Security (RLS) để bảo mật
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 3. Tạo chính sách cho phép mọi người đọc được cài đặt (ví dụ: URL ảnh)
CREATE POLICY "Public can read app settings"
ON public.app_settings
FOR SELECT USING (true);

-- 4. Tạo chính sách chỉ cho phép admin thêm, sửa, xóa cài đặt
CREATE POLICY "Admins can manage app settings"
ON public.app_settings
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Tạo một bucket lưu trữ mới cho các tài sản chung của ứng dụng
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Tạo chính sách cho phép mọi người xem được file trong bucket này
CREATE POLICY "Public can view app assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'app-assets');

-- 7. Tạo chính sách chỉ cho phép admin tải lên, sửa, xóa file
CREATE POLICY "Admins can manage app assets"
ON storage.objects
FOR ALL
USING (bucket_id = 'app-assets' AND public.is_admin())
WITH CHECK (bucket_id = 'app-assets' AND public.is_admin());