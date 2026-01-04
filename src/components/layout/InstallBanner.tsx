import { Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

export const InstallBanner = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWA();

  if (isInstalled) return null;

  const handleInstall = async () => {
    await promptInstall();
  };

  return (
    <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-2 px-4">
      <div className="container flex items-center justify-between gap-4">
        <p className="text-sm font-medium truncate">
          Install FasilitasKu untuk akses cepat!
        </p>
        {isInstallable ? (
          <Button
            onClick={handleInstall}
            size="sm"
            variant="secondary"
            className="flex-shrink-0 text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Install
          </Button>
        ) : (
          <Button asChild size="sm" variant="secondary" className="flex-shrink-0 text-xs">
            <Link to="/install">
              <Download className="w-3 h-3 mr-1" />
              Install
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};
