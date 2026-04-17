'use client';

import React, { useState } from 'react';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Pagination } from '@/src/admin-dashboard/components/common/Pagination';
import { Globe2, MapPin, TrendingUp, Search, Map } from 'lucide-react';

const MOCK_REGIONS = [
  { id: 'REG-1', country: 'United States', city: 'New York', total: 8400, active: 6200, inactive: 2200, blood: 7800, organ: 1200, pending: 45, growth: '+12%' },
  { id: 'REG-2', country: 'Bangladesh', city: 'Dhaka', total: 5200, active: 4800, inactive: 400, blood: 5100, organ: 150, pending: 120, growth: '+25%' },
  { id: 'REG-3', country: 'United Kingdom', city: 'London', total: 3100, active: 2100, inactive: 1000, blood: 2800, organ: 800, pending: 12, growth: '+4%' },
  { id: 'REG-4', country: 'Australia', city: 'Sydney', total: 1800, active: 1100, inactive: 700, blood: 1600, organ: 400, pending: 8, growth: '+2%' },
];

export default function RegionalUsersPage() {

  // API Integration Note: Geographic filtering logic should match platform algorithms: GET /api/admin/analytics/regions
  
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
            <p className="text-2xl font-bold">42</p>
            <p className="text-sm text-gray-500 mb-1">Countries</p>
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="text-emerald-500" size={20} />
            <p className="text-gray-500 text-sm font-medium">Total Hubs</p>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold">1,204</p>
            <p className="text-sm text-gray-500 mb-1">Cities</p>
          </div>
        </Card>

        <Card className="p-5 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-red-500" size={20} />
            <p className="text-red-600 text-sm font-medium">Highest Density</p>
          </div>
          <div className="flex flex-col">
            <p className="text-lg font-bold text-red-700 dark:text-red-400">United States</p>
            <p className="text-xs text-red-500">12,400 Users Total</p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-purple-500" size={20} />
            <p className="text-gray-500 text-sm font-medium">Top Growth Zone</p>
          </div>
          <div className="flex flex-col">
            <p className="text-lg font-bold">Dhaka, BD</p>
            <p className="text-xs text-emerald-500 font-bold">+25% this month</p>
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
             <input type="text" placeholder="Search country or city..." className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-red-500 outline-none" />
          </div>
        </div>
        <Table headers={['Region', 'Total Users', 'Active/Inactive', 'Donation Setup', 'Pending Reviews', 'Growth', 'Actions']}>
          {MOCK_REGIONS.map((region) => (
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
        <Pagination currentPage={1} totalPages={31} onPageChange={() => {}} />
      </div>
    </div>
  );
}
