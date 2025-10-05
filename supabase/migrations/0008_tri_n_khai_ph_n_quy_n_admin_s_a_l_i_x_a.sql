-- Step 1: Add a 'role' column to the profiles table to distinguish admins from regular users.
-- New users will default to the 'user' role.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Step 2: Create a helper function to securely check if the currently logged-in user has the 'admin' role.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if the user's ID exists in the profiles table and their role is 'admin'.
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Step 3: Remove the old, insecure policies for the 'products' table.
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON public.products;

-- Step 4: Add new policies that restrict write access on 'products' to admins only.
CREATE POLICY "Admins can insert products" ON public.products
FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update products" ON public.products
FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete products" ON public.products
FOR DELETE TO authenticated USING (is_admin());

-- Step 5: Remove the old, insecure policies for the 'locations' table.
DROP POLICY IF EXISTS "Allow authenticated users to insert locations" ON public.locations;
DROP POLICY IF EXISTS "Allow authenticated users to update locations" ON public.locations;
DROP POLICY IF EXISTS "Allow authenticated users to delete locations" ON public.locations;

-- Step 6: Add new policies that restrict write access on 'locations' to admins only.
CREATE POLICY "Admins can insert locations" ON public.locations
FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update locations" ON public.locations
FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete locations" ON public.locations
FOR DELETE TO authenticated USING (is_admin());