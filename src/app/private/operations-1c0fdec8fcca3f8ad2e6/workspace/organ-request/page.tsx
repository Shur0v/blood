'use client';

import React, { useEffect, useState } from 'react';
import { Table, TableRow, TableCell } from '@/src/dashboard/user-management/components/Table';
import { Card } from '@/src/dashboard/user-management/components/Card';
import { StatusBadge } from '@/src/dashboard/user-management/components/StatusBadge';
import { Modal } from '@/src/dashboard/user-management/components/Modal';
import { FilterDropdown } from '@/src/dashboard/user-management/components/FilterDropdown';
import { Pagination } from '@/src/dashboard/user-management/components/Pagination';
import { Eye, Check, X as XIcon, Clock, FileText, MapPin, Trash2 } from 'lucide-react';

type RequestStatus = 'PENDING' | 'VERIFIED' | 'RESOLVED';

interface OrganRequestItem {
  id: string;
  name: string;
  bloodGroup: string;
  location: string;
  organType: string;
  date: string;
  status: RequestStatus;
  note: string;
  contact: string;
  prescriptionImages: string[];
}

const PAGE_SIZE = 20;

const toLabelStatus = (status: RequestStatus): 'Pending' | 'Approved' | 'Rejected' => {
  if (status === 'PENDING') return 'Pending';
  if (status === 'VERIFIED') return 'Approved';
  return 'Rejected';
};

const toApiStatus = (status: 'Approved' | 'Rejected'): RequestStatus => {
  return status === 'Approved' ? 'VERIFIED' : 'RESOLVED';
};

export default function OrganRequestPage() {
  const [requests, setRequests] = useState<OrganRequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<OrganRequestItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const loadRequests = async (page: number, status: string, searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (status) {
        params.set('status', status === 'Approved' ? 'VERIFIED' : status === 'Rejected' ? 'RESOLVED' : 'PENDING');
      }
      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const res = await fetch(`/api/management/organ-requests?${params.toString()}`, {
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

      const mapped: OrganRequestItem[] = payload.data.map((item: any) => {
        const attachmentUrls = Array.isArray(item.Attachments)
          ? item.Attachments
              .map((a: any) => a?.file_url)
              .filter((url: unknown): url is string => typeof url === 'string' && url.length > 0)
          : [];
        const urls = Array.isArray(item.prescription_images)
          ? item.prescription_images.filter((url: unknown): url is string => typeof url === 'string')
          : [];

        return {
          id: item.id,
          name: item.name,
          bloodGroup: 'N/A',
          location: `${item.location_city}, ${item.location_country}`,
          organType: item.organ_type,
          date: new Date(item.created_at).toLocaleDateString(),
          status: item.status as RequestStatus,
          note: item.medical_note || 'No medical note provided.',
          contact: item.contact || 'N/A',
          prescriptionImages:
            attachmentUrls.length > 0
              ? attachmentUrls
              : urls.length > 0
                ? urls
                : item.prescription_image
                  ? [item.prescription_image]
                  : [],
        };
      });

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
    loadRequests(currentPage, filterStatus, search);
  }, [currentPage, filterStatus, search]);

  const handleAction = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    const apiStatus = toApiStatus(newStatus);
    const res = await fetch('/api/management/organ-requests', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: apiStatus }),
    });

    if (!res.ok) {
      return;
    }

    setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status: apiStatus } : req)));
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest({ ...selectedRequest, status: apiStatus });
    }
  };

  const openDetails = (req: OrganRequestItem) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };
  const handleDelete = async (id: string) => {
    const res = await fetch('/api/management/organ-requests', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return;
    setRequests((prev) => prev.filter((req) => req.id !== id));
    setTotalItems((prev) => Math.max(0, prev - 1));
    if (selectedRequest?.id === id) {
      setSelectedRequest(null);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)]">Organ Requests</h2>
          <p className="text-[var(--text-muted)] text-sm">Manage and verify organ donation requests.</p>
        </div>

        <div className="flex items-center gap-3">
          <FilterDropdown
            label="Status"
            options={['Pending', 'Approved', 'Rejected']}
            value={filterStatus}
            onChange={(value) => {
              setCurrentPage(1);
              setFilterStatus(value);
            }}
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-[var(--border-main)] bg-[var(--bg-app)]/30">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, contact, organ type, city..."
            className="w-full md:w-96 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <Table headers={['Request ID', 'Patient Name', 'Blood Group', 'Location', 'Organ Type', 'Date', 'Status', 'Actions']}>
          {requests.map((req) => (
            <TableRow key={req.id}>
              <TableCell className="font-medium">{req.id.slice(0, 8)}</TableCell>
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
              <TableCell><StatusBadge status={toLabelStatus(req.status)} /></TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDetails(req)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-glow)] rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  {req.status === 'PENDING' && (
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
                  <button
                    onClick={() => void handleDelete(req.id)}
                    className="p-1.5 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete request"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {!loading && requests.length === 0 && (
            <TableRow>
              <TableCell className="text-center py-8 text-[var(--text-muted)]">No organ requests found.</TableCell>
            </TableRow>
          )}
          {loading && (
            <TableRow>
              <TableCell className="text-center py-8 text-[var(--text-muted)]">Loading organ requests...</TableCell>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Organ Request Details" maxWidth="max-w-3xl">
        {selectedRequest && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-1">{selectedRequest.name}</h3>
                <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {selectedRequest.location}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {selectedRequest.date}</span>
                  <span>Contact: {selectedRequest.contact}</span>
                </div>
              </div>
              <StatusBadge status={toLabelStatus(selectedRequest.status)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  </div>
                </div>

                <div className="glass p-4 rounded-xl border border-[var(--border-main)]">
                  <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-2 flex items-center gap-2">
                    <FileText size={16} /> Medical Note
                  </h4>
                  <p className="text-sm text-[var(--text-main)] leading-relaxed">{selectedRequest.note}</p>
                </div>

                {selectedRequest.status === 'PENDING' && (
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

              <div className="space-y-6">
                <div className="glass p-4 rounded-xl border border-[var(--border-main)]">
                  <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-3">Attached Medical Files</h4>
                  {selectedRequest.prescriptionImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedRequest.prescriptionImages.map((imageUrl, index) => (
                        <a
                          key={`${selectedRequest.id}-img-${index}`}
                          href={imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] hover:opacity-90 transition"
                          title={`Open file ${index + 1}`}
                        >
                          <img
                            src={imageUrl}
                            alt={`Medical attachment ${index + 1}`}
                            className="h-28 w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="h-36 flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-main)] text-[var(--text-muted)]">
                      <FileText size={28} />
                      <p className="mt-2 text-sm font-medium">No attachment found</p>
                    </div>
                  )}
                </div>

                <div className="glass p-4 rounded-xl border border-[var(--border-main)]">
                  <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-4">Request Timeline</h4>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--primary)] mt-1.5 shrink-0 ring-4 ring-[var(--primary-glow)]" />
                      <div>
                        <p className="text-sm font-medium text-[var(--text-main)]">Request Submitted</p>
                        <p className="text-xs text-[var(--text-muted)]">{selectedRequest.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 shrink-0 ring-4 ring-yellow-500/20" />
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
