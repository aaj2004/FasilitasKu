import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  Key,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/facilities', label: 'Fasilitas', icon: Building2 },
  { path: '/admin/requests', label: 'Pengajuan', icon: ClipboardList },
  { path: '/admin/students', label: 'Mahasiswa', icon: Users },
  { path: '/admin/add-admin', label: 'Tambah Admin', icon: Users },
  { path: '/admin/change-password', label: 'Ubah Password', icon: Key },
  
];

export const AdminSidebar = () => {
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { adminProfile, signOut } = useAdminAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin');
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">FasilitasKu</h1>
            <p className="text-xs text-muted-foreground">Admin Dashboard</p>
          </div>
        </div>
        {adminProfile && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium text-foreground">{adminProfile.name}</p>
            <p className="text-xs text-muted-foreground truncate">{adminProfile.email}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 w-5 h-5" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">FasilitasKu Admin</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 pt-14">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="relative h-full w-72 bg-card flex flex-col animate-slide-up">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col">
        <SidebarContent />
      </aside>
    </>
  );
};
