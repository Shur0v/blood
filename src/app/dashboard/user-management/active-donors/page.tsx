'use client';

import React, { useState } from 'react';
import { Table, TableRow, TableCell } from '@/src/dashboard/user-management/components/Table';
import { Card } from '@/src/dashboard/user-management/components/Card';
import { StatusBadge } from '@/src/dashboard/user-management/components/StatusBadge';
import { FilterDropdown } from '@/src/dashboard/user-management/components/FilterDropdown';
import { Pagination } from '@/src/dashboard/user-management/components/Pagination';
import { MapPin, Search } from 'lucide-react';

const MOCK_DONORS = [
  { id: 'DON-01', name: 'John Doe', bloodGroup: 'O+', location: 'New York, USA', lastDonation: 'Aug 10, 2026', status: 'Active' },
  { id: 'DON-02', name: 'Jane Smith', bloodGroup: 'A-', location: 'London, UK', lastDonation: 'Sep 05, 2026', status: 'Active' },
  { id: 'DON-03', name: 'Mike Ross', bloodGroup: 'B+', location: 'Toronto, CA', lastDonation: 'Oct 01, 2026', status: 'Active' },
  { id: 'DON-04', name: 'Rachel Zane', bloodGroup: 'AB+', location: 'New York, USA', lastDonation: 'Jul 15, 2026', status: 'Inactive' },
  { id: 'DON-05', name: 'Harvey Specter', bloodGroup: 'O-', location: 'Sydney, AU', lastDonation: 'Never', status: 'Active' }
];

export default function ActiveDonorsPage() {
  const [bloodFilter, setBloodFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredDonors = MOCK_DONORS.filter(d => {
    return (!bloodFilter || d.bloodGroup === bloodFilter) &&
           (!locationFilter || d.location === locationFilter) &&
           (!statusFilter || d.status === statusFilter);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)]">Active Donors Registry</h2>
          <p className="text-[var(--text-muted)] text-sm">Manage users who have toggled "Available for Donation".</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Filters for API (e.g. GET /api/donors?bloodGroup=O+&location=New York) */}
          <FilterDropdown 
            label="Blood Group"
            options={['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']}
            value={bloodFilter}
            onChange={setBloodFilter}
          />
          <FilterDropdown 
            label="Location"
            options={['New York, USA', 'London, UK', 'Toronto, CA', 'Sydney, AU']}
            value={locationFilter}
            onChange={setLocationFilter}
          />
          <FilterDropdown 
            label="Availability"
            options={['Active', 'Inactive']}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-app)]/30">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text" 
              placeholder="Search donor name..." 
              className="w-full bg-[var(--bg-app)] border border-[var(--border-main)] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div className="text-sm text-[var(--text-muted)]">
            Total Valid Donors: <span className="font-bold text-[var(--primary)]">{filteredDonors.length}</span>
          </div>
        </div>

        <Table headers={['Donor Name', 'Blood Group', 'Location', 'Last Donation', 'Current Status', 'Actions']}>
          {filteredDonors.map((donor) => (
            <TableRow key={donor.id}>
              <TableCell className="font-medium text-[var(--text-main)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary-glow)] text-[var(--primary)] font-bold flex items-center justify-center text-xs">
                    {donor.name.charAt(0)}
                  </div>
                  {donor.name}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md text-xs">{donor.bloodGroup}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-[var(--text-muted)] text-sm">
                  <MapPin size={14} />
                  {donor.location}
                </div>
              </TableCell>
              <TableCell className="text-[var(--text-muted)]">{donor.lastDonation}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${donor.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  <span className={`text-sm ${donor.status === 'Active' ? 'text-green-600' : 'text-gray-500'}`}>{donor.status}</span>
                </div>
              </TableCell>
              <TableCell>
                <button className="text-sm font-medium text-[var(--primary)] hover:underline">
                  View Profile
                </button>
              </TableCell>
            </TableRow>
          ))}
          {filteredDonors.length === 0 && (
            <TableRow>
              <TableCell className="text-center py-8 text-[var(--text-muted)]">No donors found matching these criteria.</TableCell>
            </TableRow>
          )}
        </Table>
        <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />
      </Card>
    </div>
  );
}
