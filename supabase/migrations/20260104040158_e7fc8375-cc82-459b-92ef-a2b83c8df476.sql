-- Add NIM column to students table
ALTER TABLE public.students 
ADD COLUMN nim text;

-- Create index for faster lookups
CREATE INDEX idx_students_nim ON public.students(nim);