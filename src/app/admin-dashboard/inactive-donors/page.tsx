'use client';

import React from 'react';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { Pagination } from '@/src/admin-dashboard/components/common/Pagination';
import { Search, Filter, Mail, UserCheck, AlertCircle } from 'lucide-react';

const MOCK_INACTIVE = [
  { id: 'USR-7701', name: 'James Wilson', bg: 'AB+', location: 'Sydney, AU', email: 'james.w@example.com', lastActive: '12-Jul-2026', verify: 'Full', organ: true, reason: 'Temporarily Unavailable' },
  { id: 'USR-7702', name: 'Anita Patel', bg: 'B-', location: 'Mumbai, IN', email: 'anita99@exampl.com', lastActive: '03-Sep-2026', verify: 'Unverified', organ: false, reason: 'Missing Verification' },
  { id: 'USR-7703', name: 'David Lee', bg: 'O-', location: 'Toronto, CA', email: 'david.l@gmail.com', lastActive: '14-Feb-2026', verify: 'Full', organ: false, reason: 'User Turned Off Availability' },
];

export default function InactiveDonorsPage() {

  // API Integration Note: 
  // GET /api/admin/users?status=inactive
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inactive Donor Management</h2>
          <p className="text-sm text-gray-500 mt-1">Review users who are registered but not publicly listed as active donors.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition">
            Export List (CSV)
          </button>
        </div>
      </div>

      {/* Top Analytics Block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1b23] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 text-sm font-medium">Total Inactive</p>
          <p className="text-2xl font-bold mt-1">4,051</p>
        </div>
        <div className="bg-white dark:bg-[#1a1b23] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 text-sm font-medium">Verified Inactive</p>
          <p className="text-2xl font-bold mt-1 text-emerald-500">1,240</p>
        </div>
        <div className="bg-white dark:bg-[#1a1b23] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 text-sm font-medium">Top Reason</p>
          <p className="text-sm font-bold mt-2 truncate text-red-500">Missing Verification</p>
        </div>
        <div className="bg-white dark:bg-[#1a1b23] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 text-sm font-medium">With Organ Registry</p>
          <p className="text-2xl font-bold mt-1 text-purple-500">312</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1a1b23] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search inactive users..." 
            className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <select className="bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            <option>All Reasons</option>
            <option>Temporarily Unavailable</option>
            <option>Missing Verification</option>
            <option>User Turned Off Availability</option>
          </select>
          <button className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white dark:bg-[#1a1b23]">
        <Table headers={['User Details', 'Contact', 'Reason Tag', 'Last Active', 'Status', 'Actions']}>
          {MOCK_INACTIVE.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex flex-col">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {user.name} 
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 tracking-wider text-gray-700 dark:bg-gray-700 dark:text-gray-300 leading-none">{user.bg}</span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">{user.location}</p>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm">{user.email}</p>
              </TableCell>
              <TableCell>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                  {user.reason === 'Missing Verification' && <AlertCircle size={12} className="text-amber-500" />}
                  {user.reason}
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600 dark:text-gray-400">{user.lastActive}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 items-start">
                  <Badge type={user.verify === 'Full' ? 'success' : 'danger'}>{user.verify === 'Full' ? 'Verified' : 'Unverified'}</Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                   <button className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition" title="Contact / Send Email">
                     <Mail size={18} />
                   </button>
                   <button className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition" title="Suggest Reactivation">
                     <UserCheck size={18} />
                   </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
        <Pagination currentPage={1} totalPages={203} onPageChange={() => {}} />
      </div>
    </div>
  );
}
