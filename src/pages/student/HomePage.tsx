import { Link } from 'react-router-dom';
import { Building2, FileText, ClipboardList, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const HomePage = () => {
  const features = [
    {
      icon: Building2,
      title: 'Lihat Fasilitas',
      description: 'Jelajahi berbagai fasilitas kampus yang tersedia untuk dipinjam',
      link: '/facilities',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: FileText,
      title: 'Ajukan Peminjaman',
      description: 'Isi form peminjaman fasilitas dengan mudah dan cepat',
      link: '/booking',
      color: 'bg-accent/10 text-accent',
    },
    {
      icon: ClipboardList,
      title: 'Lacak Pengajuan',
      description: 'Pantau status peminjaman Anda secara real-time',
      link: '/my-requests',
      color: 'bg-campus-orange/10 text-campus-orange',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="container relative py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-slide-up">
              <Sparkles className="w-4 h-4" />
              Layanan Non-Akademik Kampus
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Pinjam Fasilitas
              <span className="block text-primary">Kampus dengan Mudah</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Platform peminjaman fasilitas kampus yang simpel, cepat, dan transparan.
              Tidak perlu login, langsung ajukan peminjaman!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Button asChild size="lg" className="text-base px-8 shadow-glow">
                <Link to="/booking">
                  Ajukan Sekarang
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8">
                <Link to="/facilities">Lihat Fasilitas</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-12 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Layanan Kami
          </h2>
          <p className="text-muted-foreground">
            Semua yang Anda butuhkan untuk meminjam fasilitas kampus
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link key={feature.title} to={feature.link}>
              <Card 
                className="h-full card-hover cursor-pointer border-0 shadow-md"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-12 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Cara Kerja
          </h2>
          <p className="text-muted-foreground">
            Proses peminjaman yang simpel dan transparan
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: '1', title: 'Isi Form', desc: 'Lengkapi data diri dan pilih fasilitas' },
            { step: '2', title: 'Diajukan', desc: 'Pengajuan masuk ke sistem admin' },
            { step: '3', title: 'Diproses', desc: 'Admin mereview dan memproses' },
            { step: '4', title: 'Selesai', desc: 'Fasilitas siap digunakan' },
          ].map((item, index) => (
            <div key={item.step} className="text-center relative">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-glow">
                {item.step}
              </div>
              <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
              
              {index < 3 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Admin Link */}
      <section className="container py-8 mb-20 md:mb-0">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Admin?{' '}
            <Link to="/admin" className="text-primary hover:underline font-medium">
              Login ke Dashboard
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};
