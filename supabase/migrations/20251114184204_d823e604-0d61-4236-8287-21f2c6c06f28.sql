-- Create storage bucket for complaint attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-attachments', 'complaint-attachments', true);

-- Create policies for complaint attachments
CREATE POLICY "Anyone can view complaint attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'complaint-attachments');

CREATE POLICY "Students can upload their own complaint attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'complaint-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Students can delete their own complaint attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'complaint-attachments'
  AND auth.uid() IS NOT NULL
);