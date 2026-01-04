import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getFacilities, createOrGetStudent, createRequest, uploadDocument, checkAvailability } from '@/lib/api';
import { saveUserIdentifier, getUserIdentifier } from '@/lib/storage';
import type { FacilityCategory, AvailabilityCheck } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, CheckCircle, Building2, Upload, AlertTriangle, Package, Car, Home } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const bookingSchema = z.object({
  nim: z.string().min(1, 'NIM wajib diisi'),
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().min(10, 'Nomor HP minimal 10 digit'),
  borrower_org: z.string().min(1, 'Nama organisasi/UKM wajib diisi'),
  category: z.enum(['RUANGAN', 'BARANG', 'KENDARAAN'], { required_error: 'Pilih kategori' }),
  facility_id: z.string().min(1, 'Pilih fasilitas'),
  quantity_requested: z.number().min(1, 'Minimal 1 unit'),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  start_time: z.string().min(1, 'Jam mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
  end_time: z.string().min(1, 'Jam selesai wajib diisi'),
  usage_purpose: z.string().min(10, 'Keperluan minimal 10 karakter'),
  purpose: z.string().min(10, 'Deskripsi kegiatan minimal 10 karakter'),
  notes: z.string().optional(),
}).refine((data) => {
  const start = new Date(`${data.start_date}T${data.start_time}`);
  const end = new Date(`${data.end_date}T${data.end_time}`);
  return end > start;
}, {
  message: 'Waktu selesai harus lebih besar dari waktu mulai',
  path: ['end_time'],
});

type BookingFormData = z.infer<typeof bookingSchema>;

const categoryLabels: Record<FacilityCategory, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  RUANGAN: { label: 'Ruangan', icon: Home },
  BARANG: { label: 'Barang', icon: Package },
  KENDARAAN: { label: 'Kendaraan', icon: Car },
};

export const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedFacility = searchParams.get('facility');
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityCheck | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const { data: facilities, isLoading: loadingFacilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: () => getFacilities(),
  });

  const savedUser = getUserIdentifier();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      nim: '',
      name: '',
      email: savedUser?.email || '',
      phone: savedUser?.phone || '',
      borrower_org: '',
      category: undefined,
      facility_id: preselectedFacility || '',
      quantity_requested: 1,
      start_date: '',
      start_time: '08:00',
      end_date: '',
      end_time: '17:00',
      usage_purpose: '',
      purpose: '',
      notes: '',
    },
  });

  const selectedCategory = form.watch('category');
  const selectedFacilityId = form.watch('facility_id');
  const quantityRequested = form.watch('quantity_requested');
  const startDate = form.watch('start_date');
  const startTime = form.watch('start_time');
  const endDate = form.watch('end_date');
  const endTime = form.watch('end_time');

  const filteredFacilities = useMemo(() => {
    if (!facilities || !selectedCategory) return [];
    return facilities.filter(f => f.category === selectedCategory);
  }, [facilities, selectedCategory]);

  const selectedFacility = useMemo(() => {
    return facilities?.find(f => f.id === selectedFacilityId);
  }, [facilities, selectedFacilityId]);

  // Set category when preselected facility is found
  useEffect(() => {
    if (preselectedFacility && facilities) {
      const facility = facilities.find(f => f.id === preselectedFacility);
      if (facility) {
        form.setValue('category', facility.category);
        form.setValue('facility_id', facility.id);
      }
    }
  }, [preselectedFacility, facilities, form]);

  // Reset facility when category changes
  useEffect(() => {
    if (!preselectedFacility) {
      form.setValue('facility_id', '');
      form.setValue('quantity_requested', 1);
    }
  }, [selectedCategory, form, preselectedFacility]);

  // Check availability when relevant fields change
  useEffect(() => {
    const checkAvail = async () => {
      if (!selectedFacilityId || !startDate || !startTime || !endDate || !endTime) {
        setAvailability(null);
        return;
      }

      try {
        setCheckingAvailability(true);
        const startDatetime = new Date(`${startDate}T${startTime}`).toISOString();
        const endDatetime = new Date(`${endDate}T${endTime}`).toISOString();
        const result = await checkAvailability(selectedFacilityId, startDatetime, endDatetime, quantityRequested || 1);
        setAvailability(result);
      } catch (error) {
        setAvailability(null);
      } finally {
        setCheckingAvailability(false);
      }
    };

    const timer = setTimeout(checkAvail, 500);
    return () => clearTimeout(timer);
  }, [selectedFacilityId, startDate, startTime, endDate, endTime, quantityRequested]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setFileError('File harus berformat PDF, JPG, atau PNG');
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('Ukuran file maksimal 10MB');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const submitMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      // Upload document first if exists
      let documentUrl: string | undefined;
      if (selectedFile) {
        documentUrl = await uploadDocument(selectedFile);
      }

      // Create or get student
      const student = await createOrGetStudent(data.name, data.email, data.phone, data.nim);
      
      // Save user identifier
      saveUserIdentifier({
        email: data.email,
        phone: data.phone,
        studentId: student.id,
      });

      // Create request
      const startDatetime = new Date(`${data.start_date}T${data.start_time}`).toISOString();
      const endDatetime = new Date(`${data.end_date}T${data.end_time}`).toISOString();
      
      const request = await createRequest(
        student.id,
        data.facility_id,
        startDatetime,
        endDatetime,
        data.purpose,
        data.borrower_org,
        data.usage_purpose,
        data.quantity_requested,
        documentUrl,
        data.notes || undefined
      );

      return request;
    },
    onSuccess: (data) => {
      setCreatedRequestId(data.id);
      setIsSuccess(true);
      toast.success('Pengajuan berhasil dikirim!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengirim pengajuan');
    },
  });

  const onSubmit = (data: BookingFormData) => {
    if (!selectedFile) {
      toast.error('Surat proposal/peminjaman wajib diunggah');
      return;
    }
    if (availability && !availability.available) {
      toast.error(availability.message || 'Fasilitas tidak tersedia');
      return;
    }
    submitMutation.mutate(data);
  };

  if (isSuccess) {
    return (
      <div className="container py-8 max-w-lg mx-auto animate-scale-in">
        <Card className="border-0 shadow-lg text-center">
          <CardContent className="py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Pengajuan Berhasil!
            </h2>
            <p className="text-muted-foreground mb-6">
              Pengajuan peminjaman Anda telah dikirim dan sedang menunggu persetujuan admin.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <a href={`/my-requests/${createdRequestId}`}>Lihat Detail Pengajuan</a>
              </Button>
              <Button variant="outline" onClick={() => {
                setIsSuccess(false);
                setSelectedFile(null);
                form.reset();
              }} className="w-full">
                Ajukan Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Ajukan Peminjaman
        </h1>
        <p className="text-muted-foreground">
          Isi form berikut untuk mengajukan peminjaman fasilitas
        </p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Form Peminjaman
          </CardTitle>
          <CardDescription>
            Semua field bertanda * wajib diisi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Data Pemohon */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Data Pemohon</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIM *</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan NIM" {...field} className="input-focus" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap *</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan nama lengkap" {...field} className="input-focus" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} className="input-focus" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor HP *</FormLabel>
                        <FormControl>
                          <Input placeholder="08xxxxxxxxxx" {...field} className="input-focus" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="borrower_org"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Peminjam (Organisasi/UKM) *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: BEM, HIMA Informatika, UKM Basket" {...field} className="input-focus" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Detail Peminjaman */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Detail Peminjaman</h3>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori Fasilitas *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="input-focus">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(categoryLabels).map(([key, { label, icon: Icon }]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facility_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pilih Fasilitas *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!selectedCategory}
                      >
                        <FormControl>
                          <SelectTrigger className="input-focus">
                            <SelectValue placeholder={
                              loadingFacilities ? 'Memuat...' : 
                              !selectedCategory ? 'Pilih kategori terlebih dahulu' : 
                              'Pilih fasilitas'
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredFacilities?.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              <div className="flex items-center justify-between gap-4">
                                <span>{f.name} - {f.location}</span>
                                {f.quantity_total > 1 && (
                                  <Badge variant="outline" className="text-xs">
                                    {f.quantity_total} unit
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedFacility && selectedFacility.quantity_total > 1 && (
                  <FormField
                    control={form.control}
                    name="quantity_requested"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jumlah Unit *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1}
                            max={selectedFacility.quantity_total}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            className="input-focus" 
                          />
                        </FormControl>
                        <FormDescription>
                          Tersedia maksimal {selectedFacility.quantity_total} unit
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Mulai *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="input-focus" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jam Mulai *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="input-focus" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Selesai *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="input-focus" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jam Selesai *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="input-focus" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Availability Alert */}
                {selectedFacilityId && startDate && endDate && (
                  <div className="mt-2">
                    {checkingAvailability ? (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memeriksa ketersediaan...
                      </div>
                    ) : availability ? (
                      availability.available ? (
                        <Alert className="border-accent bg-accent/5">
                          <CheckCircle className="w-4 h-4 text-accent" />
                          <AlertDescription className="text-accent">
                            Fasilitas tersedia pada jadwal yang dipilih
                            {availability.availableQuantity > 1 && ` (${availability.availableQuantity} unit tersedia)`}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive">
                          <AlertTriangle className="w-4 h-4" />
                          <AlertDescription>
                            {availability.message}
                          </AlertDescription>
                        </Alert>
                      )
                    ) : null}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="usage_purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Digunakan Untuk Apa / Keperluan *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Rapat organisasi, Seminar, Kegiatan UKM"
                          className="input-focus"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi Kegiatan *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Jelaskan detail kegiatan yang akan dilakukan (min. 10 karakter)"
                          className="min-h-[100px] input-focus"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* File Upload */}
                <div className="space-y-2">
                  <FormLabel>Upload Surat Proposal/Peminjaman *</FormLabel>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                      id="document-upload"
                    />
                    <label htmlFor="document-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      {selectedFile ? (
                        <div>
                          <p className="font-medium text-foreground">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Klik untuk upload atau drag & drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, JPG, PNG (maks. 10MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                  {fileError && (
                    <p className="text-sm text-destructive">{fileError}</p>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan Tambahan</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Catatan tambahan (opsional)"
                          className="min-h-[80px] input-focus"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitMutation.isPending || (availability && !availability.available)}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  'Kirim Pengajuan'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
