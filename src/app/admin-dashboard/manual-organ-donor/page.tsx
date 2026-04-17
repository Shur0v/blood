'use client';

import React from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { UploadCloud, CheckCircle2, HeartPulse } from 'lucide-react';

export default function ManualOrganDonorPage() {

  // API Integration Note: 
  // Form submits to POST /api/admin/donors/manual
  // Organ selection data handled as array

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><HeartPulse className="text-purple-500"/> Manual Organ Donor Entry</h2>
        <p className="text-sm text-gray-500 mt-1">Register verified individuals to the backend Organ Donor Registry system manually.</p>
      </div>

      <form className="space-y-6">
        <Card title="Donor Primary Identity">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name *</label>
              <input type="text" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
              <input type="email" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Mobile Number *</label>
              <input type="tel" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Emergency Contact</label>
              <input type="tel" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Location Setup</label>
              <div className="flex gap-4">
                <input type="text" placeholder="Country" className="w-1/2 bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none" required />
                <input type="text" placeholder="City" className="w-1/2 bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none" required />
              </div>
            </div>
          </div>
        </Card>

        {/* Organ Selection UI */}
        <Card title="Willing Organ Pledge Selection">
           <p className="text-sm text-gray-500 mb-4 tracking-wide">Select the multiple organs the donor has officially pledged.</p>
           <div className="flex flex-wrap gap-3">
             {['Heart', 'Kidneys', 'Liver', 'Lungs', 'Corneas (Eyes)', 'Pancreas', 'Small Intestine', 'Skin Tissue'].map((organ) => (
               <label key={organ} className="relative cursor-pointer">
                 <input type="checkbox" className="peer sr-only" />
                 <div className="px-5 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1b23] text-gray-700 dark:text-gray-300 font-medium peer-checked:border-purple-500 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-500/10 peer-checked:text-purple-700 dark:peer-checked:text-purple-400 transition-all shadow-sm">
                   {organ}
                 </div>
               </label>
             ))}
             <div className="w-full mt-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Other (Specify)</label>
                <input type="text" className="w-full md:w-1/2 bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none" />
             </div>
           </div>
        </Card>

        <Card title="Verification & Consent Setup">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Medical Health Note</label>
                <textarea rows={2} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none" placeholder="Underlying conditions affecting donation scope..."></textarea>
              </div>
              <div className="flex gap-4 flex-col">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#0f1115]">
                  <input type="checkbox" className="w-5 h-5 text-purple-600 rounded border-gray-300" defaultChecked />
                  I confirm that physical or legal consent was received and verified.
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Visibility Preference</label>
                <select className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none">
                  <option>Publicly Listed (Verified Request Scope)</option>
                  <option>Private Registry (Backend Match Only)</option>
                </select>
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Medical Credential / Form Upload</label>
               <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-xl flex flex-col items-center justify-center h-[200px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                 <UploadCloud className="text-gray-400 mb-2" size={32} />
                 <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Consent PDF</p>
               </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
             <button type="button" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
               <CheckCircle2 size={18} /> Add to Organ Registry
             </button>
          </div>
        </Card>
      </form>

      <div className="pt-8">
        <h3 className="text-xl font-bold mb-4 border-t border-gray-200 dark:border-gray-800 pt-8">Recent Manual Organ Entries</h3>
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-[#1a1b23]">
          <Table headers={['ID', 'Name', 'Pledged Organs', 'Location', 'Consent', 'Actions']}>
            <TableRow>
              <TableCell className="font-semibold text-purple-600 dark:text-purple-400">ORG-M-112</TableCell>
              <TableCell>Elena Gilbert</TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  <span className="text-xs border border-gray-300 dark:border-gray-600 px-2 py-0.5 rounded-full">Corneas</span>
                  <span className="text-xs border border-gray-300 dark:border-gray-600 px-2 py-0.5 rounded-full">Kidneys</span>
                </div>
              </TableCell>
              <TableCell>NY, USA</TableCell>
              <TableCell><Badge type="success">Verified On File</Badge></TableCell>
              <TableCell><button className="text-sm font-medium text-blue-600">View</button></TableCell>
            </TableRow>
          </Table>
        </div>
      </div>
    </div>
  );
}
