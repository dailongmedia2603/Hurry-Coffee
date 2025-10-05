CREATE OR REPLACE FUNCTION public.update_category_and_products(
  p_category_id uuid,
  p_new_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_old_name text;
BEGIN
  -- Lấy tên cũ của phân loại
  SELECT name INTO v_old_name FROM public.product_categories WHERE id = p_category_id;

  -- Nếu không tìm thấy, thoát ra
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Cập nhật tên trong bảng phân loại
  UPDATE public.product_categories
  SET name = p_new_name
  WHERE id = p_category_id;

  -- Cập nhật tên trong tất cả sản phẩm liên quan
  UPDATE public.products
  SET category = p_new_name
  WHERE category = v_old_name;
END;
$$;