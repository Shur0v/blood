'use client';

import React from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ManualBloodDonorPage() {

  // API Integration Note: 
  // Form submits to POST /api/admin/donors/manual
  // Table fetches from GET /api/admin/donors/manual?type=blood

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Manual Blood Donor Entry</h2>
        <p className="text-sm text-gray-500 mt-1">Add offline or verified institutional donor records directly into the searchable ecosystem.</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4 rounded-xl flex gap-3 text-sm text-blue-800 dark:text-blue-300 leading-relaxed shadow-sm">
        <AlertCircle className="shrink-0 mt-0.5 text-blue-500" size={18} />
        <p><strong>System Note:</strong> Donors added here automatically merge into the location-based algorithms. They will be visible to users in their respective regions based on the selected Country and City. Ensure consent is fully verified.</p>
      </div>

      <form className="space-y-6">
        {/* Core Identity */}
        <Card title="Donor Identity & Contact">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name *</label>
              <input type="text" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Mobile Number *</label>
              <input type="tel" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
              <input type="email" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Country *</label>
              <select className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none">
                <option>Select Country</option>
                <option>USA</option>
                <option>Bangladesh</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">City *</label>
              <input type="text" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Detailed Address Note</label>
              <input type="text" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
          </div>
        </Card>

        {/* Medical Setup */}
        <Card title="Medical Profile & Stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Blood Group *</label>
              <select className="w-full bg-red-50 dark:bg-red-500/10 text-red-600 font-bold border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" required>
                <option value="">Select Group</option>
                <option>O+</option><option>O-</option><option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Availability Status</label>
              <select className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none">
                <option>Active / Ready</option>
                <option>Inactive / Unavaliable</option>
                <option>Emergency Only</option>
              </select>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Last Donation Date</label>
               <input type="date" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none" />
            </div>
            
            {/* Health Vitals */}
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Weight (kg) / Height (cm)</label>
               <div className="flex gap-2">
                 <input type="number" placeholder="kg" className="w-1/2 bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none" />
                 <input type="number" placeholder="cm" className="w-1/2 bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none" />
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Diabetic Level</label>
               <select className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm outline-none">
                 <option>Non-Diabetic</option><option>Type 1</option><option>Type 2</option>
               </select>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Hemoglobin Level (g/dL)</label>
               <input type="text" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm outline-none" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Known Allergies</label>
               <input type="text" placeholder="e.g. Penicillin, Peanuts" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none" />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Vaccinations</label>
               <input type="text" placeholder="e.g. Hep B, COVID-19" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none" />
             </div>
          </div>
        </Card>

        {/* Admin Meta & Security */}
        <Card title="Verification & Consent Setup">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Data Source Origin</label>
                <select className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none">
                  <option>Offline Blood Camp</option>
                  <option>Partner Hospital</option>
                  <option>Direct Manual Outreach</option>
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-red-600 rounded border-gray-300" />
                  ID Verified Manually
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-red-600 rounded border-gray-300" defaultChecked />
                  Consent Received Formally
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Admin Notes</label>
                <textarea rows={3} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none" placeholder="Internal remarks regarding this record..."></textarea>
              </div>
            </div>

            {/* Document Upload Area */}
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Medical Proof / Prescription Upload</label>
               <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-xl flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                 <UploadCloud className="text-gray-400 mb-2" size={32} />
                 <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drag & drop files or click to browse</p>
                 <p className="text-xs text-gray-500 mt-1">Supports PDF, JPG, PNG up to 10MB</p>
               </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
             <button type="submit" className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
               <CheckCircle2 size={18} /> Add Donor Record
             </button>
          </div>
        </Card>
      </form>

      {/* Added Donors List preview */}
      <div className="pt-8">
        <h3 className="text-xl font-bold mb-4 border-t border-gray-200 dark:border-gray-800 pt-8">Recent Manual Entries</h3>
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-[#1a1b23]">
          <Table headers={['ID', 'Name', 'Blood Group', 'Location', 'Source', 'Status', 'Actions']}>
            <TableRow>
              <TableCell className="font-semibold">M-USR-001</TableCell>
              <TableCell>Kamal Hasan</TableCell>
              <TableCell><Badge type="danger">O+</Badge></TableCell>
              <TableCell>Dhaka, BD</TableCell>
              <TableCell className="text-gray-500">Offline Camp A</TableCell>
              <TableCell><Badge type="success">Active</Badge></TableCell>
              <TableCell><button className="text-sm font-medium text-blue-600">Edit</button></TableCell>
            </TableRow>
          </Table>
        </div>
      </div>
    </div>
  );
}
