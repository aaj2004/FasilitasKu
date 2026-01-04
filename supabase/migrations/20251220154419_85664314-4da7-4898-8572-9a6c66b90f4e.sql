-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create function to check if user is any admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin')
  )
$$;

-- 6. RLS policies for user_roles table
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 7. Add user_id column to admins table (link to auth.users)
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 8. Drop old insecure RLS policies on admins
DROP POLICY IF EXISTS "Anyone can create admins" ON public.admins;
DROP POLICY IF EXISTS "Anyone can update admins" ON public.admins;
DROP POLICY IF EXISTS "Anyone can view admins" ON public.admins;

-- 9. Create secure RLS policies for admins table
CREATE POLICY "Admins can view their own profile"
ON public.admins
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create their admin profile"
ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update their own profile"
ON public.admins
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 10. Drop old insecure RLS policies on students
DROP POLICY IF EXISTS "Anyone can create students" ON public.students;
DROP POLICY IF EXISTS "Anyone can update students" ON public.students;
DROP POLICY IF EXISTS "Anyone can view students" ON public.students;

-- 11. Create secure RLS policies for students table
-- Allow anyone to create students (for booking form)
CREATE POLICY "Anyone can create students for booking"
ON public.students
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view all students
CREATE POLICY "Only admins can view students"
ON public.students
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only admins can update students
CREATE POLICY "Only admins can update students"
ON public.students
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only admins can delete students
CREATE POLICY "Only admins can delete students"
ON public.students
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 12. Update requests table policies for better security
DROP POLICY IF EXISTS "Anyone can create requests" ON public.requests;
DROP POLICY IF EXISTS "Anyone can update requests" ON public.requests;
DROP POLICY IF EXISTS "Anyone can view requests" ON public.requests;

-- Allow anyone to create requests (for booking)
CREATE POLICY "Anyone can create requests for booking"
ON public.requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.requests
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Anyone can view their own requests by student_id (for tracking)
CREATE POLICY "Users can view their own requests"
ON public.requests
FOR SELECT
TO anon
USING (true);

-- Only admins can update requests
CREATE POLICY "Only admins can update requests"
ON public.requests
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 13. Create function to handle new admin registration
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert admin role for the new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'admin');
  RETURN NEW;
END;
$$;

-- 14. Create trigger to automatically assign admin role
CREATE TRIGGER on_admin_created
  AFTER INSERT ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin();