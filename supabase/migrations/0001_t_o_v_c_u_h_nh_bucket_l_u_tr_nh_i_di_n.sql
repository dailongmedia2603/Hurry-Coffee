-- Tạo bucket "avatars" với quyền truy cập công khai
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Cho phép người dùng đã xác thực tải ảnh lên
CREATE POLICY "Avatar uploads" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

-- Cho phép người dùng cập nhật ảnh đại diện của chính họ
CREATE POLICY "Avatar updates" ON storage.objects
FOR UPDATE TO authenticated USING (auth.uid() = owner);

-- Cho phép người dùng xóa ảnh đại diện của chính họ
CREATE POLICY "Avatar deletes" ON storage.objects
FOR DELETE TO authenticated USING (auth.uid() = owner);

-- Cho phép mọi người xem ảnh đại diện
CREATE POLICY "Public read access for avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');