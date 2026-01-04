import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRequestsByUser, getRequestsByNim } from '@/lib/api';
import { getUserIdentifier, saveUserIdentifier } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Search, Calendar, MapPin, ChevronRight, FileText, Hash } from 'lucide-react';
import type { RequestStatus, Request } from '@/types/database';

export const MyRequestsPage = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nim, setNim] = useState('');
  const [searchMode, setSearchMode] = useState<'email-phone' | 'nim'>('email-phone');
  const [isSearched, setIsSearched] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL');

  const savedUser = getUserIdentifier();

  useEffect(() => {
    if (savedUser) {
      setEmail(savedUser.email);
      setPhone(savedUser.phone);
      setIsSearched(true);
    }
  }, []);

  const { data: requestsByEmailPhone, isLoading: isLoadingEmailPhone, error: errorEmailPhone, refetch: refetchEmailPhone } = useQuery({
    queryKey: ['my-requests', email, phone],
    queryFn: () => getRequestsByUser(email, phone),
    enabled: isSearched && searchMode === 'email-phone' && !!email && !!phone,
  });

  const { data: requestsByNim, isLoading: isLoadingNim, error: errorNim, refetch: refetchNim } = useQuery({
    queryKey: ['my-requests-nim', nim],
    queryFn: () => getRequestsByNim(nim),
    enabled: isSearched && searchMode === 'nim' && !!nim,
  });

  const requests: Request[] | undefined = searchMode === 'email-phone' ? requestsByEmailPhone : requestsByNim;
  const isLoading = searchMode === 'email-phone' ? isLoadingEmailPhone : isLoadingNim;
  const error = searchMode === 'email-phone' ? errorEmailPhone : errorNim;

  const handleSearchEmailPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone) return;

    saveUserIdentifier({ email, phone });
    setSearchMode('email-phone');
    setIsSearched(true);
  };


  const handleSearchNim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nim) return;

    setSearchMode('nim');
    setIsSearched(true);
  };

  const filteredRequests = requests?.filter((r) => 
    statusFilter === 'ALL' ? true : r.status === statusFilter
  );

  if (!isSearched || (!savedUser && searchMode === 'email-phone')) {
    return (
      <div className="container py-8 max-w-md mx-auto animate-fade-in">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Lacak Pengajuan</CardTitle>
            <CardDescription>
              Cari pengajuan berdasarkan Email & No HP atau NIM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email-phone" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="email-phone">Email & No HP</TabsTrigger>
                <TabsTrigger value="nim">NIM</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email-phone">
                <form onSubmit={handleSearchEmailPhone} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-focus"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor HP</Label>
                    <Input
                      id="phone"
                      placeholder="08xxxxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-focus"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Search className="mr-2 w-4 h-4" />
                    Cari Pengajuan
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="nim">
                <form onSubmit={handleSearchNim} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nim">NIM (Nomor Induk Mahasiswa)</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="nim"
                        placeholder="Masukkan NIM"
                        value={nim}
                        onChange={(e) => setNim(e.target.value)}
                        className="pl-10 input-focus"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    <Search className="mr-2 w-4 h-4" />
                    Cari Pengajuan
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Pengajuan Saya
          </h1>
          <p className="text-sm text-muted-foreground">
            {searchMode === 'nim' ? `NIM: ${nim}` : `${email} • ${phone}`}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as RequestStatus | 'ALL')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
              <SelectItem value="DISETUJUI">Disetujui</SelectItem>
              <SelectItem value="DIPROSES">Diproses</SelectItem>
              <SelectItem value="SELESAI">Selesai</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => {
            setIsSearched(false);
            setEmail('');
            setPhone('');
            setNim('');
          }}>
            Ganti Pencarian
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Gagal memuat data pengajuan</p>
        </div>
      ) : filteredRequests && filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((request, index) => (
            <Link key={request.id} to={`/my-requests/${request.id}`}>
              <Card 
                className="card-hover border-0 shadow-md cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusBadge status={request.status} />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(request.created_at), 'dd MMM yyyy', { locale: id })}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-foreground truncate mb-2">
                        {request.facility?.name}
                      </h3>
                      
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{request.facility?.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(request.start_datetime), 'dd MMM yyyy HH:mm', { locale: id })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span className="truncate">{request.purpose}</span>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            {statusFilter === 'ALL' 
              ? 'Belum ada pengajuan'
              : `Tidak ada pengajuan dengan status "${statusFilter}"`}
          </p>
          <Button asChild>
            <Link to="/booking">Ajukan Peminjaman</Link>
          </Button>
        </div>
      )}
    </div>
  );
};
