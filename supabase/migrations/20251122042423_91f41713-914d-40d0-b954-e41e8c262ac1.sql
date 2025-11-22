-- Add staff role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'staff';

-- Add user_id and verified columns to staff table
ALTER TABLE public.staff
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_staff_verified ON public.staff(verified);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON public.staff(user_id);

-- Update RLS policies for staff
DROP POLICY IF EXISTS "Staff can view own profile" ON public.staff;
CREATE POLICY "Staff can view own profile"
ON public.staff
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update staff verification" ON public.staff;
CREATE POLICY "Admins can update staff verification"
ON public.staff
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow anyone to insert staff (for signup)
DROP POLICY IF EXISTS "Anyone can sign up as staff" ON public.staff;
CREATE POLICY "Anyone can sign up as staff"
ON public.staff
FOR INSERT
WITH CHECK (true);