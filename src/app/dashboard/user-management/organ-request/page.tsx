'use client';

import React, { useState } from 'react';
import { Table, TableRow, TableCell } from '@/src/dashboard/user-management/components/Table';
import { Card } from '@/src/dashboard/user-management/components/Card';
import { StatusBadge } from '@/src/dashboard/user-management/components/StatusBadge';
import { Modal } from '@/src/dashboard/user-management/components/Modal';
import { FilterDropdown } from '@/src/dashboard/user-management/components/FilterDropdown';
import { Pagination } from '@/src/dashboard/user-management/components/Pagination';
import { Eye, Check, X as XIcon, Clock, FileText, MapPin } from 'lucide-react';

// Mock Data (For UI illustration)
const MOCK_REQUESTS = [
  { id: 'REQ-4091', name: 'James Wilson', bloodGroup: 'O+', location: 'New York, USA', organType: 'Kidney', date: 'Oct 24, 2026', status: 'Pending', note: 'Patient requires urgent transplant. Compatible match highly prioritized.' },
  { id: 'REQ-4092', name: 'Sarah Connor', bloodGroup: 'A-', location: 'London, UK', organType: 'Liver', date: 'Oct 23, 2026', status: 'Approved', note: 'All documentation verified.' },
  { id: 'REQ-4093', name: 'Michael Chang', bloodGroup: 'B+', location: 'Toronto, CA', organType: 'Heart', date: 'Oct 21, 2026', status: 'Rejected', note: 'Incomplete medical history provided.' },
  { id: 'REQ-4094', name: 'Emma Davis', bloodGroup: 'AB+', location: 'Sydney, AU', organType: 'Cornea', date: 'Oct 20, 2026', status: 'Pending', note: 'Awaiting secondary physician approval.' },
];

export default function OrganRequestPage() {
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const handleAction = (id: string, newStatus: string) => {
    // API INTEGRATION POINT:
    // Action triggers when Admin clicks Approve/Reject buttons
    // Target: PUT /api/organ-requests/:id/status
    // Data Handled: { status: newStatus }
    setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest({ ...selectedRequest, status: newStatus });
    }
  };

  const openDetails = (req: any) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const filteredRequests = filterStatus 
    ? requests.filter(r => r.status === filterStatus)
    : requests;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)]">Organ Requests</h2>
          <p className="text-[var(--text-muted)] text-sm">Manage and verify organ donation requests.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <FilterDropdown 
            label="Location (All)"
            options={['New York, USA', 'London, UK', 'Toronto, CA', 'Sydney, AU']}
            value=""
            onChange={() => {}}
          />
          <FilterDropdown 
            label="Status"
            options={['Pending', 'Approved', 'Rejected']}
            value={filterStatus}
            onChange={setFilterStatus}
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table headers={['Request ID', 'Patient Name', 'Blood Group', 'Location', 'Organ Type', 'Date', 'Status', 'Actions']}>
          {filteredRequests.map((req) => (
            <TableRow key={req.id}>
              <TableCell className="font-medium">{req.id}</TableCell>
              <TableCell>{req.name}</TableCell>
              <TableCell>
                <span className="bg-red-500/10 text-red-500 font-bold px-2 py-1 rounded-md text-xs">{req.bloodGroup}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-[var(--text-muted)]">
                  <MapPin size={14} /> {req.location}
                </div>
              </TableCell>
              <TableCell>{req.organType}</TableCell>
              <TableCell>{req.date}</TableCell>
              <TableCell><StatusBadge status={req.status} /></TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openDetails(req)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-glow)] rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  {req.status === 'Pending' && (
                    <>
                      <button 
                        onClick={() => handleAction(req.id, 'Approved')}
                        className="p-1.5 text-green-600 hover:bg-green-500/10 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => handleAction(req.id, 'Rejected')}
                        className="p-1.5 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Reject"
                      >
                        <XIcon size={18} />
                      </button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
        <Pagination currentPage={1} totalPages={3} onPageChange={() => {}} />
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Organ Request Details"
        maxWidth="max-w-3xl"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Header / Summary */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-1">{selectedRequest.name}</h3>
                <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                  <span className="flex items-center gap-1"><MapPin size={14}/> {selectedRequest.location}</span>
                  <span className="flex items-center gap-1"><Clock size={14}/> {selectedRequest.date}</span>
                  <span>ID: {selectedRequest.id}</span>
                </div>
              </div>
              <StatusBadge status={selectedRequest.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="glass p-4 rounded-xl border border-[var(--border-main)]">
                  <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-3">Medical Data</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[var(--text-muted)] text-xs">Organ Required</p>
                      <p className="font-medium text-[var(--text-main)] mt-0.5">{selectedRequest.organType}</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)] text-xs">Blood Group</p>
                      <p className="font-bold text-red-500 mt-0.5">{selectedRequest.bloodGroup}</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)] text-xs">Urgency Level</p>
                      <p className="font-medium text-yellow-500 mt-0.5">High / Critical</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)] text-xs">Hospital</p>
                      <p className="font-medium text-[var(--text-main)] mt-0.5">General Med Center</p>
                    </div>
                  </div>
                </div>

                <div className="glass p-4 rounded-xl border border-[var(--border-main)]">
                  <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-2 flex items-center gap-2">
                    <FileText size={16}/> Medical Note
                  </h4>
                  <p className="text-sm text-[var(--text-main)] leading-relaxed">
                    {selectedRequest.note}
                  </p>
                </div>
                
                {/* Actions */}
                {selectedRequest.status === 'Pending' && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleAction(selectedRequest.id, 'Approved')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Check size={18} /> Approve
                    </button>
                    <button 
                      onClick={() => handleAction(selectedRequest.id, 'Rejected')}
                      className="flex-1 bg-[var(--bg-app)] border border-red-500 text-red-500 hover:bg-red-500/10 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <XIcon size={18} /> Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="glass p-4 rounded-xl border border-[var(--border-main)] h-48 flex flex-col items-center justify-center relative overflow-hidden group">
                  {/* Prescription dummy image */}
                  <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                  <FileText className="relative z-10 text-gray-400 group-hover:scale-110 transition-transform" size={48} />
                  <p className="relative z-10 mt-2 text-sm font-medium text-gray-500">Prescription_Scan.pdf</p>
                  <button className="relative z-10 mt-3 px-4 py-1.5 bg-black/50 text-white rounded-lg text-xs backdrop-blur-md hover:bg-black/70 transition-colors">
                    Preview Document
                  </button>
                </div>

                {/* Timeline Component (UI Only) */}
                <div className="glass p-4 rounded-xl border border-[var(--border-main)]">
                  <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-4">Request Timeline</h4>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--primary)] mt-1.5 shrink-0 ring-4 ring-[var(--primary-glow)]"></div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-main)]">Request Submitted</p>
                        <p className="text-xs text-[var(--text-muted)]">{selectedRequest.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 shrink-0 ring-4 ring-yellow-500/20"></div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-main)]">Under Review</p>
                        <p className="text-xs text-[var(--text-muted)]">Currently pending admin action</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
