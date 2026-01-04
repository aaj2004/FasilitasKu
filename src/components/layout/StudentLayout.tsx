import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { InstallBanner } from './InstallBanner';
import { usePWA } from '@/hooks/usePWA';

export const StudentLayout = () => {
  const { isInstalled } = usePWA();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Show install banner only if not installed */}
      {/* {!isInstalled && <InstallBanner />} */}
      <Header />
      <main className="page-container flex-1">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
};
