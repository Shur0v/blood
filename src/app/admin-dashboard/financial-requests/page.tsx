"use client";

import React, { useState, useEffect } from "react";
import { 
  Heart, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Hospital, 
  Mail, 
  Phone,
  Eye,
  Edit3,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const parseStoredUrls = (raw?: string | null): string[] => {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === "string" && v.length > 0);
      }
    } catch {
      return [];
    }
  }
  return [trimmed];
};

export default function FinancialRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total_raised: 13500,
    total_spent: 15000,
    completed_ops: 37,
    uncompleted_ops: 19,
    weekly_donors: 120,
    donor_requests: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  // Edit Stats Modal State
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...stats });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchRequests();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/public/platform-stats", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        const normalized = {
          total_raised: Number(json.data.total_raised ?? 13500),
          total_spent: Number(json.data.total_spent ?? 15000),
          completed_ops: Number(json.data.completed_ops ?? 37),
          uncompleted_ops: Number(json.data.uncompleted_ops ?? 19),
          weekly_donors: Number(json.data.weekly_donors ?? 120),
          donor_requests: Number(json.data.donor_requests ?? 0),
        };
        setStats(normalized);
        setEditFormData(normalized);
      }
    } catch (e) {
      console.log("Stats fetch error - falling back to defaults", e);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/aid-requests", {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success && json.data) {
        setRequests(json.data);
      }
    } catch (e) {
      console.log("Requests fetch error:", e);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/aid-requests", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setRequests(requests.map(req =>
          req.id === id ? { ...req, status: newStatus } : req
        ));
        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest({ ...selectedRequest, status: newStatus });
        }
        fetchStats();
      }
    } catch (e) {
      console.error("Failed to update status");
    }
  };

  const handleSaveStats = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/platform-stats", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_raised: Number(editFormData.total_raised ?? 0),
          total_spent: Number(editFormData.total_spent ?? 0),
          completed_ops: Number(editFormData.completed_ops ?? 0),
          uncompleted_ops: Number(editFormData.uncompleted_ops ?? 0),
          weekly_donors: Number(editFormData.weekly_donors ?? 0),
          donor_requests: Number(editFormData.donor_requests ?? 0),
          donorRequests: Number(editFormData.donor_requests ?? 0),
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const normalized = {
          total_raised: Number(json.data.total_raised ?? 13500),
          total_spent: Number(json.data.total_spent ?? 15000),
          completed_ops: Number(json.data.completed_ops ?? 37),
          uncompleted_ops: Number(json.data.uncompleted_ops ?? 19),
          weekly_donors: Number(json.data.weekly_donors ?? 120),
          donor_requests: Number(json.data.donor_requests ?? 0),
        };
        setStats(normalized);
        setEditFormData(normalized);
        setIsEditingStats(false);
      }
    } catch (error) {
      console.error(error);
    }
    setIsSaving(false);
  };

  const handleDeleteRequest = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this aid request permanently?");
    if (!confirmed) return;

    setDeletingRequestId(id);
    try {
      const res = await fetch("/api/admin/aid-requests", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        return;
      }

      setRequests((prev) => prev.filter((req) => req.id !== id));
      if (selectedRequest?.id === id) {
        setSelectedRequest(null);
      }
      void fetchStats();
    } catch (error) {
      console.error("Failed to delete request", error);
    } finally {
      setDeletingRequestId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-500 fill-rose-500" /> 
            Donation & Aid Management
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Review unregistered patient medical aid requests and track global fund allocation.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditingStats(true)}
            className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <Edit3 size={16} /> Edit Platform Stats
          </button>
          <button className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-rose-100 transition-all flex items-center gap-2">
            <TrendingUp size={16} /> Download Report
          </button>
        </div>
      </div>

      {/* Global Financial Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 bg-green-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-green-500/20 transition-all text-green-500"></div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest relative z-10">Total Raised</p>
          <div className="flex items-end gap-2 mt-2 relative z-10">
            <span className="text-3xl font-black text-gray-900 dark:text-white">${stats.total_raised.toLocaleString()}</span>
            <span className="text-xs font-bold text-green-500 mb-1 flex items-center"><TrendingUp size={12} className="mr-0.5"/> Tracking</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 bg-orange-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-orange-500/20 transition-all text-orange-500"></div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest relative z-10">Total Spent</p>
          <div className="flex items-end gap-2 mt-2 relative z-10">
            <span className="text-3xl font-black text-gray-900 dark:text-white">${stats.total_spent.toLocaleString()}</span>
            <span className="text-xs font-bold text-orange-500 mb-1">In {stats.completed_ops} Ops</span>
          </div>
        </div>

        <div className="bg-rose-500 dark:bg-rose-600 rounded-2xl p-6 shadow-md relative overflow-hidden text-white">
          <Activity className="absolute right-0 top-0 h-32 w-32 text-white/10 -mr-8 -mt-8" />
          <p className="text-xs font-bold text-rose-100 uppercase tracking-widest relative z-10">Donated This Week</p>
          <div className="flex items-end gap-2 mt-2 relative z-10">
            <span className="text-3xl font-black">{stats.weekly_donors.toLocaleString()}</span>
            <span className="text-xs font-bold text-rose-200 mb-1">People</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest relative z-10">Op Status</p>
          <div className="flex items-end gap-4 mt-2 relative z-10">
            <div>
              <span className="text-xl font-black text-gray-900 dark:text-white">{stats.completed_ops}</span>
              <p className="text-[10px] text-green-500 font-bold uppercase">Completed</p>
            </div>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800"></div>
            <div>
              <span className="text-xl font-black text-gray-900 dark:text-white">{stats.uncompleted_ops}</span>
              <p className="text-[10px] text-orange-500 font-bold uppercase">Uncompleted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Requests List & Verification Panel */}
      <div className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Header / Toolbar */}
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pending Medical Aid Appeals</h2>
            <p className="text-xs text-gray-500 mt-1">Review cases submitted from the homepage donation form.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by patient or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full md:w-64 border border-gray-200 dark:border-gray-800 rounded-xl text-sm bg-gray-50 dark:bg-[#0f1115] focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-[#0f1115] text-xs uppercase text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Patient & ID</th>
                <th className="px-6 py-4 font-bold">Hospital Details</th>
                <th className="px-6 py-4 font-bold">Fund Requested</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {requests.filter(r => r.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) || r.id.toLowerCase().includes(searchQuery.toLowerCase())).map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-[#0f1115]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {req.patient_name}
                      {req.status === 'PENDING' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock size={12}/> {new Date(req.created_at).toLocaleDateString()} • {req.id.slice(-6)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 dark:text-gray-200 font-medium flex items-center gap-2">
                      <Hospital size={14} className="text-gray-400"/> {req.hospital_name}
                    </div>
                    <button className="text-[10px] uppercase font-bold text-blue-500 mt-1 hover:underline">Verify Identity</button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-black text-lg text-gray-900 dark:text-white">${req.amount_required}</div>
                    <div className="text-xs text-gray-500">USD</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      req.status === 'PENDING' ? 'bg-orange-100 text-orange-600 border border-orange-200' :
                      req.status === 'APPROVED' ? 'bg-green-100 text-green-600 border border-green-200' :
                      'bg-red-100 text-red-600 border border-red-200'
                    }`}>
                      {req.status === 'PENDING' && <Clock size={12}/>}
                      {req.status === 'APPROVED' && <CheckCircle size={12}/>}
                      {req.status === 'REJECTED' && <XCircle size={12}/>}
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedRequest(req)}
                        className="inline-flex items-center gap-2 bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-700 shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Eye size={14}/> Review Case
                      </button>
                      <button
                        onClick={() => void handleDeleteRequest(req.id)}
                        disabled={deletingRequestId === req.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                        {deletingRequestId === req.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {requests.length === 0 && (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
              <Activity className="h-10 w-10 text-gray-300 mb-3" />
              <p>No appeals found.</p>
              <p className="text-xs mt-1">(If database is disconnected, requests won't load)</p>
            </div>
          )}
        </div>
      </div>

      {/* Case Review Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#1a1b23] relative w-full max-w-3xl overflow-hidden rounded-[32px] shadow-2xl p-8 z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">REQ-{selectedRequest.id.slice(-6)}</span>
                    <span className="text-gray-400 text-xs">{new Date(selectedRequest.created_at).toLocaleDateString()}</span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">{selectedRequest.patient_name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Requested Fund</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">${selectedRequest.amount_required}</p>
                </div>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5 mb-2"><Hospital size={14}/> Medical Authority</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-[#0f1115] p-3 rounded-xl border border-gray-100 dark:border-gray-800">{selectedRequest.hospital_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Contact Details</p>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <p className="flex items-center gap-2"><Mail size={14} className="text-gray-400"/> {selectedRequest.email}</p>
                      <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {selectedRequest.phone}</p>
                      {selectedRequest.phone_country_name && (
                        <p className="text-xs text-gray-500">
                          {selectedRequest.phone_country_name} ({selectedRequest.phone_dial_code}) · Local: {selectedRequest.phone_local_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><FileText size={14}/> Medical Condition / Note</p>
                  <div className="bg-gray-50 dark:bg-[#0f1115] p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300 h-full">
                    {selectedRequest.medical_note}
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="mb-8">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Attached Verified Documents</p>
                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/60 p-3">
                      <p className="mb-2 text-xs font-black uppercase tracking-widest text-gray-500">Prescriptions</p>
                      {parseStoredUrls(selectedRequest.prescription_url).length === 0 ? (
                        <p className="text-xs font-semibold text-gray-400">No Prescription</p>
                      ) : (
                        <div className="space-y-2">
                          {parseStoredUrls(selectedRequest.prescription_url).map((url, idx) => (
                            <a
                              key={`${url}-${idx}`}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:border-gray-700 dark:bg-[#141821] dark:text-blue-300 dark:hover:bg-[#1a2231]"
                            >
                              <FileText className="h-4 w-4" />
                              Open Prescription {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/60 p-3">
                      <p className="mb-2 text-xs font-black uppercase tracking-widest text-gray-500">Medical Reports</p>
                      {parseStoredUrls(selectedRequest.report_url).length === 0 ? (
                        <p className="text-xs font-semibold text-gray-400">No Medical Report</p>
                      ) : (
                        <div className="space-y-2">
                          {parseStoredUrls(selectedRequest.report_url).map((url, idx) => (
                            <a
                              key={`${url}-${idx}`}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:border-gray-700 dark:bg-[#141821] dark:text-blue-300 dark:hover:bg-[#1a2231]"
                            >
                              <FileText className="h-4 w-4" />
                              Open Medical Report {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => void handleDeleteRequest(selectedRequest.id)}
                  disabled={deletingRequestId === selectedRequest.id}
                  className="px-6 py-3 text-xs font-black uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 transition-colors rounded-xl flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  {deletingRequestId === selectedRequest.id ? "Deleting..." : "Delete Request"}
                </button>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-xl"
                >
                  Close
                </button>
                {selectedRequest.status === 'PENDING' && (
                  <>
                    <button 
                      onClick={() => handleStatusChange(selectedRequest.id, 'REJECTED')}
                      className="px-6 py-3 text-xs font-black uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 transition-colors rounded-xl flex items-center gap-2"
                    >
                      <XCircle size={16}/> Reject & Ban
                    </button>
                    <button 
                      onClick={() => handleStatusChange(selectedRequest.id, 'APPROVED')}
                      className="px-8 py-3 text-xs font-black uppercase tracking-widest text-white bg-green-600 hover:bg-green-700 transition-colors rounded-xl flex items-center gap-2 shadow-lg shadow-green-500/30"
                    >
                      <CheckCircle size={16}/> Approve to List
                    </button>
                  </>
                )}
                {selectedRequest.status !== 'PENDING' && (
                   <span className={`inline-flex items-center gap-1 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest ${
                      selectedRequest.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedRequest.status === 'APPROVED' ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                      Case {selectedRequest.status}
                    </span>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      
      {/* Edit Global Stats Modal */}
      <AnimatePresence>
        {isEditingStats && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setIsEditingStats(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#1a1b23] relative w-full max-w-lg overflow-hidden rounded-[32px] shadow-2xl p-8 z-10"
            >
              <div className="mb-6">
                 <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                   <Edit3 className="text-rose-500"/> Edit Platform Data
                 </h2>
                 <p className="text-xs text-gray-500 mt-1">Changes made here will instantly reflect on the homepage transparency dashboard.</p>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Total Raised ($)</label>
                  <input 
                    type="number"
                    value={editFormData.total_raised}
                    onChange={e => setEditFormData({...editFormData, total_raised: Number(e.target.value)})}
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-[#0f1115] focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Total Spent ($)</label>
                  <input 
                    type="number"
                    value={editFormData.total_spent}
                    onChange={e => setEditFormData({...editFormData, total_spent: Number(e.target.value)})}
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-[#0f1115] focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Completed Ops</label>
                    <input 
                      type="number"
                      value={editFormData.completed_ops}
                      onChange={e => setEditFormData({...editFormData, completed_ops: Number(e.target.value)})}
                      className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-[#0f1115] focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Uncompleted Ops</label>
                    <input 
                      type="number"
                      value={editFormData.uncompleted_ops}
                      onChange={e => setEditFormData({...editFormData, uncompleted_ops: Number(e.target.value)})}
                      className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-[#0f1115] focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Weekly Donors (People)</label>
                  <input 
                    type="number"
                    value={editFormData.weekly_donors}
                    onChange={e => setEditFormData({...editFormData, weekly_donors: Number(e.target.value)})}
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-[#0f1115] focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Total Donation Requests</label>
                  <input
                    type="number"
                    value={editFormData.donor_requests}
                    onChange={e => setEditFormData({...editFormData, donor_requests: Number(e.target.value)})}
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-[#0f1115] focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={isSaving}
                  onClick={() => setIsEditingStats(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={isSaving}
                  onClick={handleSaveStats}
                  className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                >
                  {isSaving ? "Saving..." : <><CheckCircle size={16}/> Save & Publish</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
