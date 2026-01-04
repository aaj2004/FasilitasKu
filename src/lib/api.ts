import { supabase } from '@/integrations/supabase/client';
import type { Facility, Request, Student, StatusLog, RequestStatus, Admin, FacilityCategory, AvailabilityCheck } from '@/types/database';
import { getAdminToken } from './storage';

// Cooldown period in hours
const COOLDOWN_HOURS = 3;

// ========== PUBLIC API (Mahasiswa) ==========

export const getFacilities = async (category?: FacilityCategory): Promise<Facility[]> => {
  let query = supabase
    .from('facilities')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('name');
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Facility[];
};

export const getStudentByEmailPhone = async (email: string, phone: string): Promise<Student | null> => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('email', email)
    .eq('phone', phone)
    .maybeSingle();
  
  if (error) throw error;
  return data as Student | null;
};

export const createOrGetStudent = async (name: string, email: string, phone: string, nim?: string): Promise<Student> => {
  const existing = await getStudentByEmailPhone(email, phone);
  if (existing) {
    // Update name and nim if changed
    if (existing.name !== name || (nim && existing.nim !== nim)) {
      const updateData: { name?: string; nim?: string } = {};
      if (existing.name !== name) updateData.name = name;
      if (nim && existing.nim !== nim) updateData.nim = nim;
      
      const { data, error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data as Student;
    }
    return existing;
  }
  
  const { data, error } = await supabase
    .from('students')
    .insert({ name, email, phone, nim: nim || null })
    .select()
    .single();
  
  if (error) throw error;
  return data as Student;
};

// Check availability with cooldown logic
export const checkAvailability = async (
  facilityId: string,
  startDatetime: string,
  endDatetime: string,
  quantityRequested: number = 1,
  excludeRequestId?: string
): Promise<AvailabilityCheck> => {
  // Get facility info
  const { data: facility, error: facilityError } = await supabase
    .from('facilities')
    .select('quantity_total, category, name')
    .eq('id', facilityId)
    .single();
  
  if (facilityError || !facility) {
    return { available: false, availableQuantity: 0, message: 'Fasilitas tidak ditemukan' };
  }

  const requestedStart = new Date(startDatetime);
  const requestedEnd = new Date(endDatetime);
  
  // Add cooldown period to check - we need to check if any approved request's end_datetime + 3 hours overlaps with our requested time
  const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
  
  // Get all approved/completed requests for this facility that might conflict
  let query = supabase
    .from('requests')
    .select('id, start_datetime, end_datetime, quantity_requested')
    .eq('facility_id', facilityId)
    .in('status', ['DISETUJUI']);
  
  if (excludeRequestId) {
    query = query.neq('id', excludeRequestId);
  }
  
  const { data: conflictingRequests, error } = await query;
  if (error) throw error;

  // Calculate how many units are in use during the requested period
  let unitsInUse = 0;
  
  for (const req of conflictingRequests || []) {
    const reqStart = new Date(req.start_datetime);
    const reqEnd = new Date(req.end_datetime);
    const reqEndWithCooldown = new Date(reqEnd.getTime() + cooldownMs);
    
    // Check if there's overlap between [reqStart, reqEndWithCooldown] and [requestedStart, requestedEnd]
    const hasOverlap = requestedStart < reqEndWithCooldown && requestedEnd > reqStart;
    
    if (hasOverlap) {
      unitsInUse += req.quantity_requested || 1;
    }
  }

  const availableQuantity = facility.quantity_total - unitsInUse;
  
  if (availableQuantity < quantityRequested) {
    const categoryLabel = facility.category === 'RUANGAN' ? 'ruangan' : 
                          facility.category === 'BARANG' ? 'barang' : 'kendaraan';
    
    if (availableQuantity <= 0) {
      return {
        available: false,
        availableQuantity: 0,
        message: `${facility.name} tidak tersedia pada jadwal tersebut karena sedang/baru saja digunakan (termasuk masa cooldown ${COOLDOWN_HOURS} jam setelah peminjaman).`
      };
    }
    
    return {
      available: false,
      availableQuantity,
      message: `Hanya tersedia ${availableQuantity} unit ${categoryLabel}. Anda meminta ${quantityRequested} unit.`
    };
  }

  return { available: true, availableQuantity };
};

export const uploadDocument = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  // Use crypto.randomUUID for better randomness
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
  const filePath = `proposals/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Return path only, not public URL - documents will be served via signed URLs
  return filePath;
};

export const createRequest = async (
  studentId: string,
  facilityId: string,
  startDatetime: string,
  endDatetime: string,
  purpose: string,
  borrowerOrg: string,
  usagePurpose: string,
  quantityRequested: number = 1,
  documentUrl?: string,
  notes?: string
): Promise<Request> => {
  // Check availability with cooldown
  const availability = await checkAvailability(facilityId, startDatetime, endDatetime, quantityRequested);
  if (!availability.available) {
    throw new Error(availability.message || 'Fasilitas tidak tersedia pada jadwal tersebut');
  }
  
  const { data, error } = await supabase
    .from('requests')
    .insert({
      student_id: studentId,
      facility_id: facilityId,
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      purpose,
      borrower_org: borrowerOrg,
      usage_purpose: usagePurpose,
      quantity_requested: quantityRequested,
      document_url: documentUrl || null,
      notes,
      status: 'DIAJUKAN'
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Create initial status log
  await supabase.from('status_logs').insert({
    request_id: data.id,
    old_status: null,
    new_status: 'DIAJUKAN',
    admin_id: null
  });
  
  return data as Request;
};

// export const getRequestsByUser = async (email: string, phone: string): Promise<Request[]> => {
//   // Call Edge Function to securely fetch requests without exposing data via RLS
//   const { data, error } = await supabase.functions.invoke('get-my-requests', {
//     body: { email, phone }
//   });

//   if (error) throw error;
//   return data?.requests || [];
// };


export const getRequestsByNim = async (
  nim: string
): Promise<Request[]> => {
  const { data, error } = await supabase
    .from('requests')
    .select(`
      id,
      student_id,
      facility_id,
      start_datetime,
      end_datetime,
      purpose,
      notes,
      status,
      admin_note,
      borrower_org,
      usage_purpose,
      quantity_requested,
      document_url,
      created_at,
      updated_at,
      facility:facilities (
        id,
        name,
        location,
        capacity,
        amenities,
        rules,
        is_active,
        category,
        quantity_total,
        created_at
      ),
      student:students!inner (
        id,
        nim,
        name,
        email,
        phone,
        created_at
      )
    `)
    .eq('students.nim', nim)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getRequestsByNim error:', error);
    throw error;
  }

  return (data ?? []) as Request[];
};




// export const getRequestsByNim = async (nim: string): Promise<Request[]> => {
//   // Call Edge Function to securely fetch requests by NIM
//   const { data, error } = await supabase.functions.invoke('get-my-requests', {
//     body: { nim }
//   });

//   if (error) throw error;
//   return data?.requests || [];
// };

export const getRequestsByUser = async (
  email: string,
  phone: string
): Promise<Request[]> => {
  const { data, error } = await supabase
    .from('requests')
    .select(`
      id,
      student_id,
      facility_id,
      start_datetime,
      end_datetime,
      purpose,
      notes,
      status,
      admin_note,
      borrower_org,
      usage_purpose,
      quantity_requested,
      document_url,
      created_at,
      updated_at,
      facility:facilities (
        id,
        name,
        location,
        capacity,
        amenities,
        rules,
        is_active,
        category,
        quantity_total,
        created_at
      ),
      student:students!inner (
        id,
        nim,
        name,
        email,
        phone,
        created_at
      )
    `)
    .eq('students.email', email)
    .eq('students.phone', phone)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getRequestsByUser error:', error);
    throw error;
  }

  return (data ?? []) as Request[];
};




// export const getRequestDetail = async (requestId: string, email: string, phone: string): Promise<Request | null> => {
//   // Call Edge Function to securely fetch request detail
//   const { data, error } = await supabase.functions.invoke('get-my-requests', {
//     body: { email, phone, requestId }
//   });

//   if (error) throw error;
//   return data?.request || null;
// };



export const getRequestDetail = async (
  requestId: string,
  email: string,
  phone: string
): Promise<Request | null> => {
  const { data, error } = await supabase
    .from('requests')
    .select(`
      id,
      student_id,
      facility_id,
      start_datetime,
      end_datetime,
      purpose,
      notes,
      status,
      admin_note,
      borrower_org,
      usage_purpose,
      quantity_requested,
      document_url,
      created_at,
      updated_at,
      facility:facilities (
        id,
        name,
        location,
        capacity,
        amenities,
        rules,
        is_active,
        category,
        quantity_total,
        created_at
      ),
      student:students!inner (
        id,
        nim,
        name,
        email,
        phone,
        created_at
      )
    `)
    // ⬇⬇⬇ PENTING BANGET ⬇⬇⬇
    .eq('id', requestId)
    .eq('students.email', email)
    .eq('students.phone', phone)
    .maybeSingle(); // ⬅️ detail cuma 1

  if (error) {
    console.error('getRequestDetail error:', error);
    throw error;
  }

  return data as Request | null;
};


// Get signed URL for document access
export const getDocumentSignedUrl = async (
  filePath: string,
  requestId?: string,
  email?: string,
  phone?: string
): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('get-document-url', {
    body: { filePath, requestId, email, phone }
  });

  if (error) throw error;
  return data?.url || '';
};

export const getStatusLogs = async (requestId: string): Promise<StatusLog[]> => {
  const { data, error } = await supabase
    .from('status_logs')
    .select(`
      *,
      admin:admins(id, name, email)
    `)
    .eq('request_id', requestId)
    .order('changed_at', { ascending: true });
  
  if (error) throw error;
  return data as StatusLog[];
};

// ========== ADMIN API ==========

export const adminLogin = async (email: string, password: string): Promise<Admin> => {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error || !data) throw new Error('Email atau password salah');
  
  const isValid = await verifyPassword(password, data.password_hash);
  if (!isValid) throw new Error('Email atau password salah');
  
  return { id: data.id, name: data.name, email: data.email, created_at: data.created_at };
};

export const adminRegister = async (name: string, email: string, password: string): Promise<Admin> => {
  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  
  if (existing) throw new Error('Email sudah terdaftar');
  
  const passwordHash = await hashPassword(password);
  
  const { data, error } = await supabase
    .from('admins')
    .insert({ name, email, password_hash: passwordHash })
    .select()
    .single();
  
  if (error) throw error;
  return { id: data.id, name: data.name, email: data.email, created_at: data.created_at };
};

// export const adminChangePassword = async (adminId: string, oldPassword: string, newPassword: string): Promise<void> => {
//   const { data, error } = await supabase
//     .from('admins')
//     .select('password_hash')
//     .eq('id', adminId)
//     .single();
  
//   if (error || !data) throw new Error('Admin tidak ditemukan');
  
//   const isValid = await verifyPassword(oldPassword, data.password_hash);
//   if (!isValid) throw new Error('Password lama salah');
  
//   const newHash = await hashPassword(newPassword);
  
//   const { error: updateError } = await supabase
//     .from('admins')
//     .update({ password_hash: newHash })
//     .eq('id', adminId);
  
//   if (updateError) throw updateError;
// };


export const adminChangePassword = async (
  adminId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  const { data, error } = await supabase
    .from('admins')
    .select('password_hash')
    .eq('id', adminId)
    .single();
  
  if (error || !data) throw new Error('Admin tidak ditemukan');
  
  const isValid = await verifyPassword(oldPassword, data.password_hash);
  if (!isValid) throw new Error('Password lama salah');
  
  const newHash = await hashPassword(newPassword);
  
  const { error: updateError } = await supabase
    .from('admins')
    .update({ password_hash: newHash })
    .eq('id', adminId);
  
  if (updateError) throw updateError;
};


const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'campus_salt_key_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
};

// ========== ADMIN CRUD ==========

export const getAllFacilities = async (category?: FacilityCategory): Promise<Facility[]> => {
  let query = supabase
    .from('facilities')
    .select('*')
    .order('category')
    .order('created_at', { ascending: false });
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Facility[];
};

export const createFacility = async (facility: Omit<Facility, 'id' | 'created_at'>): Promise<Facility> => {
  const { data, error } = await supabase
    .from('facilities')
    .insert(facility)
    .select()
    .single();
  
  if (error) throw error;
  return data as Facility;
};

export const updateFacility = async (id: string, facility: Partial<Facility>): Promise<Facility> => {
  const { data, error } = await supabase
    .from('facilities')
    .update(facility)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Facility;
};

export const deleteFacility = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('facilities')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const getAllRequests = async (): Promise<Request[]> => {
  const { data, error } = await supabase
    .from('requests')
    .select(`
      *,
      facility:facilities(*),
      student:students(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Request[];
};

export const updateRequestStatus = async (
  requestId: string,
  newStatus: RequestStatus,
  adminId: string,
  adminNote?: string
) => {
  const { error } = await supabase
    .from('requests')
    .update({
      status: newStatus,
      admin_note: adminNote ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw error;

  await supabase.from('status_logs').insert({
    request_id: requestId,
    new_status: newStatus,
    admin_id: adminId,
  });
};


// export const updateRequestStatus = async (
//   requestId: string,
//   newStatus: RequestStatus,
//   adminId: string,
//   adminNote?: string
// ): Promise<void> => {
//   if (newStatus === 'DITOLAK' && (!adminNote || !adminNote.trim())) {
//     throw new Error('Alasan penolakan wajib diisi');
//   }

//   const { data: current, error: fetchError } = await supabase
//     .from('requests')
//     .select('status')
//     .eq('id', requestId)
//     .single();

//   if (fetchError) throw fetchError;

//   const oldStatus = current.status as RequestStatus;

//   const { error: updateError } = await supabase
//     .from('requests')
//     .update({
//       status: newStatus,
//       admin_note: adminNote ?? null,
//     })
//     .eq('id', requestId);

//   if (updateError) throw updateError;

//   const { error: logError } = await supabase.from('status_logs').insert({
//     request_id: requestId,
//     old_status: oldStatus,
//     new_status: newStatus,
//     admin_id: adminId,
//   });

//   if (logError) throw logError;
// };


export const deleteRequest = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('requests')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const getAllStudents = async (): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Student[];
};

export const updateStudent = async (id: string, student: Partial<Student>): Promise<Student> => {
  const { data, error } = await supabase
    .from('students')
    .update(student)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Student;
};

export const deleteStudent = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const getAdminById = async (id: string): Promise<Admin | null> => {
  const { data, error } = await supabase
    .from('admins')
    .select('id, name, email, created_at')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data as Admin | null;
};
