CREATE POLICY "Staff can update order status at their location"
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
);