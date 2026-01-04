import { useQuery } from '@tanstack/react-query';
import { getAllRequests, getAllFacilities, getAllStudents } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Building2, ClipboardList, Users, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { RequestStatus } from '@/types/database';

export const AdminDashboard = () => {
  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: getAllRequests,
  });

  const { data: facilities, isLoading: loadingFacilities } = useQuery({
    queryKey: ['admin-facilities'],
    queryFn: () => getAllFacilities(),
  });

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['admin-students'],
    queryFn: getAllStudents,
  });

  const isLoading = loadingRequests || loadingFacilities || loadingStudents;

  const statusCounts: Record<RequestStatus, number> = {
    DIAJUKAN: 0,
    DISETUJUI: 0,
    DITOLAK: 0,
    SELESAI: 0,
  };

  requests?.forEach((r) => {
    statusCounts[r.status]++;
  });

  const recentRequests = requests?.slice(0, 5) || [];

  const stats = [
    {
      title: 'Total Fasilitas',
      value: facilities?.length || 0,
      icon: Building2,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Total Pengajuan',
      value: requests?.length || 0,
      icon: ClipboardList,
      color: 'bg-accent/10 text-accent',
    },
    {
      title: 'Total Mahasiswa',
      value: students?.length || 0,
      icon: Users,
      color: 'bg-campus-orange/10 text-campus-orange',
    },
    {
      title: 'Menunggu Proses',
      value: statusCounts.DIAJUKAN,
      icon: Clock,
      color: 'bg-campus-purple/10 text-campus-purple',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di Admin Panel FasilitasKu</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="border-0 shadow-md animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Overview & Recent */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Overview */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Status Pengajuan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.entries(statusCounts) as [RequestStatus, number][]).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <StatusBadge status={status} />
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${requests?.length ? (count / requests.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Pengajuan Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{request.student?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{request.facility?.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={request.status} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(request.created_at), 'dd MMM', { locale: id })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Belum ada pengajuan</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
