-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true);

-- Create policy for uploading vehicle images
CREATE POLICY "Authenticated users can upload vehicle images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for viewing vehicle images
CREATE POLICY "Anyone can view vehicle images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'vehicle-images');

-- Create policy for deleting own vehicle images
CREATE POLICY "Users can delete their own vehicle images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add images column to vehicles table to support multiple images
ALTER TABLE public.vehicles
ADD COLUMN images text[] DEFAULT '{}';

-- Update image_url to be optional since we'll use images array
ALTER TABLE public.vehicles
ALTER COLUMN image_url DROP NOT NULL;