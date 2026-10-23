'use client';

import React, { useEffect, useState } from 'react';
import { Table, TableRow, TableCell } from '@/src/dashboard/user-management/components/Table';
import { Card } from '@/src/dashboard/user-management/components/Card';
import { StatusBadge } from '@/src/dashboard/user-management/components/StatusBadge';
import { Modal } from '@/src/dashboard/user-management/components/Modal';
import { Pagination } from '@/src/dashboard/user-management/components/Pagination';
import { ShieldAlert, CheckCircle, Eye, AlertTriangle } from 'lucide-react';

type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED';

interface ReportItem {
  id: string;
  reporter: string;
  target: string;
  reason: string;
  date: string;
  status: ReportStatus;
  details: string;
}

const PAGE_SIZE = 20;

const toLabelStatus = (status: ReportStatus): 'Pending' | 'Resolved' => {
  if (status === 'RESOLVED') return 'Resolved';
  return 'Pending';
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadReports = async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      const res = await fetch(`/api/management/reports?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json();

      if (!res.ok || !payload.success) {
        setReports([]);
        setTotalPages(1);
        setTotalItems(0);
        setPendingCount(0);
        return;
      }

      const mapped: ReportItem[] = payload.data.map((report: any) => ({
        id: report.id,
        reporter: report.reporter_contact || `Reporter (${report.reporter_id ? report.reporter_id.slice(0, 8) : 'Guest'})`,
        target: `${report.target_type} (${report.target_id})`,
        reason: report.target_type,
        date: new Date(report.created_at).toLocaleDateString(),
        status: report.status as ReportStatus,
        details: report.message || 'No details provided.',
      }));

      setReports(mapped);
      setTotalPages(payload.pagination?.totalPages || 1);
      setTotalItems(payload.pagination?.total || 0);
      setPendingCount(payload.meta?.pendingCount || 0);
    } catch (error) {
      setReports([]);
      setTotalPages(1);
      setTotalItems(0);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(currentPage);
  }, [currentPage]);

  const resolveReport = async (id: string) => {
    const res = await fetch('/api/management/reports', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'RESOLVED' }),
    });

    if (!res.ok) {
      return;
    }

    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'RESOLVED' } : r)));
    setPendingCount((prev) => Math.max(0, prev - 1));
    if (selectedReport && selectedReport.id === id) {
      setSelectedReport({ ...selectedReport, status: 'RESOLVED' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
            Safety & Reports
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount} Action Required</span>
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">Manage user complaints, abuse reports, and platform issues.</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table headers={['Report ID', 'Reporter Name', 'Target', 'Reason', 'Date', 'Status', 'Actions']}>
          {reports.map((report) => (
            <TableRow key={report.id} className={report.status !== 'RESOLVED' ? 'bg-red-500/5' : ''}>
              <TableCell className="font-medium text-[var(--text-main)]">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert size={14} className={report.status !== 'RESOLVED' ? 'text-red-500' : 'text-gray-400'} />
                  {report.id.slice(0, 8)}
                </span>
              </TableCell>
              <TableCell>{report.reporter}</TableCell>
              <TableCell>
                <span className="bg-[var(--bg-app)] border border-[var(--border-main)] px-2 py-1 rounded text-xs font-medium">
                  {report.target}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 max-w-[200px] truncate text-sm">{report.reason}</div>
              </TableCell>
              <TableCell className="text-[var(--text-muted)] text-sm">{report.date}</TableCell>
              <TableCell><StatusBadge status={toLabelStatus(report.status)} /></TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-glow)] rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  {report.status !== 'RESOLVED' && (
                    <button
                      onClick={() => resolveReport(report.id)}
                      className="p-1.5 text-green-600 hover:bg-green-500/10 rounded-lg transition-colors"
                      title="Mark as Resolved"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {!loading && reports.length === 0 && (
            <TableRow>
              <TableCell className="text-center py-8 text-[var(--text-muted)]">No reports found.</TableCell>
            </TableRow>
          )}
          {loading && (
            <TableRow>
              <TableCell className="text-center py-8 text-[var(--text-muted)]">Loading reports...</TableCell>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Report Details">
        {selectedReport && (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl border flex gap-4 ${selectedReport.status !== 'RESOLVED' ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
              <AlertTriangle className={selectedReport.status !== 'RESOLVED' ? 'text-red-500' : 'text-green-500'} size={24} />
              <div>
                <h4 className={`font-bold ${selectedReport.status !== 'RESOLVED' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {selectedReport.status !== 'RESOLVED' ? 'Action Required' : 'Issue Resolved'}
                </h4>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Report filed against <strong>{selectedReport.target}</strong> on {selectedReport.date}.
                </p>
              </div>
            </div>

            <div className="grid gap-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl p-6">
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Reason for report</p>
                <p className="text-lg font-medium text-[var(--text-main)]">{selectedReport.reason}</p>
              </div>
              <div className="pt-4 border-t border-[var(--border-main)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">Detailed Context</p>
                <p className="text-sm bg-[var(--bg-app)] text-[var(--text-main)] leading-relaxed italic p-3 rounded-lg border border-[var(--border-main)]">
                  "{selectedReport.details}"
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--border-main)] grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Reporter</p>
                  <p className="text-sm font-medium">{selectedReport.reporter}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Report ID</p>
                  <p className="text-sm font-medium">{selectedReport.id}</p>
                </div>
              </div>
            </div>

            {selectedReport.status !== 'RESOLVED' && (
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[var(--border-main)] rounded-xl text-[var(--text-main)] font-medium hover:bg-[var(--border-main)] transition-colors"
                >
                  Keep Pending
                </button>
                <button
                  onClick={() => resolveReport(selectedReport.id)}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl font-medium hover:bg-[var(--primary-dark)] transition-colors flex items-center gap-2"
                >
                  <CheckCircle size={18} /> Mark as Resolved
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
