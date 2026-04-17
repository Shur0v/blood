'use client';

import React, { useState } from 'react';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { Modal } from '@/src/admin-dashboard/components/common/Modal';
import { Pagination } from '@/src/admin-dashboard/components/common/Pagination';
import { Search, Filter, MoreVertical, Edit2, Shield, Eye, ShieldAlert, HeartPulse } from 'lucide-react';

const MOCK_USERS = [
  { id: 'USR-8901', name: 'John Doe', avatar: 'J', bg: 'O+', country: 'USA', city: 'New York', phone: '+1 555-0100', email: 'john@example.com', active: true, verified: 'Full', lastDon: '24-Sep-2026', organYes: true, created: '01-Jan-2025' },
  { id: 'USR-8902', name: 'Sarah Connor', avatar: 'S', bg: 'A-', country: 'UK', city: 'London', phone: '+44 7123 456', email: 'sarah.c@gmail.com', active: true, verified: 'Pending', lastDon: '15-Aug-2026', organYes: false, created: '14-Feb-2026' },
  { id: 'USR-8903', name: 'Alim Hossain', avatar: 'A', bg: 'B+', country: 'Bangladesh', city: 'Dhaka', phone: '+880 1711-223', email: 'alim@domain.com', active: false, verified: 'Unverified', lastDon: 'None', organYes: false, created: '21-Oct-2026' },
];

export default function AllUserList() {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // API Integration Note: 
  // GET /api/admin/users?page=1&limit=20&search=...&country=...
  // Data Mapping occurs below:

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">All User Management</h2>
          <p className="text-sm text-gray-500 mt-1">Browse, filter, and manage all 24,592 platform users.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1a1b23] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, ID, city, email..." 
            className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mock filters that would map to API query params */}
          <select className="bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            <option>All Blood Groups</option>
            <option>O+</option><option>A-</option>
          </select>
          <select className="hidden sm:block bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            <option>All Countries</option>
            <option>USA</option><option>UK</option><option>Bangladesh</option>
          </select>
          <button className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700">
            <Filter size={16} /> More Filters
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white dark:bg-[#1a1b23]">
        <Table headers={['User', 'Location', 'Contact Details', 'Status / Verification', 'Last Donated', 'Created', 'Actions']}>
          {MOCK_USERS.map((user) => (
            <TableRow key={user.id} onClick={() => { setSelectedUser(user); setIsDetailOpen(true); }}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 font-bold flex items-center justify-center shrink-0 border border-red-200 dark:border-red-500/30">
                    {user.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {user.name} 
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-white leading-none">{user.bg}</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{user.id}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium">{user.city}</p>
                <p className="text-xs text-gray-500">{user.country}</p>
              </TableCell>
              <TableCell>
                <p className="text-sm">{user.phone}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5 items-start">
                  <Badge type={user.active ? 'success' : 'default'}>{user.active ? 'Active Donor' : 'Inactive'}</Badge>
                  {user.verified === 'Full' && <Badge type="success"><Shield size={10} className="mr-1 inline" /> Full Eval</Badge>}
                  {user.verified === 'Pending' && <Badge type="warning"><ShieldAlert size={10} className="mr-1 inline" /> Pending</Badge>}
                  {user.verified === 'Unverified' && <Badge type="danger">Unverified</Badge>}
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm">{user.lastDon}</p>
                {user.organYes && <Badge type="info" className="mt-1"><HeartPulse size={10} className="mr-1 inline" /> Organ Registry</Badge>}
              </TableCell>
              <TableCell className="text-gray-500 text-xs">{user.created}</TableCell>
              <TableCell>
                <button 
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition"
                >
                  <MoreVertical size={18} />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
        <Pagination currentPage={1} totalPages={1230} onPageChange={() => {}} />
      </div>

      {/* User Detail Side Drawer / Modal Concept */}
      <Modal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        title="User Profile Detail"
        maxWidth="max-w-4xl"
        footer={
          <>
            <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg font-medium">Suspend Acc.</button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium flex items-center gap-2"><Edit2 size={16}/> Edit User</button>
          </>
        }
      >
        {selectedUser && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Core Info */}
            <div className="md:col-span-1 space-y-6">
              <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-800 rounded-2xl text-center">
                <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 font-bold text-4xl flex items-center justify-center shrink-0 border-4 border-white dark:border-[#1a1b23] shadow-lg mb-4">
                  {selectedUser.avatar}
                </div>
                <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">{selectedUser.id}</p>
                <div className="mt-4 flex gap-2">
                  <Badge type={selectedUser.active ? 'success' : 'default'}>{selectedUser.active ? 'Active' : 'Inactive'}</Badge>
                  <Badge type={selectedUser.verified === 'Full' ? 'success' : 'warning'}>{selectedUser.verified}</Badge>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-[#0f1115] p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Contact & Location</h4>
                <div className="space-y-3 text-sm">
                  <div><span className="text-gray-500 block text-xs">Email</span><span className="font-medium">{selectedUser.email}</span></div>
                  <div><span className="text-gray-500 block text-xs">Phone</span><span className="font-medium">{selectedUser.phone}</span></div>
                  <div><span className="text-gray-500 block text-xs">Region</span><span className="font-medium">{selectedUser.city}, {selectedUser.country}</span></div>
                </div>
              </div>
            </div>

            {/* Right Column: Health & Logs */}
            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-800 p-5 rounded-2xl">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Blood Group</h4>
                  <span className="text-3xl font-bold text-red-600">{selectedUser.bg}</span>
                </div>
                <div className="bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-800 p-5 rounded-2xl">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Organ Registry</h4>
                  <span className={`text-lg font-bold ${selectedUser.organYes ? 'text-emerald-500' : 'text-gray-500'}`}>
                    {selectedUser.organYes ? 'Registered (Kidney, Eyes)' : 'Not Opted In'}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-800 p-5 rounded-2xl">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Donor Health Data Summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 text-sm">
                  <div><span className="text-gray-500 block text-xs">Hemoglobin</span><span className="font-medium">14.2 g/dL</span></div>
                  <div><span className="text-gray-500 block text-xs">Diabetic</span><span className="font-medium">Type 2 (Controlled)</span></div>
                  <div><span className="text-gray-500 block text-xs">Allergies</span><span className="font-medium">Penicillin</span></div>
                  <div><span className="text-gray-500 block text-xs">Vaccinations</span><span className="font-medium">Hep B, Covid-19</span></div>
                  <div><span className="text-gray-500 block text-xs">Last Donation</span><span className="font-medium">{selectedUser.lastDon}</span></div>
                </div>

                {/* Prescription Image Preview Mock */}
                <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="bg-gray-200 dark:bg-gray-800 h-24 flex items-center justify-center group relative cursor-pointer">
                    <span className="text-gray-500 font-medium z-10 group-hover:opacity-0 transition">Medical_Clearance_Doc.pdf</span>
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Eye className="text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-800 p-5 rounded-2xl">
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Activity Logs</h4>
                 <ul className="space-y-3 text-sm">
                   <li className="flex gap-3 text-gray-600 dark:text-gray-300">
                     <span className="text-gray-400 text-xs pt-0.5">Oct 24</span> 
                     <span>Logged in from London, UK.</span>
                   </li>
                   <li className="flex gap-3 text-gray-600 dark:text-gray-300">
                     <span className="text-gray-400 text-xs pt-0.5">Aug 15</span> 
                     <span>Updated availability status to ACTIVE.</span>
                   </li>
                 </ul>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
