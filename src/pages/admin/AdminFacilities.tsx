import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllFacilities, createFacility, updateFacility, deleteFacility } from '@/lib/api';
import { exportToCSV, parseCSV } from '@/lib/csv';
import type { Facility, FacilityCategory } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Download, Upload, Search, Home, Package, Car } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

const categoryConfig: Record<FacilityCategory, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  RUANGAN: { label: 'Ruangan', icon: Home },
  BARANG: { label: 'Barang', icon: Package },
  KENDARAAN: { label: 'Kendaraan', icon: Car },
};

export const AdminFacilities = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FacilityCategory | 'ALL'>('ALL');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: 0,
    amenities: '',
    rules: '',
    is_active: true,
    category: 'RUANGAN' as FacilityCategory,
    quantity_total: 1,
  });

  const { data: facilities, isLoading } = useQuery({
    queryKey: ['admin-facilities'],
    queryFn: () => getAllFacilities(),
  });

  const createMutation = useMutation({
    mutationFn: createFacility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-facilities'] });
      toast.success('Fasilitas berhasil ditambahkan');
      closeDialog();
    },
    onError: () => toast.error('Gagal menambahkan fasilitas'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Facility> }) => updateFacility(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-facilities'] });
      toast.success('Fasilitas berhasil diperbarui');
      closeDialog();
    },
    onError: () => toast.error('Gagal memperbarui fasilitas'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFacility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-facilities'] });
      toast.success('Fasilitas berhasil dihapus');
    },
    onError: () => toast.error('Gagal menghapus fasilitas'),
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingFacility(null);
    setFormData({
      name: '',
      location: '',
      capacity: 0,
      amenities: '',
      rules: '',
      is_active: true,
      category: 'RUANGAN',
      quantity_total: 1,
    });
  };

  const openEditDialog = (facility: Facility) => {
    setEditingFacility(facility);
    setFormData({
      name: facility.name,
      location: facility.location,
      capacity: facility.capacity,
      amenities: facility.amenities || '',
      rules: facility.rules || '',
      is_active: facility.is_active,
      category: facility.category,
      quantity_total: facility.quantity_total,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFacility) {
      updateMutation.mutate({ id: editingFacility.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleExport = () => {
    if (!facilities) return;
    exportToCSV(facilities, 'fasilitas', [
      { key: 'name', label: 'Nama' },
      { key: 'category', label: 'Kategori' },
      { key: 'location', label: 'Lokasi' },
      { key: 'capacity', label: 'Kapasitas' },
      { key: 'quantity_total', label: 'Jumlah Unit' },
      { key: 'amenities', label: 'Fasilitas Pendukung' },
      { key: 'rules', label: 'Aturan' },
      { key: 'is_active', label: 'Status Aktif' },
      { key: 'created_at', label: 'Dibuat' },
    ]);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseCSV<Facility>(file, [
        { csvHeader: 'Nama', key: 'name' },
        { csvHeader: 'Kategori', key: 'category' },
        { csvHeader: 'Lokasi', key: 'location' },
        { csvHeader: 'Kapasitas', key: 'capacity' },
        { csvHeader: 'Jumlah Unit', key: 'quantity_total' },
        { csvHeader: 'Fasilitas Pendukung', key: 'amenities' },
        { csvHeader: 'Aturan', key: 'rules' },
        { csvHeader: 'Status Aktif', key: 'is_active' },
      ]);

      for (const item of data) {
        if (item.name && item.location) {
          const category = ['RUANGAN', 'BARANG', 'KENDARAAN'].includes(String(item.category)) 
            ? item.category as FacilityCategory 
            : 'RUANGAN';
          
          await supabase.from('facilities').insert({
            name: item.name,
            location: item.location,
            category,
            capacity: Number(item.capacity) || 0,
            quantity_total: Number(item.quantity_total) || 1,
            amenities: item.amenities || null,
            rules: item.rules || null,
            is_active: String(item.is_active).toLowerCase() === 'true',
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['admin-facilities'] });
      toast.success(`${data.length} fasilitas berhasil diimpor`);
    } catch (error: any) {
      toast.error(error.message);
    }
    e.target.value = '';
  };

  const filteredFacilities = facilities?.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Data Fasilitas</h1>
          <p className="text-muted-foreground">Kelola fasilitas kampus</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 w-4 h-4" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFacility ? 'Edit Fasilitas' : 'Tambah Fasilitas'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Kategori *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v as FacilityCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, { label, icon: Icon }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nama Fasilitas *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lokasi *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                {formData.category === 'RUANGAN' && (
                  <div className="space-y-2">
                    <Label>Kapasitas (orang)</Label>
                    <Input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                )}
                {(formData.category === 'BARANG' || formData.category === 'KENDARAAN') && (
                  <div className="space-y-2">
                    <Label>Jumlah Unit *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.quantity_total}
                      onChange={(e) => setFormData({ ...formData, quantity_total: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Fasilitas Pendukung</Label>
                  <Textarea
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                    placeholder="Pisahkan dengan koma"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aturan / Syarat</Label>
                  <Textarea
                    value={formData.rules}
                    onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Aktif</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog} className="flex-1">
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingFacility ? 'Simpan' : 'Tambah'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari fasilitas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
            <Badge variant="secondary">{filteredFacilities?.length || 0} fasilitas</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Kapasitas/Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFacilities?.map((facility) => {
                  const CategoryIcon = categoryConfig[facility.category]?.icon || Package;
                  return (
                    <TableRow key={facility.id}>
                      <TableCell className="font-medium">{facility.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <CategoryIcon className="w-3 h-3 mr-1" />
                          {categoryConfig[facility.category]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{facility.location}</TableCell>
                      <TableCell>
                        {facility.category === 'RUANGAN' 
                          ? `${facility.capacity} orang`
                          : `${facility.quantity_total} unit`
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={facility.is_active ? 'default' : 'secondary'}>
                          {facility.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(facility.created_at), 'dd MMM yyyy', { locale: id })}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(facility)}>
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
                                <AlertDialogTitle>Hapus Fasilitas</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus fasilitas "{facility.name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(facility.id)}>
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
                {(!filteredFacilities || filteredFacilities.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || categoryFilter !== 'ALL' ? 'Tidak ada fasilitas yang cocok' : 'Belum ada fasilitas'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
