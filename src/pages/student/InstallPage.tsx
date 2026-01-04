import { Download, Share, PlusSquare, Check, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWA } from '@/hooks/usePWA';

export const InstallPage = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWA();

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      // Installation started
    }
  };

  if (isInstalled) {
    return (
      <div className="container py-8 animate-fade-in">
        <Card className="max-w-md mx-auto border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-accent" />
            </div>
            <CardTitle className="text-xl">Sudah Terinstall!</CardTitle>
            <CardDescription>
              FasilitasKu sudah terinstall di perangkat Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Buka aplikasi dari home screen Anda untuk pengalaman terbaik.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-fade-in">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Install FasilitasKu
          </h1>
          <p className="text-muted-foreground">
            Akses lebih cepat langsung dari home screen
          </p>
        </div>

        {/* Benefits */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-6">
            <h2 className="font-semibold text-foreground mb-4">Keuntungan Install:</h2>
            <ul className="space-y-3">
              {[
                'Akses instan dari home screen',
                'Tampilan layar penuh tanpa browser',
                'Notifikasi status pengajuan',
                'Offline support untuk browsing',
              ].map((benefit, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Install Instructions */}
        {isIOS ? (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Share className="w-5 h-5 text-primary" />
                Cara Install di iPhone/iPad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Tap tombol Share</p>
                  <p className="text-sm text-muted-foreground">
                    Di bagian bawah browser Safari, tap ikon{' '}
                    <Share className="w-4 h-4 inline" />
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Pilih "Add to Home Screen"</p>
                  <p className="text-sm text-muted-foreground">
                    Scroll ke bawah dan tap{' '}
                    <PlusSquare className="w-4 h-4 inline" /> Add to Home Screen
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Tap "Add"</p>
                  <p className="text-sm text-muted-foreground">
                    Konfirmasi dengan tap "Add" di pojok kanan atas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isInstallable ? (
          <Button
            onClick={handleInstall}
            size="lg"
            className="w-full text-base shadow-glow"
          >
            <Download className="w-5 h-5 mr-2" />
            Install Sekarang
          </Button>
        ) : (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Cara Install di Android
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Buka menu browser</p>
                  <p className="text-sm text-muted-foreground">
                    Tap ikon titik tiga di pojok kanan atas Chrome
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Pilih "Install app" atau "Add to Home screen"</p>
                  <p className="text-sm text-muted-foreground">
                    Cari opsi install atau tambah ke home screen
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Konfirmasi instalasi</p>
                  <p className="text-sm text-muted-foreground">
                    Tap "Install" untuk menambahkan ke home screen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
