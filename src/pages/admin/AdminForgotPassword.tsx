import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Shield, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const AdminForgotPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAdminAuth();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const { error } = await resetPassword(data.email);
    
    if (error) {
      toast.error(error.message || 'Gagal mengirim email reset password');
      return;
    }
    
    toast.success('Link reset password telah dikirim ke email Anda');
    navigate('/portal-mgmt-2026');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Lupa Password</CardTitle>
          <CardDescription>
            Masukkan email Anda dan kami akan mengirimkan link untuk reset password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="admin@example.com" 
                        autoComplete="email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Kirim Link Reset
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <Link to="/portal-mgmt-2026" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
