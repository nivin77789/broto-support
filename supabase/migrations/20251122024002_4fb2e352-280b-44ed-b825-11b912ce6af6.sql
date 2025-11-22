-- Create staff table
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role_name TEXT NOT NULL,
  hub_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage staff
CREATE POLICY "Admins can view all staff"
ON public.staff
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert staff"
ON public.staff
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update staff"
ON public.staff
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete staff"
ON public.staff
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();