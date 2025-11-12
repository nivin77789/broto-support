-- Allow students to update their own complaints
CREATE POLICY "Students can update own complaints"
ON public.complaints
FOR UPDATE
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Allow students to delete their own complaints
CREATE POLICY "Students can delete own complaints"
ON public.complaints
FOR DELETE
USING (auth.uid() = student_id);