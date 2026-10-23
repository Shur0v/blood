'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/src/dashboard/user-management/components/Card';
import { StatusBadge } from '@/src/dashboard/user-management/components/StatusBadge';
import { Modal } from '@/src/dashboard/user-management/components/Modal';
import { FilterDropdown } from '@/src/dashboard/user-management/components/FilterDropdown';
import { Pagination } from '@/src/dashboard/user-management/components/Pagination';
import { ShieldCheck, XCircle, FileImage, UserCircle, MapPin, Calendar, FileText } from 'lucide-react';

type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface VerificationItem {
  id: string;
  name: string;
  bloodGroup: string;
  location: string;
  date: string;
  status: VerificationStatus;
  bio: string;
  documentType: string;
  documentUrl: string;
  userId: string;
}

const PAGE_SIZE = 20;

const toLabelStatus = (status: VerificationStatus): 'Pending' | 'Approved' | 'Rejected' => {
  if (status === 'APPROVED') return 'Approved';
  if (status === 'REJECTED') return 'Rejected';
  return 'Pending';
};

export default function VerifyRequestPage() {
  const [requests, setRequests] = useState<VerificationItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadRequests = async (page: number, statusFilter?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (statusFilter) {
        params.set('status', statusFilter.toUpperCase());
      }

      const res = await fetch(`/api/management/verifications?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json();

      if (!res.ok || !payload.success) {
        setRequests([]);
        setTotalPages(1);
        setTotalItems(0);
        return;
      }

      const mapped: VerificationItem[] = payload.data.map((doc: any) => ({
        id: doc.id,
        name: doc.User?.name || 'Unknown user',
        bloodGroup: doc.User?.blood_group || 'N/A',
        location: `${doc.User?.location_city || 'N/A'}, ${doc.User?.location_country || 'N/A'}`,
        date: new Date(doc.created_at).toLocaleDateString(),
        status: doc.review_status as VerificationStatus,
        bio: `Email: ${doc.User?.email || 'N/A'} | Phone: ${doc.User?.mobile || 'N/A'}`,
        documentType: doc.document_type || 'MEDICAL_REPORT',
        documentUrl: doc.asset_url || '',
        userId: doc.user_id,
      }));

      setRequests(mapped);
      setTotalPages(payload.pagination?.totalPages || 1);
      setTotalItems(payload.pagination?.total || 0);
    } catch (error) {
      setRequests([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(currentPage, filterStatus);
  }, [currentPage, filterStatus]);

  const handleAction = async (id: string, newStatus: VerificationStatus) => {
    const res = await fetch('/api/management/verifications', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });

    if (!res.ok) {
      return;
    }

    setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req)));
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest({ ...selectedRequest, status: newStatus });
    }
  };

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
            onChange={(value) => {
              setCurrentPage(1);
              setFilterStatus(value);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((req) => (
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
              <StatusBadge status={toLabelStatus(req.status)} />
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

            {req.status === 'PENDING' && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border-main)]" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleAction(req.id, 'APPROVED')}
                  className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <ShieldCheck size={16} /> Verify
                </button>
                <button
                  onClick={() => handleAction(req.id, 'REJECTED')}
                  className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <XCircle size={16} /> Reject
                </button>
              </div>
            )}
          </Card>
        ))}
        {!loading && requests.length === 0 && (
          <Card className="p-6 text-sm text-[var(--text-muted)]">No verification requests found.</Card>
        )}
      </div>

      <div className="mt-8">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Verification Details" maxWidth="max-w-4xl">
        {selectedRequest && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

              {selectedRequest.status === 'PENDING' && (
                <div className="space-y-3">
                  <button
                    onClick={() => handleAction(selectedRequest.id, 'APPROVED')}
                    className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-xl font-medium transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={20} /> Approve Verification
                  </button>
                  <button
                    onClick={() => handleAction(selectedRequest.id, 'REJECTED')}
                    className="w-full py-3 bg-[var(--bg-app)] border border-[var(--border-main)] hover:bg-red-50 text-red-500 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} /> Reject Applicant
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="glass border border-[var(--border-main)] rounded-2xl p-6">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="text-[var(--primary)]" />
                  Uploaded Documents
                </h4>

                <div className="border border-[var(--border-main)] rounded-xl p-4 bg-[var(--bg-app)]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-sm">{selectedRequest.documentType}</p>
                      <p className="text-xs text-[var(--text-muted)]">Submitted by user</p>
                    </div>
                    <FileText className="text-[var(--primary)]" size={20} />
                  </div>
                  <a
                    href={selectedRequest.documentUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FileImage size={32} className="text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500 font-medium tracking-wide line-clamp-1 px-2">
                      {selectedRequest.documentUrl || 'No file URL available'}
                    </span>
                  </a>
                </div>
              </div>

              <div className="glass border border-[var(--border-main)] rounded-2xl p-6">
                <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-2">User Summary</h4>
                <p className="text-sm leading-relaxed text-[var(--text-main)]">{selectedRequest.bio}</p>
                <div className="mt-4 pt-4 border-t border-[var(--border-main)] flex items-center text-xs text-[var(--text-muted)]">
                  <Calendar size={14} className="mr-1" />
                  Verification request created on {selectedRequest.date}.
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
