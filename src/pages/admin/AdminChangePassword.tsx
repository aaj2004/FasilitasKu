import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, Key, ArrowLeft } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { adminChangePassword } from '@/lib/api';

// const changePasswordSchema = z.object({
//   newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
//   confirmPassword: z.string(),
// }).refine((data) => data.newPassword === data.confirmPassword, {
//   message: 'Password tidak sama',
//   path: ['confirmPassword'],
// });


const changePasswordSchema = z.object({
  oldPassword: z.string().min(6, 'Password lama wajib diisi'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password tidak sama',
  path: ['confirmPassword'],
});


type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const AdminChangePassword = () => {
  const navigate = useNavigate();
  const { updatePassword, isLoading, session, isAdmin } = useAdminAuth();

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  if (!isLoading && (!session || !isAdmin)) {
    navigate('/admin', { replace: true });
    return null;
  }

  // const onSubmit = async (data: ChangePasswordFormData) => {
  //   const { error } = await updatePassword(data.newPassword);
  //   if (error) {
  //     toast.error(error.message || 'Gagal mengubah password');
  //     return;
  //   }
  //   toast.success('Password berhasil diubah!');
  //   navigate('/admin/dashboard');
  // };

  // if (isLoading) {
  //   return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  // }
  

  const onSubmit = async (data: ChangePasswordFormData) => {
    if (!session?.user?.id) {
      toast.error('Sesi admin tidak valid, silakan login ulang');
      navigate('/admin');
      return;
    }

    try {
      await adminChangePassword(
        session.user.id,
        data.oldPassword,
        data.newPassword
      );

      toast.success('Password berhasil diubah!');
      navigate('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah password');
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ubah Password</h1>
          <p className="text-muted-foreground">Ganti password akun admin Anda</p>
        </div>
      </div>
      <Card className="max-w-md border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-campus-orange/10 flex items-center justify-center">
            <Key className="w-8 h-8 text-campus-orange" />
          </div>
          <CardTitle className="text-2xl">Password Baru</CardTitle>
          <CardDescription>Masukkan password baru untuk akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="oldPassword" render={({ field }) => (
                  <FormItem><FormLabel>Password Lama</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Password lama" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="newPassword" render={({ field }) => (
                <FormItem><FormLabel>Password Baru</FormLabel><FormControl><Input type="password" placeholder="Min. 6 karakter" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem><FormLabel>Konfirmasi Password Baru</FormLabel><FormControl><Input type="password" placeholder="Ulangi password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : 'Ubah Password'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};