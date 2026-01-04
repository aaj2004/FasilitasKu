import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRequestDetail, getStatusLogs } from '@/lib/api';
import { getUserIdentifier } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowLeft, Building2, Calendar, Clock, FileText, MapPin, MessageSquare, User, Phone, Mail, Hash } from 'lucide-react';

export const RequestDetailPage = () => {
  const { id: requestId } = useParams();
  const navigate = useNavigate();
  const savedUser = getUserIdentifier();
  
  useEffect(() => {
    if (!savedUser) {
      navigate('/my-requests');
    }
  }, [savedUser, navigate]);

  const { data: request, isLoading, error } = useQuery({
    queryKey: ['request-detail', requestId, savedUser?.email, savedUser?.phone],
    queryFn: () => getRequestDetail(requestId!, savedUser!.email, savedUser!.phone),
    enabled: !!requestId && !!savedUser,
  });

  const { data: statusLogs } = useQuery({
    queryKey: ['status-logs', requestId],
    queryFn: () => getStatusLogs(requestId!),
    enabled: !!requestId,
  });

  if (isLoading) {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container py-8 max-w-2xl mx-auto text-center">
        <p className="text-destructive mb-4">Pengajuan tidak ditemukan</p>
        <Button asChild variant="outline">
          <Link to="/my-requests">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Kembali
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl mx-auto animate-fade-in">
      <Button asChild variant="ghost" className="mb-6">
        <Link to="/my-requests">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Kembali
        </Link>
      </Button>

      <div className="space-y-6">
        {/* Status Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-2 gradient-primary" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Detail Pengajuan</CardTitle>
              <StatusBadge status={request.status} size="lg" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Facility Info */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{request.facility?.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {request.facility?.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Mulai
                </p>
                <p className="font-semibold text-foreground">
                  {format(new Date(request.start_datetime), 'EEEE, dd MMMM yyyy', { locale: id })}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(request.start_datetime), 'HH:mm', { locale: id })} WIB
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Selesai
                </p>
                <p className="font-semibold text-foreground">
                  {format(new Date(request.end_datetime), 'EEEE, dd MMMM yyyy', { locale: id })}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(request.end_datetime), 'HH:mm', { locale: id })} WIB
                </p>
              </div>
            </div>

            <Separator />

            {/* Purpose & Notes */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />
                  Keperluan
                </p>
                <p className="text-foreground">{request.purpose}</p>
              </div>
              
              {request.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Catatan</p>
                  <p className="text-foreground">{request.notes}</p>
                </div>
              )}

              {request.admin_note && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm font-medium text-primary flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    Catatan Admin
                  </p>
                  <p className="text-foreground">{request.admin_note}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Applicant Info */}
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                <User className="w-4 h-4" />
                Data Pemohon
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    NIM
                  </p>
                  <p className="font-medium text-foreground">{request.student?.nim || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nama</p>
                  <p className="font-medium text-foreground">{request.student?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </p>
                  <p className="font-medium text-foreground">{request.student?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    No. HP
                  </p>
                  <p className="font-medium text-foreground">{request.student?.phone}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        {statusLogs && statusLogs.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Riwayat Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusLogs.map((log, index) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        index === statusLogs.length - 1 ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`} />
                      {index < statusLogs.length - 1 && (
                        <div className="w-0.5 h-full bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={log.new_status} size="sm" />
                        {log.admin && (
                          <span className="text-xs text-muted-foreground">
                            oleh {log.admin.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.changed_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
