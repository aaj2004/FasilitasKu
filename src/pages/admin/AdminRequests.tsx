import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllRequests, updateRequestStatus, deleteRequest, getStatusLogs } from '@/lib/api';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { exportToCSV } from '@/lib/csv';
import type { Request, RequestStatus, FacilityCategory } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Download, Search, Eye, Trash2, RefreshCcw, FileText, ExternalLink, Home, Package, Car } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const categoryConfig: Record<FacilityCategory, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  RUANGAN: { label: 'Ruangan', icon: Home },
  BARANG: { label: 'Barang', icon: Package },
  KENDARAAN: { label: 'Kendaraan', icon: Car },
};

export const AdminRequests = () => {
  const queryClient = useQueryClient();
  const { adminProfile } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<FacilityCategory | 'ALL'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [newStatus, setNewStatus] = useState<RequestStatus>('DIAJUKAN');
  const [adminNote, setAdminNote] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: getAllRequests,
  });

  const { data: statusLogs } = useQuery({
    queryKey: ['status-logs', selectedRequest?.id],
    queryFn: () => getStatusLogs(selectedRequest!.id),
    enabled: !!selectedRequest?.id,
  });

  // const updateStatusMutation = useMutation({
  //   mutationFn: () => updateRequestStatus(selectedRequest!.id, newStatus, adminProfile?.id || '', adminNote || undefined),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
  //     queryClient.invalidateQueries({ queryKey: ['status-logs'] });
  //     toast.success('Status berhasil diperbarui');
  //     setIsDetailOpen(false);
  //   },
  //   onError: (error: Error) => toast.error(error.message || 'Gagal memperbarui status'),
  // });


  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRequest?.id) {
        throw new Error('Request tidak valid');
      }

      await updateRequestStatus(
        selectedRequest.id,
        newStatus,
        adminProfile!.id,
        adminNote || undefined
      );
    },

    // onSuccess: () => {
    //   queryClient.invalidateQueries({ queryKey: ['status-logs'] });
    //   setIsDetailOpen(false);
    //   toast.success('Status berhasil diperbarui');
    // },

    onSuccess: async () => {
      // 🔥 AMBIL DATA LAMA DARI CACHE
      const prev = queryClient.getQueryData<Request[]>(['admin-requests']);

      if (prev && selectedRequest) {
        // 🔥 UPDATE STATUS SECARA LOKAL
        queryClient.setQueryData<Request[]>(['admin-requests'], (old) =>
          old
            ? old.map((r) =>
                r.id === selectedRequest.id
                  ? {
                      ...r,
                      status: newStatus,
                      admin_note: adminNote || null,
                      updated_at: new Date().toISOString(),
                    }
                  : r
              )
            : old
        );
      }

      // REFRESH LOG (BIAR RIWAYAT BENAR)
      queryClient.invalidateQueries({ queryKey: ['status-logs'] });

      setIsDetailOpen(false);
      toast.success('Status berhasil diperbarui');
    },

  });





  const deleteMutation = useMutation({
    mutationFn: deleteRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      toast.success('Pengajuan berhasil dihapus');
    },
    onError: () => toast.error('Gagal menghapus pengajuan'),
  });

  const openDetail = (request: Request) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setAdminNote(request.admin_note || '');
    setIsDetailOpen(true);
  };

  const handleExport = () => {
    if (!requests) return;
    const exportData = requests.map((r) => ({
      nim: r.student?.nim,
      nama_mahasiswa: r.student?.name,
      email: r.student?.email,
      phone: r.student?.phone,
      organisasi: r.borrower_org,
      fasilitas: r.facility?.name,
      kategori: r.facility?.category,
      lokasi: r.facility?.location,
      jumlah_unit: r.quantity_requested,
      mulai: format(new Date(r.start_datetime), 'dd/MM/yyyy HH:mm'),
      selesai: format(new Date(r.end_datetime), 'dd/MM/yyyy HH:mm'),
      keperluan: r.usage_purpose,
      deskripsi: r.purpose,
      catatan: r.notes,
      dokumen: r.document_url,
      status: r.status,
      catatan_admin: r.admin_note,
      dibuat: format(new Date(r.created_at), 'dd/MM/yyyy HH:mm'),
    }));
    exportToCSV(exportData, 'pengajuan', [
      { key: 'nim', label: 'NIM' },
      { key: 'nama_mahasiswa', label: 'Nama Mahasiswa' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'No HP' },
      { key: 'organisasi', label: 'Organisasi/UKM' },
      { key: 'fasilitas', label: 'Fasilitas' },
      { key: 'kategori', label: 'Kategori' },
      { key: 'lokasi', label: 'Lokasi' },
      { key: 'jumlah_unit', label: 'Jumlah Unit' },
      { key: 'mulai', label: 'Mulai' },
      { key: 'selesai', label: 'Selesai' },
      { key: 'keperluan', label: 'Keperluan' },
      { key: 'deskripsi', label: 'Deskripsi' },
      { key: 'catatan', label: 'Catatan' },
      { key: 'dokumen', label: 'Dokumen' },
      { key: 'status', label: 'Status' },
      { key: 'catatan_admin', label: 'Catatan Admin' },
      { key: 'dibuat', label: 'Dibuat' },
    ]);
  };

  const filteredRequests = requests?.filter((r) => {
    const matchesSearch =
      r.student?.nim?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.student?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.borrower_org?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.facility?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || r.facility?.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Data Pengajuan</h1>
          <p className="text-muted-foreground">Kelola pengajuan peminjaman fasilitas</p>
        </div>

        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari pengajuan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as RequestStatus | 'ALL')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
                <SelectItem value="DISETUJUI">Disetujui</SelectItem>
                <SelectItem value="DITOLAK">Ditolak</SelectItem>
                <SelectItem value="SELESAI">Selesai</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as FacilityCategory | 'ALL')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Kategori</SelectItem>
                {Object.entries(categoryConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary">{filteredRequests?.length || 0} pengajuan</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisasi/UKM</TableHead>
                  <TableHead>Fasilitas</TableHead>
                  <TableHead>Jadwal</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dokumen</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests?.map((request) => {
                  const CategoryIcon = request.facility?.category 
                    ? categoryConfig[request.facility.category]?.icon 
                    : Package;
                  
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.borrower_org || '-'}</p>
                          <p className="text-xs text-muted-foreground">{request.student?.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1">
                            <CategoryIcon className="w-3 h-3 text-muted-foreground" />
                            <p className="font-medium">{request.facility?.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{request.facility?.location}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(request.start_datetime), 'dd MMM yyyy', { locale: id })}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(request.start_datetime), 'HH:mm')} - {format(new Date(request.end_datetime), 'HH:mm')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{request.quantity_requested}</TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} size="sm" />
                      </TableCell>
                      <TableCell>
                        {request.document_url ? (
                          <a 
                            href={request.document_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openDetail(request)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Pengajuan</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus pengajuan ini?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(request.id)}>
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!filteredRequests || filteredRequests.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL' 
                        ? 'Tidak ada pengajuan yang cocok' 
                        : 'Belum ada pengajuan'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Organisasi/UKM</Label>
                    <p className="font-medium">{selectedRequest.borrower_org || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Mahasiswa</Label>
                    <p className="font-medium">{selectedRequest.student?.name}</p>
                    <p className="text-sm text-muted-foreground">NIM: {selectedRequest.student?.nim || '-'}</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.student?.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.student?.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Fasilitas</Label>
                    <p className="font-medium">{selectedRequest.facility?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.facility?.location}</p>
                    <Badge variant="outline" className="mt-1">
                      {selectedRequest.facility?.category && categoryConfig[selectedRequest.facility.category]?.label}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Jumlah Unit</Label>
                    <p className="font-medium">{selectedRequest.quantity_requested}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Jadwal</Label>
                    <p className="font-medium">
                      {format(new Date(selectedRequest.start_datetime), 'dd MMM yyyy HH:mm', { locale: id })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      s/d {format(new Date(selectedRequest.end_datetime), 'dd MMM yyyy HH:mm', { locale: id })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Keperluan</Label>
                    <p className="text-sm">{selectedRequest.usage_purpose}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Deskripsi Kegiatan</Label>
                    <p className="text-sm">{selectedRequest.purpose}</p>
                  </div>
                  {selectedRequest.notes && (
                    <div>
                      <Label className="text-muted-foreground">Catatan</Label>
                      <p className="text-sm">{selectedRequest.notes}</p>
                    </div>
                  )}
                  {selectedRequest.document_url && (
                    <div>
                      <Label className="text-muted-foreground">Dokumen Proposal</Label>
                      <a 
                        href={selectedRequest.document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline mt-1"
                      >
                        <FileText className="w-4 h-4" />
                        Lihat Dokumen
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" />
                  Update Status
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status Baru</Label>
                    <Select value={newStatus} onValueChange={(v) => setNewStatus(v as RequestStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
                        <SelectItem value="DISETUJUI">Disetujui</SelectItem>
                        <SelectItem value="DITOLAK">Ditolak</SelectItem>
                        <SelectItem value="SELESAI">Selesai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Catatan Admin {newStatus === 'DITOLAK' && <span className="text-destructive">* (wajib)</span>}
                    </Label>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder={newStatus === 'DITOLAK' ? 'Masukkan alasan penolakan' : 'Tambahkan catatan (opsional)'}
                      required={newStatus === 'DITOLAK'}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => updateStatusMutation.mutate()}
                  disabled={
                    updateStatusMutation.isPending || 
                    newStatus === selectedRequest.status ||
                    (newStatus === 'DITOLAK' && !adminNote.trim())
                  }
                  className="w-full"
                >
                  {updateStatusMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>

              </div>

              {/* Status Logs */}
              {statusLogs && statusLogs.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Riwayat Status</h3>
                  <div className="space-y-3">
                    {statusLogs.map((log) => (
                      <div key={log.id} className="flex items-center gap-4 text-sm">
                        <StatusBadge status={log.new_status} size="sm" />
                        <span className="text-muted-foreground">
                          {format(new Date(log.changed_at), 'dd MMM yyyy HH:mm', { locale: id })}
                        </span>
                        {log.admin && (
                          <span className="text-muted-foreground">oleh {log.admin.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
