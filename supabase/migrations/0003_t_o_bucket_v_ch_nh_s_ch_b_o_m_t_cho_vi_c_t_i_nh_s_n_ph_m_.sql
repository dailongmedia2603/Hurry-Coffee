-- Create a public bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the product-images bucket
-- Allow public read access for anyone
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'product-images' );

-- Allow authenticated users to upload, update, and delete images
CREATE POLICY "Authenticated users can manage product images"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'product-images' )
WITH CHECK ( bucket_id = 'product-images' );