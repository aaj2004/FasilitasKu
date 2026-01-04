import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Menu, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Beranda' },
  { path: '/facilities', label: 'Fasilitas' },
  { path: '/booking', label: 'Ajukan Peminjaman' },
  { path: '/my-requests', label: 'Pengajuan Saya' },
];

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/facilities?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-border">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground">FasilitasKu</h1>
            <p className="text-[10px] text-muted-foreground -mt-1">Peminjaman Fasilitas Kampus</p>
          </div>
        </Link>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="flex-1 md:hidden max-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari fasilitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </form>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                location.pathname === item.path
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'px-4 py-3 rounded-xl text-base font-medium transition-all duration-200',
                    location.pathname === item.path
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
