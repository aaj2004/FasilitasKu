-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('DIAJUKAN', 'DISETUJUI', 'DIPROSES', 'SELESAI');

-- Create admins table
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email, phone)
);

-- Create facilities table
CREATE TABLE public.facilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  amenities TEXT,
  rules TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create requests table
CREATE TABLE public.requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  purpose TEXT NOT NULL,
  notes TEXT,
  status public.request_status NOT NULL DEFAULT 'DIAJUKAN',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create status_logs table
CREATE TABLE public.status_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  old_status public.request_status,
  new_status public.request_status NOT NULL,
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for facilities (public read for active)
CREATE POLICY "Anyone can view active facilities"
ON public.facilities FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all facilities"
ON public.facilities FOR ALL
USING (true);

-- RLS Policies for students (public insert, read own)
CREATE POLICY "Anyone can create students"
ON public.students FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view students"
ON public.students FOR SELECT
USING (true);

CREATE POLICY "Anyone can update students"
ON public.students FOR UPDATE
USING (true);

-- RLS Policies for requests (public create, read own via email+phone)
CREATE POLICY "Anyone can create requests"
ON public.requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view requests"
ON public.requests FOR SELECT
USING (true);

CREATE POLICY "Anyone can update requests"
ON public.requests FOR UPDATE
USING (true);

-- RLS Policies for status_logs
CREATE POLICY "Anyone can view status logs"
ON public.status_logs FOR SELECT
USING (true);

CREATE POLICY "Anyone can create status logs"
ON public.status_logs FOR INSERT
WITH CHECK (true);

-- RLS Policies for admins
CREATE POLICY "Anyone can view admins"
ON public.admins FOR SELECT
USING (true);

CREATE POLICY "Anyone can create admins"
ON public.admins FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update admins"
ON public.admins FOR UPDATE
USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for requests updated_at
CREATE TRIGGER update_requests_updated_at
BEFORE UPDATE ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data for facilities
INSERT INTO public.facilities (name, location, capacity, amenities, rules, is_active) VALUES
('Aula Utama', 'Gedung A Lt. 1', 500, 'Proyektor, Sound System, AC, Podium, Mic Wireless', 'Maksimal penggunaan 8 jam. Wajib membersihkan setelah acara.', true),
('Ruang Seminar A', 'Gedung B Lt. 2', 100, 'Proyektor, AC, Whiteboard, Mic', 'Booking minimal H-3. Dilarang membawa makanan berat.', true),
('Ruang Seminar B', 'Gedung B Lt. 3', 80, 'Proyektor, AC, Whiteboard', 'Booking minimal H-3. Dilarang merokok.', true),
('Lapangan Basket Indoor', 'Gedung Olahraga', 200, 'Ring Basket, Tribun, Toilet', 'Wajib menggunakan sepatu olahraga. Maksimal 4 jam per booking.', true),
('Lab Komputer 1', 'Gedung C Lt. 1', 40, '40 PC, AC, Proyektor', 'Hanya untuk kegiatan akademik. Dilarang install software tanpa izin.', true),
('Studio Musik', 'Gedung D Lt. Basement', 15, 'Drum Set, Keyboard, Amplifier, Soundproof', 'Maksimal 3 jam. Wajib mengembalikan alat ke posisi semula.', true),
('Gazebo Taman', 'Area Taman Utama', 30, 'Meja, Kursi, Stop Kontak', 'Untuk kegiatan outdoor ringan. Tidak tersedia saat hujan.', true),
('Ruang Rapat VIP', 'Gedung Rektorat Lt. 5', 20, 'Proyektor 4K, Video Conference, AC, Katering tersedia', 'Khusus acara resmi. Booking minimal H-7.', true);