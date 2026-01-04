import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

// Kode akses rahasia - ganti dengan kode yang lebih kuat di produksi
const SECRET_ACCESS_CODE = 'ADMIN2026-SECURE';

interface SecureAdminGateProps {
  onAccessGranted: () => void;
}

export const SecureAdminGate = ({ onAccessGranted }: SecureAdminGateProps) => {
  const [accessCode, setAccessCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      toast.error('Terlalu banyak percobaan. Coba lagi nanti.');
      return;
    }

    if (accessCode === SECRET_ACCESS_CODE) {
      // Simpan status akses ke session storage (hilang saat browser ditutup)
      sessionStorage.setItem('admin_gate_access', 'granted');
      onAccessGranted();
      toast.success('Akses diberikan');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setIsBlocked(true);
        toast.error('Akses diblokir. Terlalu banyak percobaan gagal.');
        // Block selama 5 menit
        setTimeout(() => {
          setIsBlocked(false);
          setAttempts(0);
        }, 5 * 60 * 1000);
      } else {
        toast.error(`Kode akses salah. Percobaan ${newAttempts}/3`);
      }
      setAccessCode('');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg animate-scale-in">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-destructive/10 flex items-center justify-center">
            {isBlocked ? (
              <ShieldAlert className="w-8 h-8 text-destructive" />
            ) : (
              <Lock className="w-8 h-8 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl">Area Terbatas</CardTitle>
          <CardDescription>
            {isBlocked 
              ? 'Akses diblokir sementara. Coba lagi dalam beberapa menit.'
              : 'Masukkan kode akses untuk melanjutkan'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode">Kode Akses</Label>
              <Input
                id="accessCode"
                type="password"
                placeholder="Masukkan kode akses"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                disabled={isBlocked}
                autoComplete="off"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isBlocked || !accessCode.trim()}
            >
              Verifikasi Akses
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
