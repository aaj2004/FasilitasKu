import { useState } from 'react';
import { adminRegister } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const AddAdmin = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      await adminRegister(name, email, password);
      toast.success('Admin berhasil ditambahkan');
      navigate('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Nama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password awal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Tambah Admin'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
