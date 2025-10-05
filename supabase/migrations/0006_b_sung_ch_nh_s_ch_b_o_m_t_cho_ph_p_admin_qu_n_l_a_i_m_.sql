-- Bật RLS trên bảng địa điểm để các chính sách bảo mật có hiệu lực
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Chính sách cho phép người dùng đã đăng nhập (admin) thêm địa điểm mới
CREATE POLICY "Allow authenticated users to insert locations"
ON public.locations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Chính sách cho phép người dùng đã đăng nhập (admin) cập nhật địa điểm
CREATE POLICY "Allow authenticated users to update locations"
ON public.locations
FOR UPDATE
TO authenticated
USING (true);

-- Chính sách cho phép người dùng đã đăng nhập (admin) xoá địa điểm
CREATE POLICY "Allow authenticated users to delete locations"
ON public.locations
FOR DELETE
TO authenticated
USING (true);