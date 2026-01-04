export type RequestStatus = 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK' | 'SELESAI';
export type FacilityCategory = 'RUANGAN' | 'BARANG' | 'KENDARAAN';

export interface Student {
  id: string;
  nim: string | null;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface Facility {
  id: string;
  name: string;
  location: string;
  capacity: number;
  amenities: string | null;
  rules: string | null;
  is_active: boolean;
  category: FacilityCategory;
  quantity_total: number;
  created_at: string;
}

export interface Request {
  id: string;
  student_id: string;
  facility_id: string;
  start_datetime: string;
  end_datetime: string;
  purpose: string;
  notes: string | null;
  status: RequestStatus;
  admin_note: string | null;
  borrower_org: string;
  usage_purpose: string;
  quantity_requested: number;
  document_url: string | null;
  created_at: string;
  updated_at: string;
  student?: Student;
  facility?: Facility;
}

export interface StatusLog {
  id: string;
  request_id: string;
  old_status: RequestStatus | null;
  new_status: RequestStatus;
  admin_id: string | null;
  changed_at: string;
  admin?: Admin;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface RequestWithDetails extends Request {
  student: Student;
  facility: Facility;
  status_logs?: StatusLog[];
}

export interface AvailabilityCheck {
  available: boolean;
  availableQuantity: number;
  message?: string;
}
