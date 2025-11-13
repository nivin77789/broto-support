-- Update complaint_category enum to new values
-- First, drop the old enum and create new one with correct values

-- Drop the existing enum type (this will fail if the column is using it, so we'll convert first)
ALTER TABLE public.complaints 
ALTER COLUMN category TYPE text;

-- Drop the old enum
DROP TYPE IF EXISTS public.complaint_category CASCADE;

-- Create the new enum with correct values
CREATE TYPE public.complaint_category AS ENUM ('Communication', 'Hub', 'Review', 'Payments', 'Others');

-- Convert the column back to use the new enum
ALTER TABLE public.complaints 
ALTER COLUMN category TYPE public.complaint_category USING 
  CASE 
    WHEN category = 'Technical' THEN 'Others'::public.complaint_category
    WHEN category = 'Hostel' THEN 'Hub'::public.complaint_category
    WHEN category = 'Mentor' THEN 'Review'::public.complaint_category
    WHEN category = 'Financial' THEN 'Payments'::public.complaint_category
    WHEN category = 'Infrastructure' THEN 'Hub'::public.complaint_category
    WHEN category = 'Other' THEN 'Others'::public.complaint_category
    ELSE 'Others'::public.complaint_category
  END;