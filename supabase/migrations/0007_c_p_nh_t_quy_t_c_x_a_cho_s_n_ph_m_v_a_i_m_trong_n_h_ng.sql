-- Drop existing foreign key constraint on order_items to prevent deletion errors
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Re-add the constraint with ON DELETE SET NULL to preserve order history
ALTER TABLE public.order_items 
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES public.products(id) 
ON DELETE SET NULL;

-- Drop existing foreign key constraint on orders to prevent deletion errors
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_pickup_location_id_fkey;

-- Re-add the constraint with ON DELETE SET NULL to preserve order history
ALTER TABLE public.orders
ADD CONSTRAINT orders_pickup_location_id_fkey
FOREIGN KEY (pickup_location_id)
REFERENCES public.locations(id)
ON DELETE SET NULL;