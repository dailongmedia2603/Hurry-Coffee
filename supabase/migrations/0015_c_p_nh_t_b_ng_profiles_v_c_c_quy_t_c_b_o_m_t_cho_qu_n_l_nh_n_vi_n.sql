-- Thêm cột để liên kết nhân viên với địa điểm
ALTER TABLE public.profiles
ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- Cho phép admin xem tất cả hồ sơ
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_admin());

-- Cho phép admin cập nhật tất cả hồ sơ (để gán địa điểm)
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (is_admin());

-- Cho phép admin xóa tài khoản nhân viên (không phải admin khác)
CREATE POLICY "Admins can delete staff profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (is_admin() AND role = 'staff');