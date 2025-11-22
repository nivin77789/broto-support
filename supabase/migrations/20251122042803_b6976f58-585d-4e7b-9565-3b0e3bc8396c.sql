-- Add RLS policies for staff to view and manage complaints in their hub
CREATE POLICY "Staff can view complaints in their hub"
ON public.complaints
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff
    WHERE staff.user_id = auth.uid()
      AND staff.verified = true
      AND staff.hub_id = complaints.hub_id
  )
);

CREATE POLICY "Staff can update complaints in their hub"
ON public.complaints
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.staff
    WHERE staff.user_id = auth.uid()
      AND staff.verified = true
      AND staff.hub_id = complaints.hub_id
  )
);

-- Add RLS policies for staff to view messages in their hub's complaints
CREATE POLICY "Staff can view messages for hub complaints"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff
    INNER JOIN public.complaints ON complaints.hub_id = staff.hub_id
    WHERE staff.user_id = auth.uid()
      AND staff.verified = true
      AND complaints.id = messages.complaint_id
  )
);

CREATE POLICY "Staff can send messages for hub complaints"
ON public.messages
FOR INSERT
WITH CHECK (
  (auth.uid() = sender_id) AND
  EXISTS (
    SELECT 1 FROM public.staff
    INNER JOIN public.complaints ON complaints.hub_id = staff.hub_id
    WHERE staff.user_id = auth.uid()
      AND staff.verified = true
      AND complaints.id = messages.complaint_id
  )
);