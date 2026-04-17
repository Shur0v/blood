'use client';

import React from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { MousePointerClick, ChevronDown, SplitSquareVertical, Activity, MonitorSmartphone, Monitor, Smartphone } from 'lucide-react';

export default function HeatmapPage() {

  // API Integration Note: 
  // GET /api/admin/analytics/heatmap?page=homepage&device=mobile
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Heatmap Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Visually analyze where users click, scroll, and focus their attention.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm flex items-center gap-2 cursor-pointer shadow-sm">
             <span className="font-semibold">Compare Mode</span>
             <SplitSquareVertical size={16} className="text-gray-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
           <Card className="p-0">
             <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tracked Page Selector</label>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 cursor-pointer">
                  <span className="text-sm font-medium">Platform Homepage</span>
                  <ChevronDown size={16} className="text-gray-400"/>
                </div>
             </div>
             <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Heatmap Type</label>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-lg text-sm font-medium transition">
                    <MousePointerClick size={16} /> Click Heatmap
                  </button>
                  <button className="w-full flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent px-3 py-2 rounded-lg text-sm font-medium transition">
                    <SplitSquareVertical size={16} /> Scroll Depth map
                  </button>
                  <button className="w-full flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent px-3 py-2 rounded-lg text-sm font-medium transition">
                    <Activity size={16} /> Attention Map
                  </button>
                </div>
             </div>
             <div className="p-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Device Target</label>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                   <button className="flex-1 flex justify-center py-2 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100" title="Desktop">
                     <Monitor size={18} />
                   </button>
                   <button className="flex-1 flex justify-center py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 transition" title="Tablet">
                     <MonitorSmartphone size={18} />
                   </button>
                   <button className="flex-1 flex justify-center py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 transition" title="Mobile">
                     <Smartphone size={18} />
                   </button>
                </div>
             </div>
           </Card>

           <Card title="Analytics for Selection">
             <div className="space-y-4">
               <div>
                 <p className="text-sm text-gray-500">Total Recorded Sessions</p>
                 <p className="text-xl font-bold">14,029</p>
               </div>
               <hr className="border-gray-100 dark:border-gray-800" />
               <div>
                 <p className="text-sm text-gray-500">Average Scroll Depth</p>
                 <div className="flex items-center gap-3 mt-1">
                   <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                     <div className="w-[62%] h-full bg-blue-500"></div>
                   </div>
                   <span className="text-sm font-bold">62%</span>
                 </div>
               </div>
               <hr className="border-gray-100 dark:border-gray-800" />
               <div>
                 <p className="text-sm text-gray-500">Top Interaction Zone</p>
                 <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-1">Request Organ Form (Right Col)</p>
               </div>
             </div>
           </Card>
        </div>

        {/* Heatmap Area */}
        <div className="lg:col-span-3">
           <Card className="p-0 border-gray-800 bg-[#0a0a0c] overflow-hidden flex flex-col h-[800px]">
             <div className="p-3 border-b border-gray-800 bg-[#111115] flex justify-between items-center shrink-0">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                 <span className="text-xs text-gray-500 ml-2 font-mono">https://hemaflow.org / Desktop / Click Mode</span>
               </div>
               <div className="flex items-center gap-2 text-xs">
                 <span className="text-blue-500">Cold</span>
                 <div className="w-24 h-2 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full"></div>
                 <span className="text-red-500">Hot</span>
               </div>
             </div>
             
             {/* Mock canvas rendering area */}
             <div className="flex-1 relative overflow-y-auto custom-scrollbar flex items-start justify-center p-4">
                <div className="w-[1000px] h-[1500px] bg-white opacity-10 rounded-lg relative">
                   {/* This is just a proxy representation of where the iframe bounds would be */}
                   <div className="absolute top-20 left-1/4 w-[500px] h-64 border-2 border-red-500/50 rounded-xl bg-red-500/10 backdrop-blur-sm flex items-center justify-center">
                      <p className="text-red-400 font-bold opacity-100 shadow-sm text-lg">High Density Click Area</p>
                   </div>
                   <div className="absolute top-[400px] left-[10%] w-[300px] h-32 border-2 border-amber-500/50 rounded-xl bg-amber-500/10 backdrop-blur-sm"></div>
                   <div className="absolute top-[600px] left-[60%] w-[200px] h-20 border-2 border-blue-500/50 rounded-xl bg-blue-500/10 backdrop-blur-sm"></div>
                </div>
             </div>
           </Card>
        </div>

      </div>
    </div>
  );
}
