-- Add category enum for facilities
CREATE TYPE facility_category AS ENUM ('RUANGAN', 'BARANG', 'KENDARAAN');

-- Add new columns to facilities
ALTER TABLE public.facilities 
ADD COLUMN category facility_category NOT NULL DEFAULT 'RUANGAN',
ADD COLUMN quantity_total integer NOT NULL DEFAULT 1;

-- Update requests table with new fields
ALTER TABLE public.requests 
ADD COLUMN borrower_org text NOT NULL DEFAULT '',
ADD COLUMN usage_purpose text NOT NULL DEFAULT '',
ADD COLUMN quantity_requested integer NOT NULL DEFAULT 1,
ADD COLUMN document_url text;

-- Drop old status enum and create new one
-- First update existing data
UPDATE public.requests SET status = 'DIAJUKAN' WHERE status = 'DIPROSES';

-- Alter the enum type to add DITOLAK and handle transition
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'DITOLAK';

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for documents bucket
CREATE POLICY "Anyone can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');

-- Update seed data with categories
UPDATE public.facilities SET category = 'RUANGAN', quantity_total = 1 WHERE name IN ('Aula Utama', 'Ruang Rapat A', 'Lab Komputer 1');

-- Insert additional sample facilities for other categories
INSERT INTO public.facilities (name, location, capacity, amenities, rules, is_active, category, quantity_total)
VALUES 
  ('Proyektor Epson', 'Gudang IT', 10, 'Full HD, HDMI, VGA', 'Kembalikan dalam kondisi baik', true, 'BARANG', 5),
  ('Speaker Portable', 'Gudang IT', 5, 'Bluetooth, AUX', 'Cek baterai sebelum pinjam', true, 'BARANG', 3),
  ('Microphone Wireless', 'Gudang IT', 8, '2 mic + receiver', 'Kembalikan dengan baterai', true, 'BARANG', 4),
  ('Mobil Operasional', 'Parkiran Kampus', 7, 'Toyota Innova', 'Wajib ada SIM, BBM ditanggung peminjam', true, 'KENDARAAN', 2),
  ('Bus Kampus', 'Parkiran Kampus', 40, 'Bus 40 kursi', 'Booking minimal H-3', true, 'KENDARAAN', 1)
ON CONFLICT DO NOTHING;