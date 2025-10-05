-- Create the table to store product categories
CREATE TABLE public.product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for the new table
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access so categories can be displayed everywhere
CREATE POLICY "Public can read categories" ON public.product_categories
FOR SELECT USING (true);

-- Allow admins to insert new categories
CREATE POLICY "Admins can insert categories" ON public.product_categories
FOR INSERT TO authenticated WITH CHECK (is_admin());

-- Allow admins to update category names
CREATE POLICY "Admins can update categories" ON public.product_categories
FOR UPDATE TO authenticated USING (is_admin());

-- Allow admins to delete categories
CREATE POLICY "Admins can delete categories" ON public.product_categories
FOR DELETE TO authenticated USING (is_admin());

-- Populate the new table with existing distinct categories from the products table
INSERT INTO public.product_categories (name)
SELECT DISTINCT category FROM public.products WHERE category IS NOT NULL AND category != ''
ON CONFLICT (name) DO NOTHING;