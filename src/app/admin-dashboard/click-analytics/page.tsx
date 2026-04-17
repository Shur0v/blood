'use client';

import React from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { Activity, MousePointerClick, TrendingUp, Monitor, Smartphone, Globe, Sparkles } from 'lucide-react';

export default function ClickAnalyticsPage() {

  // API Integration Note: 
  // GET /api/admin/analytics/clicks?range=today
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-2xl font-bold">Component Click Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">Deep-dive tracking of user interactions across all UI components and sections.</p>
      </div>

      {/* Main summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Today', val: '12,450', trend: '+14% vs yesterday' },
          { label: 'This Week', val: '84,921', trend: '+5% vs last week' },
          { label: 'This Month', val: '312,050', trend: '+22% vs last month' },
          { label: 'This Year', val: '2.1M', trend: 'Trending up' },
        ].map((stat, i) => (
          <Card key={i} className="p-5 border-l-4 border-l-red-500 rounded-lg">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</h4>
            <p className="text-3xl font-bold">{stat.val}</p>
            <p className="text-xs text-emerald-500 font-medium mt-2 flex items-center gap-1"><TrendingUp size={12}/> {stat.trend}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <Card title="Click Volume Trend (Line Chart)" className="col-span-2">
           <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-[#0f1115] border border-dashed border-gray-200 dark:border-gray-800 rounded-xl relative">
             <div className="absolute inset-0 bg-gradient-to-t from-red-500/5 to-transparent"></div>
             <Activity size={48} className="text-red-500/20 mb-2" />
             <p className="text-gray-400 font-medium">Recharts / Chart.js Canvas Rendering Area</p>
           </div>
        </Card>

        {/* AI Insights Proxy UI */}
        <Card title="AI Interaction Insights" className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <Sparkles className="text-blue-500 shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-gray-700 dark:text-gray-300">Users most frequently click <span className="font-bold text-blue-600 dark:text-blue-400">Donor Cards</span> immediately after opening blood group filters.</p>
            </div>
            <div className="flex gap-3 items-start">
              <Sparkles className="text-blue-500 shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-bold text-blue-600 dark:text-blue-400">Organ Request</span> section clicks surge by 45% during nighttime hours.</p>
            </div>
            <div className="flex gap-3 items-start">
              <Sparkles className="text-blue-500 shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-gray-700 dark:text-gray-300">Mobile users interact 3x more with the fixed floating CTA buttons than desktop users.</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Device Split" className="p-0">
          <div className="p-6 pb-2">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-gray-600"><Smartphone size={18}/> Mobile</div>
              <span className="font-bold">68%</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-gray-600"><Monitor size={18}/> Desktop</div>
              <span className="font-bold">29%</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-gray-600 text-sm pl-6">Tablet</div>
              <span className="font-bold">3%</span>
            </div>
          </div>
        </Card>

        <Card title="Top Sections Ranked" className="md:col-span-2">
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <span className="font-medium text-sm">Hero CTA ("Donate Now")</span>
               <div className="flex items-center gap-3">
                 <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="w-full h-full bg-red-500"></div></div>
                 <span className="text-sm font-bold w-12 text-right">4.2K</span>
               </div>
             </div>
             <div className="flex items-center justify-between">
               <span className="font-medium text-sm">Blood Group Quick Filter</span>
               <div className="flex items-center gap-3">
                 <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="w-[80%] h-full bg-red-400"></div></div>
                 <span className="text-sm font-bold w-12 text-right">3.3K</span>
               </div>
             </div>
             <div className="flex items-center justify-between">
               <span className="font-medium text-sm">Organ Request Form Submit</span>
               <div className="flex items-center gap-3">
                 <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="w-[45%] h-full bg-red-300"></div></div>
                 <span className="text-sm font-bold w-12 text-right">1.8K</span>
               </div>
             </div>
           </div>
        </Card>
      </div>

      {/* Deep Section-wise Table */}
      <h3 className="text-xl font-bold pt-4">Detailed Component Tracking</h3>
      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-[#1a1b23]">
        <Table headers={['Page', 'Section/Component', 'Click Count', 'Daily Change', 'Weekly Change', 'Trend']}>
           <TableRow>
             <TableCell>Homepage</TableCell>
             <TableCell className="font-medium text-blue-600">Blood Group Quick Filter</TableCell>
             <TableCell>3,302</TableCell>
             <TableCell><Badge type="success">+4.2%</Badge></TableCell>
             <TableCell><Badge type="success">+12.1%</Badge></TableCell>
             <TableCell><TrendingUp size={16} className="text-emerald-500"/></TableCell>
           </TableRow>
           <TableRow>
             <TableCell>Organ Registry</TableCell>
             <TableCell className="font-medium text-blue-600">"Learn More" Info Icon</TableCell>
             <TableCell>892</TableCell>
             <TableCell><Badge type="danger">-1.5%</Badge></TableCell>
             <TableCell><Badge type="success">+3.2%</Badge></TableCell>
             <TableCell><TrendingUp size={16} className="text-emerald-500"/></TableCell>
           </TableRow>
           <TableRow>
             <TableCell>Community</TableCell>
             <TableCell className="font-medium text-blue-600">Story Card Slider Right Arrow</TableCell>
             <TableCell>4,105</TableCell>
             <TableCell><Badge type="success">+8.0%</Badge></TableCell>
             <TableCell><Badge type="success">+2.0%</Badge></TableCell>
             <TableCell><TrendingUp size={16} className="text-emerald-500"/></TableCell>
           </TableRow>
        </Table>
      </div>
    </div>
  );
}
