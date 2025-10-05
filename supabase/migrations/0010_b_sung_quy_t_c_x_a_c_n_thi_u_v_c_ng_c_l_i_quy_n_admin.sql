-- Step 1: Add the missing DELETE policy for the 'profiles' table.
-- This allows authenticated users to delete their own profile, which is a standard practice.
CREATE POLICY "Users can delete their own profile" ON public.profiles
FOR DELETE TO authenticated USING (auth.uid() = id);

-- Step 2: Re-apply the DELETE policy for 'products' to ensure it is correctly configured for admins.
-- This removes any doubt about its existence or correctness.
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products
FOR DELETE TO authenticated USING (is_admin());

-- Step 3: Re-apply the DELETE policy for 'locations' for the same reason.
DROP POLICY IF EXISTS "Admins can delete locations" ON public.locations;
CREATE POLICY "Admins can delete locations" ON public.locations
FOR DELETE TO authenticated USING (is_admin());