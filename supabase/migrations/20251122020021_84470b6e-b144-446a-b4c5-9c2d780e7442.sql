-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- RLS policies for courses
CREATE POLICY "Everyone can view courses"
ON public.courses
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert courses"
ON public.courses
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update courses"
ON public.courses
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete courses"
ON public.courses
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add new fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN batch TEXT,
ADD COLUMN hub_id UUID REFERENCES public.hubs(id),
ADD COLUMN course_id UUID REFERENCES public.courses(id);

-- Insert initial courses
INSERT INTO public.courses (name) VALUES
  ('Django'),
  ('MERN'),
  ('Android'),
  ('ML'),
  ('Data Science'),
  ('Java'),
  ('React');

-- Add trigger for courses updated_at
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();