-- Add is_anonymous column to complaints table
ALTER TABLE public.complaints 
ADD COLUMN is_anonymous BOOLEAN NOT NULL DEFAULT false;

-- Update RLS policy to allow anonymous complaint visibility
-- Admins can still see all complaints but student info will be hidden in UI
-- No RLS changes needed, just the column for UI handling