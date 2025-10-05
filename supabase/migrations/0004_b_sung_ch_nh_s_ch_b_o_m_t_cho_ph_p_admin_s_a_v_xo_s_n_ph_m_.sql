-- Bật RLS trên bảng sản phẩm để đảm bảo các chính sách được áp dụng
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Chính sách cho phép người dùng đã đăng nhập (admin) thêm sản phẩm mới
CREATE POLICY "Allow authenticated users to insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Chính sách cho phép người dùng đã đăng nhập (admin) cập nhật sản phẩm
CREATE POLICY "Allow authenticated users to update products"
ON public.products
FOR UPDATE
TO authenticated
USING (true);

-- Chính sách cho phép người dùng đã đăng nhập (admin) xoá sản phẩm
CREATE POLICY "Allow authenticated users to delete products"
ON public.products
FOR DELETE
TO authenticated
USING (true);