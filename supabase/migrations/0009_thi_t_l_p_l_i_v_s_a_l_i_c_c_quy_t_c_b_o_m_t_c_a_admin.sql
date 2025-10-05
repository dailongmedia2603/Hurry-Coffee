-- Step 1: Drop all existing admin-related policies to ensure a clean slate.
-- This avoids any potential conflicts with misconfigured or old policies.
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

DROP POLICY IF EXISTS "Admins can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can update locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can delete locations" ON public.locations;

-- Step 2: Drop and recreate the is_admin function to ensure it's correctly defined.
DROP FUNCTION IF EXISTS is_admin();
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
-- SET search_path = '' is a security best practice that prevents hijacking.
SET search_path = ''
AS $$
BEGIN
  -- This function checks if the currently authenticated user has the 'admin' role
  -- in the public.profiles table. It securely links the user's auth ID to their profile.
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Step 3: Re-create the security policies for the 'products' table.
-- These policies ensure that only users for whom is_admin() returns true can modify the table.
CREATE POLICY "Admins can insert products" ON public.products
FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update products" ON public.products
FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete products" ON public.products
FOR DELETE TO authenticated USING (is_admin());

-- Step 4: Re-create the security policies for the 'locations' table.
CREATE POLICY "Admins can insert locations" ON public.locations
FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update locations" ON public.locations
FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete locations" ON public.locations
FOR DELETE TO authenticated USING (is_admin());