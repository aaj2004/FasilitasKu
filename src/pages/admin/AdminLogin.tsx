import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, Shield } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { SecureAdminGate } from './SecureAdminGate';
import { adminLogin } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { signIn, isLoading, isAdmin, session } = useAdminAuth();
  const [hasAccess, setHasAccess] = useState(() => {
    return sessionStorage.getItem('admin_gate_access') === 'granted';
  });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (session && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [session, isAdmin, navigate]);

  // const onSubmit = async (data: LoginFormData) => {
  //   const { error } = await signIn(data.email, data.password);
  //   if (error) {
  //     toast.error(error.message || 'Email atau password salah');
  //     return;
  //   }
  //   toast.success('Login berhasil!');
  //   navigate('/admin/dashboard');
  // };

  const onSubmit = async (data: LoginFormData) => {
    const { error } = await signIn(data.email, data.password);

    if (error) {
      toast.error('Email atau password salah');
      return;
    }

    toast.success('Login berhasil');
    navigate('/admin/dashboard');
  };


  // const onSubmit = async (data) => {
  //   try {
  //     const admin = await adminLogin(data.email, data.password);
  //     sessionStorage.setItem('admin', JSON.stringify(admin));
  //     navigate('/admin/dashboard');
  //   } catch (e) {
  //     toast.error('Email atau password salah');
  //   }
  // };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Tampilkan gate kode akses jika belum terverifikasi
  if (!hasAccess) {
    return <SecureAdminGate onAccessGranted={() => setHasAccess(true)} />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Masuk ke dashboard admin FasilitasKu</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="admin@campus.ac.id" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Masuk...</> : 'Masuk'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};