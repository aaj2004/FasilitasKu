import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllStudents, updateStudent, deleteStudent } from '@/lib/api';
import { exportToCSV, parseCSV } from '@/lib/csv';
import type { Student } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Download, Upload, Search, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

export const AdminStudents = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nim: '',
    name: '',
    email: '',
    phone: '',
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: getAllStudents,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) => updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success('Data mahasiswa berhasil diperbarui');
      closeDialog();
    },
    onError: () => toast.error('Gagal memperbarui data'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success('Data mahasiswa berhasil dihapus');
    },
    onError: () => toast.error('Gagal menghapus data'),
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingStudent(null);
    setFormData({ nim: '', name: '', email: '', phone: '' });
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nim: student.nim || '',
      name: student.name,
      email: student.email,
      phone: student.phone,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data: formData });
    }
  };

  const handleExport = () => {
    if (!students) return;
    exportToCSV(students, 'mahasiswa', [
      { key: 'nim', label: 'NIM' },
      { key: 'name', label: 'Nama' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'No HP' },
      { key: 'created_at', label: 'Terdaftar' },
    ]);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseCSV<Student>(file, [
        { csvHeader: 'NIM', key: 'nim' },
        { csvHeader: 'Nama', key: 'name' },
        { csvHeader: 'Email', key: 'email' },
        { csvHeader: 'No HP', key: 'phone' },
      ]);

      let imported = 0;
      for (const item of data) {
        if (item.name && item.email && item.phone) {
          const { error } = await supabase.from('students').upsert(
            { nim: item.nim || null, name: item.name, email: item.email, phone: item.phone },
            { onConflict: 'email,phone' }
          );
          if (!error) imported++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success(`${imported} mahasiswa berhasil diimpor`);
    } catch (error: any) {
      toast.error(error.message);
    }
    e.target.value = '';
  };

  const filteredStudents = students?.filter((s) =>
    s.nim?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Data Mahasiswa</h1>
          <p className="text-muted-foreground">Data mahasiswa yang pernah mengajukan peminjaman</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 w-4 h-4" />
            Export CSV
          </Button>

          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="mr-2 w-4 h-4" />
                Import CSV
              </span>
            </Button>
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari mahasiswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">{filteredStudents?.length || 0} mahasiswa</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIM</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>No HP</TableHead>
                  <TableHead>Terdaftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents?.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.nim || '-'}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>{format(new Date(student.created_at), 'dd MMM yyyy', { locale: id })}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(student)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Data Mahasiswa</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus data "{student.name}"? Semua pengajuan terkait juga akan dihapus.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(student.id)}>
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredStudents || filteredStudents.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Tidak ada mahasiswa yang cocok' : 'Belum ada data mahasiswa'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Mahasiswa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>NIM</Label>
              <Input
                value={formData.nim}
                onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                placeholder="Masukkan NIM"
              />
            </div>
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>No HP</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={closeDialog} className="flex-1">
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
                Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
