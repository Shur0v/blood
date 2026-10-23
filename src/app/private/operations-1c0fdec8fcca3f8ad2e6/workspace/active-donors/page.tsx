'use client';

import React, { useEffect, useState } from 'react';
import { Table, TableRow, TableCell } from '@/src/dashboard/user-management/components/Table';
import { Card } from '@/src/dashboard/user-management/components/Card';
import { FilterDropdown } from '@/src/dashboard/user-management/components/FilterDropdown';
import { Pagination } from '@/src/dashboard/user-management/components/Pagination';
import { MapPin, Search } from 'lucide-react';

interface ActiveDonorItem {
  id: string;
  name: string;
  bloodGroup: string;
  location: string;
  lastDonation: string;
  status: 'Active' | 'Inactive';
}

const PAGE_SIZE = 20;

export default function ActiveDonorsPage() {
  const [donors, setDonors] = useState<ActiveDonorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [bloodFilter, setBloodFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const loadDonors = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(PAGE_SIZE),
        });

        if (search) {
          params.set('search', search);
        }
        if (bloodFilter) {
          params.set('bloodGroup', bloodFilter);
        }

        const res = await fetch(`/api/management/active-donors?${params.toString()}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        const payload = await res.json();

        if (!res.ok || !payload.success) {
          setDonors([]);
          setTotalPages(1);
          setTotalItems(0);
          return;
        }

        const mapped: ActiveDonorItem[] = payload.data.map((user: any) => ({
          id: user.id,
          name: user.name,
          bloodGroup: user.blood_group,
          location: `${user.location_city}, ${user.location_country}`,
          lastDonation: user.last_donation_date ? new Date(user.last_donation_date).toLocaleDateString() : 'Not provided',
          status: user.is_active_donor ? 'Active' : 'Inactive',
        }));

        setDonors(mapped);
        setTotalPages(payload.pagination?.totalPages || 1);
        setTotalItems(payload.pagination?.total || 0);
      } catch (error) {
        setDonors([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    loadDonors();
  }, [currentPage, search, bloodFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)]">Active Donors Registry</h2>
          <p className="text-[var(--text-muted)] text-sm">Manage users currently marked available to donate.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <FilterDropdown
            label="Blood Group"
            options={['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']}
            value={bloodFilter}
            onChange={(next) => {
              setCurrentPage(1);
              setBloodFilter(next);
            }}
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-[var(--border-main)] flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-[var(--bg-app)]/30">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search donor name/email/mobile..."
              className="w-full bg-[var(--bg-app)] border border-[var(--border-main)] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div className="text-sm text-[var(--text-muted)]">
            Total Active Donors: <span className="font-bold text-[var(--primary)]">{totalItems}</span>
          </div>
        </div>

        <Table headers={['Donor Name', 'Blood Group', 'Location', 'Last Donation', 'Current Status', 'Actions']}>
          {donors.map((donor) => (
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
                  <span className={`w-2 h-2 rounded-full ${donor.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className={`text-sm ${donor.status === 'Active' ? 'text-green-600' : 'text-gray-500'}`}>{donor.status}</span>
                </div>
              </TableCell>
              <TableCell>
                <button className="text-sm font-medium text-[var(--primary)] hover:underline">View Profile</button>
              </TableCell>
            </TableRow>
          ))}
          {!loading && donors.length === 0 && (
            <TableRow>
              <TableCell className="text-center py-8 text-[var(--text-muted)]">No active donors found.</TableCell>
            </TableRow>
          )}
          {loading && (
            <TableRow>
              <TableCell className="text-center py-8 text-[var(--text-muted)]">Loading active donors...</TableCell>
            </TableRow>
          )}
        </Table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
        />
      </Card>
    </div>
  );
}
