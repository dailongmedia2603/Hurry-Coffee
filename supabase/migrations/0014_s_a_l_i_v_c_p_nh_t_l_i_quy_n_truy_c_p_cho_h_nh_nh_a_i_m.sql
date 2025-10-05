-- Step 1: Remove the now unused 'distance' column from the locations table.
ALTER TABLE public.locations
DROP COLUMN IF EXISTS distance;

-- Step 2: Create a dedicated storage bucket for location images to keep them organized.
INSERT INTO storage.buckets (id, name, public)
VALUES ('location-images', 'location-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Set security policies for the new bucket.
-- Allow anyone to view the images (for the customer-facing app).
CREATE POLICY "Allow public read access to location images"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'location-images');

-- Allow admins to upload new images.
CREATE POLICY "Allow admin to insert location images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'location-images' AND is_admin());

-- Allow admins to update existing images.
CREATE POLICY "Allow admin to update location images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'location-images' AND is_admin());

-- Allow admins to delete images.
CREATE POLICY "Allow admin to delete location images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'location-images' AND is_admin());