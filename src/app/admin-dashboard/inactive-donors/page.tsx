'use client';

import React from 'react';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { Pagination } from '@/src/admin-dashboard/components/common/Pagination';
import { Search, Filter, Mail, UserCheck, AlertCircle } from 'lucide-react';

type ReasonFilter = 'ALL' | 'MISSING_VERIFICATION' | 'USER_TURNED_OFF';

interface InactiveRow {
  id: string;
  name: string;
  bloodGroup: string;
  location: string;
  email: string;
  reasonCode: ReasonFilter;
  reasonLabel: string;
  lastActive: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'UNVERIFIED' | string;
  hasOrganRegistry: boolean;
}

interface InactiveApiResponse {
  success: boolean;
  data?: InactiveRow[];
  meta?: {
    totalInactive: number;
    verifiedInactive: number;
    withOrganRegistry: number;
    topReason: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const PAGE_SIZE = 20;

const formatDate = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function InactiveDonorsPage() {
  const [rows, setRows] = React.useState<InactiveRow[]>([]);
  const [search, setSearch] = React.useState('');
  const [reason, setReason] = React.useState<ReasonFilter>('ALL');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [meta, setMeta] = React.useState({
    totalInactive: 0,
    verifiedInactive: 0,
    withOrganRegistry: 0,
    topReason: 'N/A',
  });

  React.useEffect(() => {
    setPage(1);
  }, [search, reason]);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        reason,
      });
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/inactive-donors?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = (await res.json()) as InactiveApiResponse;
      if (!res.ok || !payload.success) {
        setRows([]);
        setTotalItems(0);
        setTotalPages(1);
        return;
      }

      setRows(payload.data ?? []);
      setMeta({
        totalInactive: Number(payload.meta?.totalInactive ?? 0),
        verifiedInactive: Number(payload.meta?.verifiedInactive ?? 0),
        withOrganRegistry: Number(payload.meta?.withOrganRegistry ?? 0),
        topReason: payload.meta?.topReason || 'N/A',
      });
      setTotalItems(payload.pagination?.total ?? 0);
      setTotalPages(payload.pagination?.totalPages ?? 1);
    } finally {
      setIsLoading(false);
    }
  }, [page, reason, search]);

  React.useEffect(() => {
    void loadData();
    const timer = setInterval(() => {
      void loadData();
    }, 15000);
    return () => clearInterval(timer);
  }, [loadData]);

  const exportCsv = () => {
    if (rows.length === 0) return;
    const header = ['ID', 'Name', 'Blood Group', 'Location', 'Email', 'Reason', 'Last Active', 'Verification'];
    const lines = rows.map((r) => [
      r.id,
      r.name,
      r.bloodGroup,
      r.location,
      r.email,
      r.reasonLabel,
      formatDate(r.lastActive),
      r.verificationStatus,
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inactive-donors-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reactivateUser = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActiveDonor: true }),
    });
    const payload = await res.json();
    if (!res.ok || !payload.success) return;
    void loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inactive Donor Management</h2>
          <p className="text-sm text-gray-500 mt-1">Review users who are registered but not publicly listed as active donors.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition"
          >
            Export List (CSV)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1b23] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 text-sm font-medium">Total Inactive</p>
          <p className="text-2xl font-bold mt-1">{meta.totalInactive.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1b23] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 text-sm font-medium">Verified Inactive</p>
          <p className="text-2xl font-bold mt-1 text-emerald-500">{meta.verifiedInactive.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1b23] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 text-sm font-medium">Top Reason</p>
          <p className="text-sm font-bold mt-2 truncate text-red-500">{meta.topReason}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1b23] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 text-sm font-medium">With Organ Registry</p>
          <p className="text-2xl font-bold mt-1 text-purple-500">{meta.withOrganRegistry.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1b23] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inactive users..."
            className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ReasonFilter)}
            className="bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <option value="ALL">All Reasons</option>
            <option value="MISSING_VERIFICATION">Missing Verification</option>
            <option value="USER_TURNED_OFF">User Turned Off Availability</option>
          </select>
          <button className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white dark:bg-[#1a1b23]">
        <Table headers={['User Details', 'Contact', 'Reason Tag', 'Last Active', 'Status', 'Actions']}>
          {isLoading ? (
            <TableRow>
              <TableCell>Loading...</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell>No inactive users found.</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
          ) : (
            rows.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {user.name}
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 tracking-wider text-gray-700 dark:bg-gray-700 dark:text-gray-300 leading-none">{user.bloodGroup}</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{user.location}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{user.email}</p>
                </TableCell>
                <TableCell>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                    {user.reasonCode === 'MISSING_VERIFICATION' && <AlertCircle size={12} className="text-amber-500" />}
                    {user.reasonLabel}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">{formatDate(user.lastActive)}</TableCell>
                <TableCell>
                  <Badge type={user.verificationStatus === 'VERIFIED' ? 'success' : 'danger'}>
                    {user.verificationStatus === 'VERIFIED' ? 'Verified' : 'Unverified'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${user.email}`}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition"
                      title="Contact / Send Email"
                    >
                      <Mail size={18} />
                    </a>
                    <button
                      onClick={() => void reactivateUser(user.id)}
                      className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition"
                      title="Reactivate Donor"
                    >
                      <UserCheck size={18} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </Table>
        <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </div>
  );
}
