'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { Modal } from '@/src/admin-dashboard/components/common/Modal';
import { Pagination } from '@/src/admin-dashboard/components/common/Pagination';
import UnifiedDashboard from '@/src/components/UnifiedDashboard';
import { Search, Filter, Eye, Trash2, Shield, ShieldAlert, HeartPulse } from 'lucide-react';

interface DashboardUser {
  id: string;
  name: string;
  avatar: string;
  bg: string;
  country: string;
  city: string;
  phone: string;
  email: string;
  active: boolean;
  verified: 'Full' | 'Pending' | 'Unverified';
  lastDon: string;
  organYes: boolean;
  created: string;
}

interface AdminProfileData {
  id: string;
  name: string;
  city: string;
  country: string;
  bloodGroup: string;
  verificationStatus: string;
  profileImageUrl?: string | null;
  healthData?: Record<string, unknown>;
  activeOrgans?: string[];
  isActiveDonor: boolean;
}

const PAGE_SIZE = 20;
const BLOOD_GROUPS = ['All Blood Groups', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const mapVerificationStatus = (status: string): 'Full' | 'Pending' | 'Unverified' => {
  if (status === 'VERIFIED') return 'Full';
  if (status === 'PENDING') return 'Pending';
  return 'Unverified';
};

export default function AllUserList() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodFilter, setBloodFilter] = useState('All Blood Groups');
  const [countryFilter, setCountryFilter] = useState('All Countries');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<AdminProfileData | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const countryOptions = useMemo(() => {
    const set = new Set<string>(['All Countries']);
    for (const user of users) {
      if (user.country) set.add(user.country);
    }
    return Array.from(set);
  }, [users]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (countryFilter !== 'All Countries') params.set('country', countryFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json();

      if (!res.ok || !payload.success) {
        setUsers([]);
        setTotalPages(1);
        setTotalItems(0);
        return;
      }

      const mapped: DashboardUser[] = payload.data
        .map((user: any) => ({
          id: user.id,
          name: user.name,
          avatar: (user.name?.[0] || 'U').toUpperCase(),
          bg: user.blood_group,
          country: user.location_country || 'Unknown',
          city: user.location_city || 'Unknown',
          phone: user.mobile || '-',
          email: user.email || '-',
          active: Boolean(user.is_active_donor),
          verified: mapVerificationStatus(user.verification_status),
          lastDon: user.last_donation_date ? new Date(user.last_donation_date).toLocaleDateString() : '',
          organYes: Boolean(user.hasActiveOrganPledge),
          created: new Date(user.created_at).toLocaleDateString(),
        }))
        .filter((user: DashboardUser) => bloodFilter === 'All Blood Groups' || user.bg === bloodFilter);

      setUsers(mapped);
      setTotalPages(payload.pagination?.totalPages ?? 1);
      setTotalItems(payload.pagination?.total ?? 0);
    } catch (error) {
      setUsers([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [bloodFilter, countryFilter, currentPage, searchQuery]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, countryFilter, bloodFilter]);

  const openUserProfile = async (userId: string) => {
    setSelectedUserId(userId);
    setIsDetailOpen(true);
    setIsProfileLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setSelectedProfile(null);
        return;
      }
      setSelectedProfile({
        id: payload.data.id,
        name: payload.data.name,
        city: payload.data.city,
        country: payload.data.country,
        bloodGroup: payload.data.bloodGroup,
        verificationStatus: payload.data.verificationStatus,
        profileImageUrl: payload.data.profileImageUrl || null,
        healthData: payload.data.healthData || {},
        activeOrgans: payload.data.activeOrgans || [],
        isActiveDonor: Boolean(payload.data.isActiveDonor),
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this user? This action cannot be undone.');
    if (!confirmed) return;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const payload = await res.json();
    if (!res.ok || !payload.success) {
      alert(payload.message || 'Failed to delete user.');
      return;
    }
    if (selectedUserId === userId) {
      setIsDetailOpen(false);
      setSelectedProfile(null);
      setSelectedUserId(null);
    }
    await fetchUsers();
  };

  const updateAdminDonorStatus = async (ready: boolean) => {
    if (!selectedUserId) return;
    const res = await fetch(`/api/admin/users/${selectedUserId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActiveDonor: ready }),
    });
    const payload = await res.json();
    if (!res.ok || !payload.success) {
      return;
    }
    setSelectedProfile((prev) => (prev ? { ...prev, isActiveDonor: ready } : prev));
    setUsers((prev) => prev.map((u) => (u.id === selectedUserId ? { ...u, active: ready } : u)));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">All User Management</h2>
          <p className="text-sm text-gray-500 mt-1">Browse, filter, and manage all {totalItems.toLocaleString()} platform users.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1b23] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, ID, city, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={bloodFilter}
            onChange={(e) => setBloodFilter(e.target.value)}
            className="bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {BLOOD_GROUPS.map((group) => (
              <option key={group}>{group}</option>
            ))}
          </select>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="hidden sm:block bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {countryOptions.map((country) => (
              <option key={country}>{country}</option>
            ))}
          </select>
          <button className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700">
            <Filter size={16} /> More Filters
          </button>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white dark:bg-[#1a1b23]">
        <Table headers={['User', 'Location', 'Contact Details', 'Status / Verification', 'Last Donated', 'Created', 'Actions']}>
          {users.map((user) => (
            <TableRow key={user.id}>
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
                    <p className="text-xs text-gray-500 mt-0.5">{user.id.slice(0, 8)}</p>
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
                <p className="text-sm min-h-5">{user.lastDon}</p>
                {user.organYes && <Badge type="info" className="mt-1"><HeartPulse size={10} className="mr-1 inline" /> Organ Registry</Badge>}
              </TableCell>
              <TableCell className="text-gray-500 text-xs">{user.created}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => void openUserProfile(user.id)}
                    className="p-2 rounded-lg text-blue-500 hover:bg-blue-500/10 transition"
                    title="View Profile"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => void deleteUser(user.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                    title="Delete User"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
        {!isLoading && users.length === 0 && (
          <div className="px-6 py-8 text-sm font-semibold text-gray-500">No users found for the current search.</div>
        )}
        {isLoading && (
          <div className="px-6 py-8 text-sm font-semibold text-gray-500">Loading users...</div>
        )}
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
      </div>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="User Profile Detail"
        maxWidth="max-w-[95vw]"
        footer={
          <>
            <button
              onClick={() => setIsDetailOpen(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg font-medium"
            >
              Close
            </button>
            {selectedUserId && (
              <button
                onClick={() => void deleteUser(selectedUserId)}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium"
              >
                Delete User
              </button>
            )}
          </>
        }
      >
        {isProfileLoading && <div className="py-8 text-sm text-gray-500">Loading user profile...</div>}
        {!isProfileLoading && selectedProfile && selectedUserId && (
          <div className="rounded-3xl bg-white p-2">
            <UnifiedDashboard
              isReady={selectedProfile.isActiveDonor}
              onToggleReady={(ready) => void updateAdminDonorStatus(ready)}
              mode="admin"
              targetUserId={selectedUserId}
              profile={{
                name: selectedProfile.name,
                city: selectedProfile.city,
                country: selectedProfile.country,
                bloodGroup: selectedProfile.bloodGroup,
                verificationStatus: selectedProfile.verificationStatus,
                profileImageUrl: selectedProfile.profileImageUrl,
                healthData: selectedProfile.healthData || {},
                activeOrgans: selectedProfile.activeOrgans || [],
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
