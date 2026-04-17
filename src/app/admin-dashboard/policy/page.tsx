'use client';

import React from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { Scale, Save, RotateCcw, AlertTriangle, FileSignature, Clock, CheckCircle } from 'lucide-react';

export default function PolicyUpdatePage() {

  // API Integration Note: 
  // GET /api/admin/content/policy?category=terms
  // POST /api/admin/content/policy/update
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Scale className="text-blue-500"/> Legal & Policy Editor</h2>
          <p className="text-sm text-gray-500 mt-1">Manage global platform guidelines, privacy documents, and legal disclaimers.</p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-4 rounded-xl flex gap-3 text-sm text-amber-800 dark:text-amber-300 leading-relaxed shadow-sm">
        <AlertTriangle className="shrink-0 mt-0.5 text-amber-500" size={18} />
        <p><strong>Compliance Notice:</strong> Updates to the Privacy Policy or Terms of Service may require active users to re-consent upon their next login. Ensure legal review is complete before publishing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Editor Area */}
        <div className="lg:col-span-3 space-y-6">
           <Card className="p-0 overflow-hidden">
             
             <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
               <div className="flex-1 w-full">
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Policy Category</label>
                 <select className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500">
                   <option>Terms of Service</option>
                   <option>Privacy Policy</option>
                   <option>Organ Donation Legal Policy</option>
                   <option>Medical Disclaimer</option>
                   <option>Community Guidelines</option>
                   <option>Emergency Request Rules</option>
                 </select>
               </div>
               <div className="flex items-center gap-3">
                 <button className="px-4 py-2 bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition">Preview Edit</button>
               </div>
             </div>

             {/* Rich text mock */}
             <div className="p-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex gap-2 overflow-x-auto text-gray-600 dark:text-gray-300 p-2">
                 {/* Formatting controls */}
                 <button className="px-3 py-1 font-bold rounded hover:bg-gray-200 dark:hover:bg-gray-700">H1</button>
                 <button className="px-3 py-1 font-bold rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm">H2</button>
                 <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                 <button className="px-3 py-1 font-bold rounded hover:bg-gray-200 dark:hover:bg-gray-700">B</button>
                 <button className="px-3 py-1 italic rounded hover:bg-gray-200 dark:hover:bg-gray-700">I</button>
                 <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                 <button className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-xs flex items-center gap-1"><FileSignature size={12}/> Insert Highlighted Warning</button>
             </div>

             <div className="p-6 h-[500px]">
               <textarea className="w-full h-full resize-none text-gray-800 dark:text-gray-200 bg-transparent outline-none text-base leading-relaxed tracking-wide" placeholder="Enter formal legal text here..."></textarea>
             </div>

             <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 flex justify-between items-center">
                 <p className="text-sm text-gray-500">Last auto-saved: 2 mins ago</p>
                 <div className="flex gap-3">
                   <button className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-lg shadow-sm hover:opacity-90 flex items-center gap-2">
                     <Save size={16}/> Save Draft
                   </button>
                   <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md flex items-center gap-2">
                     <CheckCircle size={16}/> Publish Policy
                   </button>
                 </div>
             </div>
           </Card>
        </div>

        {/* Sidebar Layouts */}
        <div className="lg:col-span-1 space-y-6">
           <Card title="Current Document Metadata">
             <div className="space-y-4">
               <div>
                 <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</p>
                 <Badge type="info">Drafting Active</Badge>
               </div>
               <div>
                 <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Version Number</p>
                 <p className="font-bold">v3.2.0-draft</p>
               </div>
               <div>
                 <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Current Editor</p>
                 <p className="font-semibold text-sm">Super Admin</p>
               </div>
               <div>
                 <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Require Re-consent on publish?</p>
                 <label className="flex items-center gap-2 text-sm mt-1">
                   <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                   Yes, prompt all users
                 </label>
               </div>
             </div>
           </Card>

           <Card title="Version History">
             <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
                
                <div className="relative flex items-start gap-4">
                  <div className="absolute left-0 w-5 h-5 rounded-full bg-white dark:bg-[#1a1b23] border-2 border-blue-500 z-10"></div>
                  <div className="pl-8 pb-4">
                     <p className="text-sm font-bold text-gray-900 dark:text-gray-100">v3.1.5 (Live)</p>
                     <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock size={10}/> Published Sep 14, 2026</p>
                     <p className="text-xs font-semibold mt-1">By Legal Counsel Rep</p>
                     <button className="text-xs font-bold text-blue-500 mt-2 hover:underline">Compare Changes</button>
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className="absolute left-0 w-5 h-5 rounded-full bg-white dark:bg-[#1a1b23] border-2 border-gray-300 dark:border-gray-600 z-10"></div>
                  <div className="pl-8 pb-4">
                     <p className="text-sm font-bold text-gray-900 dark:text-gray-100">v3.1.0</p>
                     <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock size={10}/> Published Jan 01, 2026</p>
                     <p className="text-xs font-semibold mt-1">By Admin A</p>
                     <button className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-2 hover:text-gray-700 dark:hover:text-gray-300 transition border border-gray-200 dark:border-gray-700 rounded px-2 py-1"><RotateCcw size={10}/> Restore UI</button>
                  </div>
                </div>

             </div>
           </Card>
        </div>

      </div>
    </div>
  );
}
