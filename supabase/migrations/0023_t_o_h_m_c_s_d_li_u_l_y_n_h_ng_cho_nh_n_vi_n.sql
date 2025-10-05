CREATE OR REPLACE FUNCTION public.get_staff_orders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    staff_location_id UUID;
    result jsonb;
BEGIN
    -- Lấy location_id của nhân viên đang đăng nhập
    SELECT location_id INTO staff_location_id
    FROM public.profiles
    WHERE id = auth.uid();

    -- Nếu nhân viên được gán địa điểm, lấy đơn hàng
    IF staff_location_id IS NOT NULL THEN
        SELECT jsonb_agg(o_rows) INTO result
        FROM (
            SELECT
                o.*,
                (SELECT count(*)::int FROM public.order_items oi WHERE oi.order_id = o.id) as items_count
            FROM public.orders o
            WHERE o.order_type = 'pickup'
            AND o.pickup_location_id = staff_location_id
            ORDER BY o.created_at DESC
        ) o_rows;
        
        RETURN COALESCE(result, '[]'::jsonb);
    END IF;

    -- Trả về mảng rỗng nếu không có địa điểm hoặc không có đơn hàng
    RETURN '[]'::jsonb;
END;
$$;