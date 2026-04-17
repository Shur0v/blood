'use client';

import React, { useState } from 'react';
import { Table, TableRow, TableCell } from '@/src/dashboard/user-management/components/Table';
import { Card } from '@/src/dashboard/user-management/components/Card';
import { StatusBadge } from '@/src/dashboard/user-management/components/StatusBadge';
import { Modal } from '@/src/dashboard/user-management/components/Modal';
import { Pagination } from '@/src/dashboard/user-management/components/Pagination';
import { ShieldAlert, CheckCircle, Eye, AlertTriangle } from 'lucide-react';

const MOCK_REPORTS = [
  { id: 'RPT-8001', reporter: 'Sam Winchester', target: 'User (ID: 991)', reason: 'Inappropriate Content in Bio', date: 'Oct 24, 2026', status: 'Pending', details: 'User has links to scam sites in their bio.' },
  { id: 'RPT-8002', reporter: 'Dean Winchester', target: 'Blog Post (ID: 30)', reason: 'Medical Misinformation', date: 'Oct 23, 2026', status: 'Pending', details: 'The blog post encourages dangerous home remedies instead of clinical guidance.' },
  { id: 'RPT-8003', reporter: 'Castiel', target: 'Organ Request (ID: REQ-4091)', reason: 'Suspicious Request', date: 'Oct 21, 2026', status: 'Resolved', details: 'Seems like a duplicate or automated spam request.' }
];

export default function ReportsPage() {
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const resolveReport = (id: string) => {
    // API Call: PUT /api/reports/:id/resolve
    setReports(reports.map(r => r.id === id ? { ...r, status: 'Resolved' } : r));
    if (selectedReport && selectedReport.id === id) {
      setSelectedReport({ ...selectedReport, status: 'Resolved' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
            Safety & Reports
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{reports.filter(r => r.status === 'Pending').length} Action Required</span>
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">Manage user complaints, abuse reports, and platform issues.</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table headers={['Report ID', 'Reporter Name', 'Target', 'Reason', 'Date', 'Status', 'Actions']}>
          {reports.map((report) => (
            <TableRow key={report.id} className={report.status === 'Pending' ? 'bg-red-500/5' : ''}>
              <TableCell className="font-medium text-[var(--text-main)]">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert size={14} className={report.status === 'Pending' ? 'text-red-500' : 'text-gray-400'} />
                  {report.id}
                </span>
              </TableCell>
              <TableCell>{report.reporter}</TableCell>
              <TableCell>
                <span className="bg-[var(--bg-app)] border border-[var(--border-main)] px-2 py-1 rounded text-xs font-medium">
                  {report.target}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 max-w-[200px] truncate text-sm">
                  {report.reason}
                </div>
              </TableCell>
              <TableCell className="text-[var(--text-muted)] text-sm">{report.date}</TableCell>
              <TableCell><StatusBadge status={report.status} /></TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setSelectedReport(report); setIsModalOpen(true); }}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-glow)] rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  {report.status === 'Pending' && (
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
        </Table>
        <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Report Details"
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl border flex gap-4 ${selectedReport.status === 'Pending' ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
              <AlertTriangle className={selectedReport.status === 'Pending' ? 'text-red-500' : 'text-green-500'} size={24} />
              <div>
                <h4 className={`font-bold ${selectedReport.status === 'Pending' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {selectedReport.status === 'Pending' ? 'Action Required' : 'Issue Resolved'}
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

            {selectedReport.status === 'Pending' && (
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
