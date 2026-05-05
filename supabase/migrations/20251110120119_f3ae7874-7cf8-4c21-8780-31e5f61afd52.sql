-- Add new fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS id_document_url text,
ADD COLUMN IF NOT EXISTS address text;

-- Create storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false);

-- RLS policies for id-documents bucket
CREATE POLICY "Users can upload their own ID documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'id-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own ID documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'id-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own ID documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'id-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own ID documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'id-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);