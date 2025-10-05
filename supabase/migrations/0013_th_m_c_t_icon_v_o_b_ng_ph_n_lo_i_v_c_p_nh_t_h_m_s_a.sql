-- Step 1: Add a column to store the icon name for each category.
-- Default to 'fast-food-outline' for any existing or new categories without a specified icon.
ALTER TABLE public.product_categories
ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'fast-food-outline';

-- Step 2: Update the function to allow changing the icon along with the name.
CREATE OR REPLACE FUNCTION public.update_category_and_products(
  p_category_id uuid,
  p_new_name text,
  p_new_icon_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_old_name text;
BEGIN
  -- Get the old category name to find related products
  SELECT name INTO v_old_name FROM public.product_categories WHERE id = p_category_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Update the category table with the new name and icon
  UPDATE public.product_categories
  SET 
    name = p_new_name,
    icon_name = p_new_icon_name
  WHERE id = p_category_id;

  -- If the name changed, update all associated products
  IF v_old_name IS DISTINCT FROM p_new_name THEN
    UPDATE public.products
    SET category = p_new_name
    WHERE category = v_old_name;
  END IF;
END;
$$;