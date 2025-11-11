-- Create hubs table
CREATE TABLE public.hubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;

-- Create policies for hubs
CREATE POLICY "Everyone can view hubs" 
ON public.hubs 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert hubs" 
ON public.hubs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hubs" 
ON public.hubs 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hubs" 
ON public.hubs 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Add hub_id to complaints table
ALTER TABLE public.complaints 
ADD COLUMN hub_id UUID REFERENCES public.hubs(id);

-- Create trigger for hubs updated_at
CREATE TRIGGER update_hubs_updated_at
BEFORE UPDATE ON public.hubs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();