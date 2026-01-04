import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, ClipboardList, Building2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePWA } from '@/hooks/usePWA';

const navItems = [
  { path: '/', label: 'Beranda', icon: Home },
  { path: '/facilities', label: 'Fasilitas', icon: Building2 },
  { path: '/booking', label: 'Ajukan', icon: FileText },
  { path: '/my-requests', label: 'Pengajuan', icon: ClipboardList },
];

export const MobileNav = () => {
  const location = useLocation();
  const { isInstalled } = usePWA();

  // Add install option if not installed
  const displayItems = isInstalled
    ? navItems
    : [...navItems, { path: '/install', label: 'Install', icon: Download }];

  return (
    <nav className="mobile-nav md:hidden">
      <div className="flex justify-around items-center py-2">
        {displayItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const isInstallItem = item.path === '/install';

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground',
                isInstallItem && !isActive && 'text-accent'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
