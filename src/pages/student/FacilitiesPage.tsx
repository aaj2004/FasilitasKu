import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getFacilities } from '@/lib/api';
import type { FacilityCategory } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { MapPin, Users, Wifi, FileText, ArrowRight, Package, Car, Home, Layers, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const categoryConfig: Record<FacilityCategory | 'ALL', { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  ALL: { label: 'Semua', icon: Layers },
  RUANGAN: { label: 'Ruangan', icon: Home },
  BARANG: { label: 'Barang', icon: Package },
  KENDARAAN: { label: 'Kendaraan', icon: Car },
};

export const FacilitiesPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<FacilityCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize search from URL params
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  const { data: facilities, isLoading, error } = useQuery({
    queryKey: ['facilities'],
    queryFn: () => getFacilities(),
  });

  const filteredFacilities = useMemo(() => {
    if (!facilities) return [];
    let result = facilities;
    
    // Filter by category
    if (selectedCategory !== 'ALL') {
      result = result.filter(f => f.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => 
        f.name.toLowerCase().includes(query) ||
        f.location.toLowerCase().includes(query) ||
        f.amenities?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [facilities, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    if (!facilities) return {};
    const counts: Record<string, number> = { ALL: facilities.length };
    facilities.forEach(f => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });
    return counts;
  }, [facilities]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-destructive">Gagal memuat data fasilitas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Daftar Fasilitas
        </h1>
        <p className="text-muted-foreground">
          Pilih fasilitas yang ingin Anda pinjam
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cari fasilitas berdasarkan nama, lokasi, atau fasilitas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Tabs */}
      <div className="mb-6">
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as FacilityCategory | 'ALL')}>
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            {Object.entries(categoryConfig).map(([key, { label, icon: Icon }]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-full border"
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {categoryCounts[key] || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacilities?.map((facility, index) => {
          const CategoryIcon = categoryConfig[facility.category]?.icon || Package;
          
          return (
            <Card 
              key={facility.id} 
              className="card-hover border-0 shadow-md animate-slide-up overflow-hidden"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="h-3 gradient-primary" />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{facility.name}</CardTitle>
                  <Badge variant="outline" className="shrink-0">
                    <CategoryIcon className="w-3 h-3 mr-1" />
                    {categoryConfig[facility.category]?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{facility.location}</span>
                  </div>
                  {facility.category === 'RUANGAN' && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Kapasitas: {facility.capacity} orang</span>
                    </div>
                  )}
                  {(facility.category === 'BARANG' || facility.category === 'KENDARAAN') && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Package className="w-4 h-4" />
                      <span>Tersedia: {facility.quantity_total} unit</span>
                    </div>
                  )}
                </div>

                {facility.amenities && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Wifi className="w-4 h-4 text-primary" />
                      <span>Fasilitas</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {facility.amenities.split(',').slice(0, 3).map((item, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {item.trim()}
                        </Badge>
                      ))}
                      {facility.amenities.split(',').length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{facility.amenities.split(',').length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {facility.rules && (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center gap-1 font-medium mb-1">
                      <FileText className="w-3 h-3" />
                      Aturan
                    </div>
                    <p className="line-clamp-2">{facility.rules}</p>
                  </div>
                )}

                <Button asChild className="w-full" size="sm">
                  <Link to={`/booking?facility=${facility.id}`}>
                    Pinjam {categoryConfig[facility.category]?.label}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!filteredFacilities || filteredFacilities.length === 0) && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {selectedCategory === 'ALL' 
              ? 'Belum ada fasilitas yang tersedia'
              : `Belum ada ${categoryConfig[selectedCategory]?.label.toLowerCase()} yang tersedia`
            }
          </p>
        </div>
      )}
    </div>
  );
};
