'use client';

import React, { useEffect, useState } from 'react';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Pagination } from '@/src/admin-dashboard/components/common/Pagination';
import { Globe2, MapPin, TrendingUp, Search, Map } from 'lucide-react';

interface RegionRow {
  id: string;
  country: string;
  city: string;
  total: number;
  active: number;
  inactive: number;
  blood: number;
  organ: number;
  pending: number;
  growth: string;
}

interface RegionMeta {
  globalReach: number;
  totalHubs: number;
  highestDensity: {
    country: string;
    users: number;
  };
  topGrowthZone: {
    city: string;
    country: string;
    growth: string;
  };
}

const PAGE_SIZE = 20;

export default function RegionalUsersPage() {
  const [rows, setRows] = useState<RegionRow[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<RegionMeta>({
    globalReach: 0,
    totalHubs: 0,
    highestDensity: { country: 'N/A', users: 0 },
    topGrowthZone: { city: 'N/A', country: 'N/A', growth: '+0%' },
  });

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (search.trim()) {
          params.set('search', search.trim());
        }
        const res = await fetch(`/api/admin/analytics/regions?${params.toString()}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        const payload = await res.json();

        if (!res.ok || !payload.success) {
          if (!isCancelled) {
            setRows([]);
            setTotalItems(0);
            setTotalPages(1);
          }
          return;
        }

        if (!isCancelled) {
          setRows(payload.data ?? []);
          setMeta(
            payload.meta ?? {
              globalReach: 0,
              totalHubs: 0,
              highestDensity: { country: 'N/A', users: 0 },
              topGrowthZone: { city: 'N/A', country: 'N/A', growth: '+0%' },
            },
          );
          setTotalItems(payload.pagination?.total ?? 0);
          setTotalPages(payload.pagination?.totalPages ?? 1);
        }
      } catch (error) {
        if (!isCancelled) {
          setRows([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();
    const timer = setInterval(() => {
      void loadData();
    }, 15000);

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [page, search]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Geographic Distribution</h2>
          <p className="text-sm text-gray-500 mt-1">Global platform reach mapped for location-first algorithm strategy.</p>
        </div>
      </div>

      {/* Top Regional KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <Globe2 className="text-blue-500" size={20} />
            <p className="text-gray-500 text-sm font-medium">Global Reach</p>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold">{meta.globalReach.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mb-1">Countries</p>
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="text-emerald-500" size={20} />
            <p className="text-gray-500 text-sm font-medium">Total Hubs</p>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold">{meta.totalHubs.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mb-1">Cities</p>
          </div>
        </Card>

        <Card className="p-5 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-red-500" size={20} />
            <p className="text-red-600 text-sm font-medium">Highest Density</p>
          </div>
          <div className="flex flex-col">
            <p className="text-lg font-bold text-red-700 dark:text-red-400">{meta.highestDensity.country}</p>
            <p className="text-xs text-red-500">{meta.highestDensity.users.toLocaleString()} Users Total</p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-purple-500" size={20} />
            <p className="text-gray-500 text-sm font-medium">Top Growth Zone</p>
          </div>
          <div className="flex flex-col">
            <p className="text-lg font-bold">{meta.topGrowthZone.city}, {meta.topGrowthZone.country}</p>
            <p className="text-xs text-emerald-500 font-bold">{meta.topGrowthZone.growth} this month</p>
          </div>
        </Card>
      </div>

      {/* Map visual area */}
      <div className="h-80 bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
        <Map className="absolute text-gray-100 dark:text-gray-800/50 w-[800px] h-[800px] pointer-events-none" />
        <div className="z-10 text-center">
           <MapPin size={48} className="text-red-500/50 mx-auto mb-4" />
           <p className="text-gray-500 font-bold tracking-wide">INTERACTIVE MAP VISUALIZATION CANVAS</p>
           <p className="text-sm text-gray-400 mt-2">Will render D3.js or Mapbox global distribution dynamically.</p>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white dark:bg-[#1a1b23]">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/10">
          <h3 className="font-bold">Regional Distribution Table</h3>
          <div className="relative w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input
               type="text"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Search country or city..."
               className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-red-500 outline-none"
             />
          </div>
        </div>
        <Table headers={['Region', 'Total Users', 'Active/Inactive', 'Donation Setup', 'Pending Reviews', 'Growth', 'Actions']}>
          {rows.map((region) => (
            <TableRow key={region.id}>
              <TableCell>
                <p className="font-bold text-gray-900 dark:text-gray-100">{region.country}</p>
                <p className="text-xs text-gray-500 mt-0.5">{region.city}</p>
              </TableCell>
              <TableCell>
                <span className="text-lg font-bold">{region.total.toLocaleString()}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm">
                   <span className="text-emerald-500 font-semibold" title="Active">{region.active.toLocaleString()}</span>
                   <span className="text-gray-300">/</span>
                   <span className="text-gray-500 font-semibold" title="Inactive">{region.inactive.toLocaleString()}</span>
                </div>
              </TableCell>
              <TableCell>
                 <div className="flex flex-col gap-1 text-xs text-gray-500">
                   <span>Blood: <span className="font-semibold text-red-500">{region.blood.toLocaleString()}</span></span>
                   <span>Organ: <span className="font-semibold text-gray-700 dark:text-gray-300">{region.organ.toLocaleString()}</span></span>
                 </div>
              </TableCell>
              <TableCell>
                 {region.pending > 0 ? (
                   <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2.5 py-1 rounded-md text-xs font-bold">
                     {region.pending} Verifications
                   </span>
                 ) : (
                   <span className="text-gray-400 text-sm">Clear</span>
                 )}
              </TableCell>
              <TableCell>
                <span className="text-emerald-500 font-bold text-sm bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">{region.growth}</span>
              </TableCell>
              <TableCell>
                <button className="text-sm font-medium text-red-600 hover:underline">Drill Down</button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
        {!isLoading && rows.length === 0 && (
          <div className="px-6 py-8 text-sm font-semibold text-gray-500">No regional data found.</div>
        )}
        {isLoading && (
          <div className="px-6 py-8 text-sm font-semibold text-gray-500">Loading regional analytics...</div>
        )}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
