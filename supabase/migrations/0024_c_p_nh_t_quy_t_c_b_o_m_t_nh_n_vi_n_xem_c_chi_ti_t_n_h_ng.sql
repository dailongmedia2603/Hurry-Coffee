-- Cấp quyền cho Admin và Nhân viên xem đơn hàng và các mục trong đơn

-- Cho phép Admin xem tất cả đơn hàng
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (is_admin());

-- Cho phép Nhân viên xem các đơn hàng ghé lấy tại địa điểm của họ
CREATE POLICY "Staff can view pickup orders at their assigned location"
ON public.orders
FOR SELECT
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
);

-- Cho phép Admin xem tất cả các mục trong đơn hàng
CREATE POLICY "Admins can view all order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (is_admin());

-- Cho phép Nhân viên xem các mục của đơn hàng tại địa điểm của họ
CREATE POLICY "Staff can view items for orders at their assigned location"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.profiles p ON p.location_id = o.pickup_location_id
    WHERE
      o.id = order_items.order_id AND
      p.id = auth.uid() AND
      p.role = 'staff'
  )
);