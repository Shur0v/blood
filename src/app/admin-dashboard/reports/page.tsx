'use client';

import React, { useState } from 'react';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { Modal } from '@/src/admin-dashboard/components/common/Modal';
import { ShieldAlert, AlertCircle, MessageSquare, Clock, Filter, Eye, CheckCircle2 } from 'lucide-react';

const MOCK_REPORTS = [
  { id: 'RPT-105', reporterName: 'Alice Green', reporterId: 'USR-112', targetType: 'User Profile', targetId: 'USR-8902', reason: 'fake donor profile', preview: 'This user keeps listing unavailable numbers.', date: 'Oct 24, 2026', status: 'Pending', priority: 'High', evidence: true },
  { id: 'RPT-106', reporterName: 'Tom White', reporterId: 'USR-441', targetType: 'Blog Post', targetId: 'BLG-045', reason: 'misleading medical info', preview: 'This article suggests replacing meds with herbs.', date: 'Oct 23, 2026', status: 'Under Review', priority: 'Medium', evidence: false },
  { id: 'RPT-107', reporterName: 'System Monitor', reporterId: 'SYS', targetType: 'Organ Request', targetId: 'REQ-44', reason: 'spam content', preview: 'Automated flag: IP address generated 50 requests.', date: 'Oct 22, 2026', status: 'Resolved', priority: 'High', evidence: true },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // API Note: Data fed from useQuery('/api/admin/reports')

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Trust & Safety Reports</h2>
          <p className="text-sm text-gray-500 mt-1">Review complaints, abuse reports, and platform issues.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm">
            <Filter size={16} /> Filter Reports
          </button>
        </div>
      </div>

      {/* Top Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1b23] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 text-sm font-medium">Total Open Reports</p>
          <p className="text-2xl font-bold mt-1">42</p>
        </div>
        <div className="bg-white dark:bg-[#1a1b23] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-emerald-500 text-sm font-medium">Resolved Today</p>
          <p className="text-2xl font-bold mt-1">15</p>
        </div>
        <div className="bg-red-50 dark:bg-red-500/10 p-5 rounded-2xl border border-red-100 dark:border-red-500/20">
          <p className="text-red-500 text-sm font-medium flex items-center gap-1"><AlertCircle size={14}/> High Priority</p>
          <p className="text-2xl font-bold mt-1 text-red-600">8</p>
        </div>
        <div className="bg-white dark:bg-[#1a1b23] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 text-sm font-medium">Top Category</p>
          <p className="text-lg font-bold mt-1 truncate">Fake Donor Profile</p>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white dark:bg-[#1a1b23]">
        <Table headers={['Report Info', 'Reporter', 'Target', 'Details', 'Priority & Status', 'Actions']}>
          {MOCK_REPORTS.map((report) => (
            <TableRow key={report.id} onClick={() => { setSelectedReport(report); setIsModalOpen(true); }}>
              <TableCell>
                <span className="font-semibold">{report.id}</span>
                <p className="text-xs text-gray-500 mt-0.5">{report.date}</p>
              </TableCell>
              <TableCell>
                <span className="font-medium">{report.reporterName}</span>
                <p className="text-xs text-gray-500">{report.reporterId}</p>
              </TableCell>
              <TableCell>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
                  {report.targetType}
                </div>
                <p className="text-xs text-gray-500 mt-1">{report.targetId}</p>
              </TableCell>
              <TableCell>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{report.reason}</span>
                <p className="text-sm truncate max-w-[200px] mt-1">{report.preview}</p>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5 items-start">
                  <Badge type={report.priority === 'High' ? 'danger' : 'warning'}>{report.priority} Priority</Badge>
                  <Badge type={report.status === 'Resolved' ? 'success' : report.status === 'Pending' ? 'warning' : 'info'}>{report.status}</Badge>
                </div>
              </TableCell>
              <TableCell>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedReport(report); setIsModalOpen(true); }}
                  className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition"
                  title="View Detail"
                >
                  <Eye size={16} />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Report Details: ${selectedReport?.id}`}
        maxWidth="max-w-4xl"
        footer={
          <>
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition">Mark Under Review</button>
            <button className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl font-medium transition flex items-center gap-2">
              <ShieldAlert size={16} /> Escalate Account
            </button>
            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition flex items-center gap-2">
              <CheckCircle2 size={16} /> Resolve Report
            </button>
          </>
        }
      >
        {selectedReport && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Report Context */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-red-600">{selectedReport.reason}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Clock size={12}/> Reported on {selectedReport.date}</p>
                  </div>
                  <Badge type={selectedReport.priority === 'High' ? 'danger' : 'warning'}>{selectedReport.priority} Priority</Badge>
                </div>
                
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed p-4 bg-white dark:bg-[#1a1b23] border border-gray-100 dark:border-gray-800 rounded-xl">
                    "{selectedReport.preview}"
                  </p>
                </div>

                {selectedReport.evidence && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Attached Evidence</h4>
                    <div className="h-24 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-700 cursor-pointer">
                       <span className="text-xs font-medium text-gray-500">Screenshot.png</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><MessageSquare size={14}/> Admin Internal Thread</h4>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-[#1a1b23] p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-sm">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Admin A <span className="text-gray-400 font-normal text-xs ml-2">Yesterday</span></p>
                    <p className="text-gray-600 dark:text-gray-300">I have sent a warning email to this user. Monitoring for 24h.</p>
                  </div>
                  <textarea 
                    className="w-full bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" 
                    placeholder="Add an internal note..."
                    rows={3}
                  />
                  <button className="text-sm font-medium bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">Post Note</button>
                </div>
              </div>
            </div>

            {/* Right Col: Entity References */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Target Details</h4>
                <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20 mb-3">
                  <p className="text-xs text-red-500 font-semibold mb-1">{selectedReport.targetType}</p>
                  <p className="font-bold">{selectedReport.targetId}</p>
                </div>
                <button className="w-full py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                  Preview Target
                </button>
              </div>

              <div className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Reporter Details</h4>
                <div className="mb-3">
                  <p className="font-bold">{selectedReport.reporterName}</p>
                  <p className="text-sm text-gray-500">{selectedReport.reporterId}</p>
                </div>
                <p className="text-xs text-gray-400 mb-3">Trust Score: <span className="text-emerald-500 font-bold">Good</span> (No previous false reports)</p>
                <button className="w-full py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                  View Reporter Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
