'use client';

import React, { useState } from 'react';
import { Card } from '@/src/dashboard/user-management/components/Card';
import { StatusBadge } from '@/src/dashboard/user-management/components/StatusBadge';
import { Modal } from '@/src/dashboard/user-management/components/Modal';
import { FilterDropdown } from '@/src/dashboard/user-management/components/FilterDropdown';
import { Pagination } from '@/src/dashboard/user-management/components/Pagination';
import { ShieldCheck, XCircle, FileImage, UserCircle, MapPin, Calendar, FileText } from 'lucide-react';

// Mock Data
const MOCK_VERIFICATIONS = [
  { id: 'VR-101', name: 'Alex Johnson', bloodGroup: 'O-', location: 'Denver, CO', date: 'Oct 24, 2026', status: 'Pending', bio: 'Healthy individual, frequent blood donor.' },
  { id: 'VR-102', name: 'Maria Garcia', bloodGroup: 'A+', location: 'Miami, FL', date: 'Oct 23, 2026', status: 'Approved', bio: 'Registered nurse, willing to donate marrow.' },
  { id: 'VR-103', name: 'David Chen', bloodGroup: 'B-', location: 'Seattle, WA', date: 'Oct 22, 2026', status: 'Rejected', bio: 'Had recent surgery within 6 months.' },
];

export default function VerifyRequestPage() {
  const [requests, setRequests] = useState(MOCK_VERIFICATIONS);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const handleAction = (id: string, newStatus: string) => {
    // API Call goes here (e.g., POST /api/verifications/:id/resolve)
    setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest({ ...selectedRequest, status: newStatus });
    }
  };

  const filteredRequests = filterStatus 
    ? requests.filter(r => r.status === filterStatus)
    : requests;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)]">User Verification</h2>
          <p className="text-[var(--text-muted)] text-sm">Review identity and medical credentials for donors.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <FilterDropdown 
            label="Filter Status"
            options={['Pending', 'Approved', 'Rejected']}
            value={filterStatus}
            onChange={setFilterStatus}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((req) => (
          <Card key={req.id} onClick={() => { setSelectedRequest(req); setIsModalOpen(true); }} className="group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-app)] border-2 border-[var(--primary)]/20 flex items-center justify-center overflow-hidden">
                  <UserCircle size={32} className="text-[var(--text-muted)]" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-main)]">{req.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    <MapPin size={12} /> {req.location}
                  </p>
                </div>
              </div>
              <StatusBadge status={req.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4 bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border-main)]">
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Blood Group</p>
                <p className="font-bold text-[var(--primary)]">{req.bloodGroup}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Submitted On</p>
                <p className="text-sm text-[var(--text-main)]">{req.date}</p>
              </div>
            </div>

            {req.status === 'Pending' && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border-main)]" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => handleAction(req.id, 'Approved')}
                  className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <ShieldCheck size={16} /> Verify
                </button>
                <button 
                  onClick={() => handleAction(req.id, 'Rejected')}
                  className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <XCircle size={16} /> Reject
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Pagination currentPage={1} totalPages={2} onPageChange={() => {}} />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Verification Details"
        maxWidth="max-w-4xl"
      >
        {selectedRequest && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Profile & Docs */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass p-6 rounded-2xl flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-[var(--bg-app)] border-4 border-[var(--primary)] flex items-center justify-center mb-4">
                  <UserCircle size={48} className="text-[var(--text-muted)]" />
                </div>
                <h3 className="text-xl font-bold">{selectedRequest.name}</h3>
                <p className="text-sm text-[var(--text-muted)] flex items-center justify-center gap-1 mb-2">
                  <MapPin size={14} /> {selectedRequest.location}
                </p>
                <div className="inline-block px-3 py-1 bg-[var(--primary-glow)] text-[var(--primary)] font-bold rounded-full text-lg mt-2">
                  {selectedRequest.bloodGroup}
                </div>
              </div>

              {/* Actions */}
              {selectedRequest.status === 'Pending' && (
                <div className="space-y-3">
                  <button 
                    onClick={() => handleAction(selectedRequest.id, 'Approved')}
                    className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-xl font-medium transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={20} /> Approve Verification
                  </button>
                  <button 
                    onClick={() => handleAction(selectedRequest.id, 'Rejected')}
                    className="w-full py-3 bg-[var(--bg-app)] border border-[var(--border-main)] hover:bg-red-50 text-red-500 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} /> Reject Applicant
                  </button>
                </div>
              )}
            </div>

            {/* Right Col: Documents */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass border border-[var(--border-main)] rounded-2xl p-6">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="text-[var(--primary)]" />
                  Uploaded Documents
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ID Document */}
                  <div className="border border-[var(--border-main)] rounded-xl p-4 bg-[var(--bg-app)]">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-sm">Government ID</p>
                        <p className="text-xs text-[var(--text-muted)]">Verified via third-party</p>
                      </div>
                      <ShieldCheck className="text-green-500" size={20} />
                    </div>
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <FileImage size={32} className="text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500 font-medium tracking-wide">ID_Front_Scan.jpg</span>
                    </div>
                  </div>

                  {/* Medical Assessment */}
                  <div className="border border-[var(--border-main)] rounded-xl p-4 bg-[var(--bg-app)]">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-sm">Medical History</p>
                        <p className="text-xs text-[var(--text-muted)]">Signed by Dr. Smith</p>
                      </div>
                      <FileText className="text-[var(--primary)]" size={20} />
                    </div>
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <FileText size={32} className="text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500 font-medium tracking-wide">Med_Clearance.pdf</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass border border-[var(--border-main)] rounded-2xl p-6">
                <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-2">User Summary</h4>
                <p className="text-sm leading-relaxed text-[var(--text-main)]">
                  {selectedRequest.bio}
                </p>
                <div className="mt-4 pt-4 border-t border-[var(--border-main)] flex items-center text-xs text-[var(--text-muted)]">
                  <Calendar size={14} className="mr-1" />
                  Account created: Jan 15, 2026 • Has initiated 1 previous request (Approved).
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
