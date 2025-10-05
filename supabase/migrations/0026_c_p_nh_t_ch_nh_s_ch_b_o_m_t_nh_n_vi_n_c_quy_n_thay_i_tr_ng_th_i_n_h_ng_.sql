-- Xóa chính sách cũ để đảm bảo không có xung đột
DROP POLICY IF EXISTS "Staff can update order status at their location" ON public.orders;

-- Tạo lại chính sách bảo mật cho phép nhân viên cập nhật đơn hàng
-- Chính sách này đảm bảo nhân viên (role='staff') chỉ có thể cập nhật
-- những đơn hàng thuộc địa điểm (location_id) mà họ được gán.
CREATE POLICY "Staff can update orders at their assigned location"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE
      profiles.id = auth.uid() AND
      profiles.role = 'staff' AND
      profiles.location_id = orders.pickup_location_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE
      profiles.id = auth.uid() AND
      profiles.role = 'staff' AND
      profiles.location_id = orders.pickup_location_id
  )
);