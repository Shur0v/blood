'use client';

import React from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { UploadCloud, CheckCircle2, AlertCircle, CalendarDays, Plus, Trash2, ListChecks, Loader2 } from 'lucide-react';
import CityLocationAutocomplete, { type LocationSuggestion } from '@/src/components/CityLocationAutocomplete';
import CountryPhoneInput, { emptyPhoneValue, type PhoneFieldValue } from '@/src/components/CountryPhoneInput';
import WheelDatePickerModal from '@/src/components/WheelDatePickerModal';

interface ManualBloodDonorRow {
  id: string;
  name: string;
  blood_group: string;
  location_city: string;
  location_country: string;
  source: string;
  is_active_donor: boolean;
}

interface CommunityDonorRow {
  id: string;
  organization_name: string;
  contact_person?: string | null;
  location_city: string;
  location_country: string;
  mobile: string;
}

interface BulkDonorRow {
  id: string;
  name: string;
  location: LocationSuggestion | null;
  bloodGroup: string;
  phone: PhoneFieldValue;
  isPhoneValid: boolean;
}

const BULK_DEFAULT_ROWS = 10;
const BLOOD_GROUP_OPTIONS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const defaultBulkPhoneValue = (): PhoneFieldValue => ({
  countryName: 'Bangladesh',
  countryCode: 'BD',
  dialCode: '+880',
  localPhoneNumber: '',
  fullPhoneNumber: '',
});

const createBulkRow = (): BulkDonorRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  name: '',
  location: null,
  bloodGroup: '',
  phone: defaultBulkPhoneValue(),
  isPhoneValid: false,
});

export default function ManualBloodDonorPage() {
  const [selectedLocation, setSelectedLocation] = React.useState<LocationSuggestion | null>(null);
  const [phoneValue, setPhoneValue] = React.useState<PhoneFieldValue>(emptyPhoneValue());
  const [isPhoneValid, setIsPhoneValid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [isCommunityDeleting, setIsCommunityDeleting] = React.useState<string | null>(null);
  const [isCommunityDeletingAll, setIsCommunityDeletingAll] = React.useState(false);
  const [isLastDonationPickerOpen, setIsLastDonationPickerOpen] = React.useState(false);
  const [submitMessage, setSubmitMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bulkMessage, setBulkMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recentEntries, setRecentEntries] = React.useState<ManualBloodDonorRow[]>([]);
  const [bulkRows, setBulkRows] = React.useState<BulkDonorRow[]>(() => Array.from({ length: BULK_DEFAULT_ROWS }, () => createBulkRow()));
  
  // CSV Upload States
  const [csvText, setCsvText] = React.useState('');
  const [isCsvUploading, setIsCsvUploading] = React.useState(false);
  const [csvResult, setCsvResult] = React.useState<{createdCount: number, failedCount: number, failures: any[]} | null>(null);
  const [communityCsvText, setCommunityCsvText] = React.useState('');
  const [isCommunityCsvUploading, setIsCommunityCsvUploading] = React.useState(false);
  const [communityCsvResult, setCommunityCsvResult] = React.useState<{createdCount: number, failedCount: number, failures: any[]} | null>(null);
  const [communityEntries, setCommunityEntries] = React.useState<CommunityDonorRow[]>([]);

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    detailedAddressNote: '',
    bloodGroup: '',
    availabilityStatus: 'ACTIVE_READY',
    lastDonationDate: '',
    weightKg: '',
    heightCm: '',
    diabeticLevel: 'Non-Diabetic',
    hemoglobin: '',
    allergies: '',
    vaccinations: '',
    source: 'Offline Blood Camp',
    idVerified: false,
    consentReceived: true,
    adminNotes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);

    if (!selectedLocation) {
      setSubmitMessage({ type: 'error', text: 'Please select location from city suggestions.' });
      return;
    }
    if (!isPhoneValid) {
      setSubmitMessage({ type: 'error', text: 'Please provide a valid mobile number.' });
      return;
    }
    if (!formData.bloodGroup) {
      setSubmitMessage({ type: 'error', text: 'Please select blood group.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/manual-blood-donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          bloodGroup: formData.bloodGroup,
          availabilityStatus: formData.availabilityStatus,
          lastDonationDate: formData.lastDonationDate ? new Date(formData.lastDonationDate).toISOString() : null,
          source: formData.source,
          adminNotes: formData.adminNotes,
          idVerified: formData.idVerified,
          consentReceived: formData.consentReceived,
          location: selectedLocation,
          phone: {
            country_name: phoneValue.countryName,
            country_code: phoneValue.countryCode,
            dial_code: phoneValue.dialCode,
            local_phone_number: phoneValue.localPhoneNumber,
            full_phone_number: phoneValue.fullPhoneNumber,
          },
          health: {
            weightKg: formData.weightKg,
            heightCm: formData.heightCm,
            diabeticLevel: formData.diabeticLevel,
            hemoglobin: formData.hemoglobin,
            allergies: formData.allergies,
            vaccinations: formData.vaccinations,
            detailedAddressNote: formData.detailedAddressNote,
          },
        }),
      });

      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to add donor.');
      }

      setSubmitMessage({ type: 'success', text: 'Manual donor saved successfully. Homepage count/list will refresh shortly.' });
      setFormData({
        name: '',
        email: '',
        detailedAddressNote: '',
        bloodGroup: '',
        availabilityStatus: 'ACTIVE_READY',
        lastDonationDate: '',
        weightKg: '',
        heightCm: '',
        diabeticLevel: 'Non-Diabetic',
        hemoglobin: '',
        allergies: '',
        vaccinations: '',
        source: 'Offline Blood Camp',
        idVerified: false,
        consentReceived: true,
        adminNotes: '',
      });
      setSelectedLocation(null);
      setPhoneValue(emptyPhoneValue());
      setIsPhoneValid(false);
      await loadRecentEntries();
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error?.message || 'Failed to add donor.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateBulkRowText = (id: string, key: 'name' | 'bloodGroup', value: string) => {
    setBulkRows((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const updateBulkRowLocation = (id: string, location: LocationSuggestion | null) => {
    setBulkRows((prev) => prev.map((row) => (row.id === id ? { ...row, location } : row)));
  };

  const updateBulkRowPhone = (id: string, phone: PhoneFieldValue) => {
    setBulkRows((prev) => prev.map((row) => (row.id === id ? { ...row, phone } : row)));
  };

  const updateBulkRowPhoneValidity = (id: string, isPhoneValid: boolean) => {
    setBulkRows((prev) => prev.map((row) => (row.id === id ? { ...row, isPhoneValid } : row)));
  };

  const addBulkRows = (count: number) => {
    setBulkRows((prev) => [...prev, ...Array.from({ length: count }, () => createBulkRow())]);
  };

  const removeBulkRow = (id: string) => {
    setBulkRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((row) => row.id !== id);
    });
  };

  const isRowEmpty = (row: BulkDonorRow) => {
    return !row.name.trim() && !row.location && !row.bloodGroup.trim() && !row.phone.localPhoneNumber.trim();
  };

  const isRowComplete = (row: BulkDonorRow) => {
    return Boolean(row.name.trim() && row.location && row.bloodGroup.trim() && row.isPhoneValid && row.phone.fullPhoneNumber);
  };

  const clearBulkRows = () => {
    setBulkRows(Array.from({ length: BULK_DEFAULT_ROWS }, () => createBulkRow()));
    setBulkMessage(null);
  };

  const handleBulkSubmit = async () => {
    setBulkMessage(null);

    const partiallyFilledRows = bulkRows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => !isRowEmpty(row) && !isRowComplete(row));

    if (partiallyFilledRows.length > 0) {
      setBulkMessage({
        type: 'error',
        text: `Please complete name, city, blood group and valid mobile in rows: ${partiallyFilledRows
          .slice(0, 8)
          .map(({ index }) => index + 1)
          .join(', ')}${partiallyFilledRows.length > 8 ? '...' : ''}`,
      });
      return;
    }

    const completedRows = bulkRows.filter((row) => isRowComplete(row));
    if (completedRows.length === 0) {
      setBulkMessage({ type: 'error', text: 'Add at least one complete donor row before submitting.' });
      return;
    }

    try {
      setIsBulkSubmitting(true);
      const res = await fetch('/api/admin/manual-blood-donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bulkDonors: completedRows.map((row) => ({
            name: row.name.trim(),
            location: row.location!,
            bloodGroup: row.bloodGroup.trim().toUpperCase(),
            phone: {
              country_name: row.phone.countryName,
              country_code: row.phone.countryCode,
              dial_code: row.phone.dialCode,
              local_phone_number: row.phone.localPhoneNumber,
              full_phone_number: row.phone.fullPhoneNumber,
            },
          })),
          source: 'Bulk Manual Entry',
          availabilityStatus: 'ACTIVE_READY',
          consentReceived: true,
          idVerified: false,
        }),
      });

      const payload = await res.json();
      const createdCount = payload?.data?.createdCount ?? 0;
      const failedCount = payload?.data?.failedCount ?? 0;
      const failures: Array<{ rowIndex: number; reason: string }> = payload?.data?.failures || [];

      if (!res.ok && createdCount === 0) {
        throw new Error(payload?.message || 'Failed to add bulk donor records.');
      }

      if (createdCount > 0 && failedCount === 0) {
        setBulkMessage({ type: 'success', text: `Successfully added ${createdCount} donor record(s).` });
      } else if (createdCount > 0 && failedCount > 0) {
        const shortFailureText = failures
          .slice(0, 3)
          .map((item) => `Row ${item.rowIndex + 1}: ${item.reason}`)
          .join(' | ');
        setBulkMessage({
          type: 'error',
          text: `Added ${createdCount} donor(s), ${failedCount} row(s) failed. ${shortFailureText}`,
        });
      } else {
        setBulkMessage({ type: 'error', text: payload?.message || 'No donors were created.' });
      }

      await loadRecentEntries();
    } catch (error: any) {
      setBulkMessage({ type: 'error', text: error?.message || 'Failed to add bulk donor records.' });
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const loadRecentEntries = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/manual-blood-donors', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        return;
      }
      setRecentEntries(payload.data || []);
    } catch (error) {
      // silent load failure
    }
  }, []);

  const loadCommunityEntries = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/community-donors', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) return;
      setCommunityEntries(payload.data || []);
    } catch {
      // silent load failure
    }
  }, []);

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    setIsCsvUploading(true);
    setCsvResult(null);

    try {
      const res = await fetch('/api/admin/manual-blood-donors/csv-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ csvText }),
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        setCsvResult(payload.data);
        if (payload.data.createdCount > 0) {
          setCsvText('');
          await loadRecentEntries();
        }
      } else {
         setCsvResult({ createdCount: 0, failedCount: 0, failures: [{ row: 'System Error', reason: payload.message || 'Unknown error' }] });
      }
    } catch (err: any) {
      setCsvResult({ createdCount: 0, failedCount: 0, failures: [{ row: 'Network Error', reason: err.message || 'Failed to upload' }] });
    } finally {
      setIsCsvUploading(false);
    }
  };

  const handleCommunityCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communityCsvText.trim()) return;
    setIsCommunityCsvUploading(true);
    setCommunityCsvResult(null);

    try {
      const res = await fetch('/api/admin/community-donors/csv-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ csvText: communityCsvText }),
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        setCommunityCsvResult(payload.data);
        if (payload.data.createdCount > 0) {
          setCommunityCsvText('');
          await loadCommunityEntries();
        }
      } else {
        setCommunityCsvResult({ createdCount: 0, failedCount: 0, failures: [{ row: 'System Error', reason: payload.message || 'Unknown error' }] });
      }
    } catch (err: any) {
      setCommunityCsvResult({ createdCount: 0, failedCount: 0, failures: [{ row: 'Network Error', reason: err.message || 'Failed to upload' }] });
    } finally {
      setIsCommunityCsvUploading(false);
    }
  };

  React.useEffect(() => {
    void loadRecentEntries();
    void loadCommunityEntries();
  }, [loadRecentEntries, loadCommunityEntries]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this manual donor record?')) {
      return;
    }
    try {
      setIsDeleting(id);
      const res = await fetch(`/api/admin/manual-blood-donors?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete donor.');
      }
      setRecentEntries((prev) => prev.filter((row) => row.id !== id));
      setSubmitMessage({ type: 'success', text: 'Manual donor deleted successfully.' });
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error?.message || 'Failed to delete donor.' });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCommunityDelete = async (id: string) => {
    if (!confirm('Delete this community entry?')) {
      return;
    }
    try {
      setIsCommunityDeleting(id);
      const res = await fetch(`/api/admin/community-donors?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete community entry.');
      }
      setCommunityEntries((prev) => prev.filter((row) => row.id !== id));
      setSubmitMessage({ type: 'success', text: 'Community entry deleted successfully.' });
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error?.message || 'Failed to delete community entry.' });
    } finally {
      setIsCommunityDeleting(null);
    }
  };

  const handleDeleteAllCommunity = async () => {
    if (!confirm('Delete ALL community entries? This will remove all active community cards.')) {
      return;
    }
    try {
      setIsCommunityDeletingAll(true);
      const res = await fetch('/api/admin/community-donors?all=true', {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete all community entries.');
      }
      setCommunityEntries([]);
      setSubmitMessage({
        type: 'success',
        text: payload?.message || 'All community entries deleted successfully.',
      });
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error?.message || 'Failed to delete all community entries.' });
    } finally {
      setIsCommunityDeletingAll(false);
    }
  };

  const formatDateLabel = (value: string) => {
    if (!value) return 'Select date';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Select date';
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // API Integration Note: 
  // Form submits to POST /api/admin/donors/manual
  // Table fetches from GET /api/admin/donors/manual?type=blood

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Manual Blood Donor Entry</h2>
        <p className="text-sm text-gray-500 mt-1">Add offline or verified institutional donor records directly into the searchable ecosystem.</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4 rounded-xl flex gap-3 text-sm text-blue-800 dark:text-blue-300 leading-relaxed shadow-sm">
        <AlertCircle className="shrink-0 mt-0.5 text-blue-500" size={18} />
        <p><strong>System Note:</strong> Donors added here automatically merge into the location-based algorithms. They will be visible to users in their respective regions based on the selected Country and City. Ensure consent is fully verified.</p>
      </div>

      <Card title="Direct CSV/Text Bulk Upload">
        <form onSubmit={handleCsvSubmit} className="space-y-4">
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            disabled={isCsvUploading}
            placeholder={`John Doe, Dhaka, O+, 01711000000\nJane Smith, Delhi, B-, 9800000000`}
            className="w-full h-40 bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 outline-none font-mono placeholder:text-gray-400 disabled:opacity-60"
          />
          <p className="text-xs text-gray-500 font-medium">Ensure exact sequence: Name, Location, Blood Group, Number (local digits only). Each record on a new line.</p>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCsvUploading || !csvText.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCsvUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing & Verifying (Please wait)...
                </>
              ) : (
                <>
                  <UploadCloud className="h-5 w-5" />
                  Upload & Process Data
                </>
              )}
            </button>
          </div>

          {csvResult && (
            <div className="mt-4 space-y-3">
              {(csvResult.createdCount > 0 || csvResult.failedCount > 0) && (
                <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${csvResult.createdCount > 0 ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'border-red-400/30 bg-red-500/10 text-red-600 dark:text-red-300'}`}>
                  Successfully added {csvResult.createdCount} donors. {csvResult.failedCount} failed.
                </div>
              )}
              {csvResult.failures && csvResult.failures.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-3 space-y-2">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">Failure Report</p>
                  {csvResult.failures.map((f, i) => (
                    <div key={i} className="text-sm text-red-800 dark:text-red-200 bg-white/50 dark:bg-black/20 px-3 py-2 rounded-md">
                      <span className="font-semibold block break-all">{f.row}</span>
                      <span className="text-red-500 dark:text-red-400 text-xs mt-0.5 block">{f.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>
      </Card>

      <Card title="Community Organization CSV Upload">
        <form onSubmit={handleCommunityCsvSubmit} className="space-y-4">
          <textarea
            value={communityCsvText}
            onChange={(e) => setCommunityCsvText(e.target.value)}
            disabled={isCommunityCsvUploading}
            placeholder={`Central Pennsylvania Blood Bank, Harrisburg - United States, 8007710059, Team Desk\nConnectLife, Buffalo - United States, 7165292730`}
            className="w-full h-32 bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono placeholder:text-gray-400 disabled:opacity-60"
          />
          <p className="text-xs text-gray-500 font-medium">Sequence: Organization, City - Country, Number, Contact(optional). The "-" divider inside 2nd field is required for location split.</p>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCommunityCsvUploading || !communityCsvText.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCommunityCsvUploading ? <><Loader2 className="h-5 w-5 animate-spin" />Processing...</> : <><UploadCloud className="h-5 w-5" />Upload Community Data</>}
            </button>
          </div>
          {communityCsvResult && (
            <div className="rounded-lg border px-4 py-3 text-sm font-semibold border-amber-300/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              Added {communityCsvResult.createdCount} community records. {communityCsvResult.failedCount} failed.
            </div>
          )}
        </form>
      </Card>

      <Card title="Bulk Quick Add Donors (Name, City, Blood Group, Mobile)">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge type="info">
              <span className="inline-flex items-center gap-1">
                <ListChecks className="h-3.5 w-3.5" />
                {bulkRows.filter((row) => isRowComplete(row)).length} ready / {bulkRows.length} rows
              </span>
            </Badge>
            <button
              type="button"
              onClick={() => addBulkRows(1)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-[#0f1115] dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Add Row
            </button>
            <button
              type="button"
              onClick={() => addBulkRows(10)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-[#0f1115] dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Add 10 Rows
            </button>
            <button
              type="button"
              onClick={clearBulkRows}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-[#0f1115] dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Reset
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1b23]">
            <table className="w-full min-w-[1020px] border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/20">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">#</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Name *</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">City *</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Blood Group *</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Mobile Number *</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {bulkRows.map((row, index) => {
                  const isComplete = isRowComplete(row);
                  const isPartial = !isRowEmpty(row) && !isComplete;
                  return (
                    <tr key={row.id} className={isPartial ? 'bg-amber-50/50 dark:bg-amber-500/5' : ''}>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateBulkRowText(row.id, 'name', e.target.value)}
                          placeholder="Full name"
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-red-400 focus:bg-white dark:border-gray-700 dark:bg-[#0f1115] dark:text-gray-100"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <CityLocationAutocomplete
                          label="City"
                          placeholder="Search city"
                          selectedLocation={row.location}
                          onSelect={(location) => updateBulkRowLocation(row.id, location)}
                          onClear={() => updateBulkRowLocation(row.id, null)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={row.bloodGroup}
                          onChange={(e) => updateBulkRowText(row.id, 'bloodGroup', e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-red-600 outline-none transition focus:border-red-400 focus:bg-white dark:border-gray-700 dark:bg-[#0f1115]"
                        >
                          <option value="">Select</option>
                          {BLOOD_GROUP_OPTIONS.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <CountryPhoneInput
                          label="Mobile"
                          compact
                          forceWhiteText
                          value={row.phone}
                          onChange={(value) => updateBulkRowPhone(row.id, value)}
                          onValidityChange={(valid) => updateBulkRowPhoneValidity(row.id, valid)}
                        />
                       </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeBulkRow(row.id)}
                          disabled={bulkRows.length <= 1}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              Tip: You can submit 10-20+ rows together. Only fully completed rows are accepted.
            </p>
            <button
              type="button"
              onClick={() => void handleBulkSubmit()}
              disabled={isBulkSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isBulkSubmitting ? 'Saving Rows...' : 'Save All Valid Rows'}
            </button>
          </div>

          {bulkMessage && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
                bulkMessage.type === 'success'
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                  : 'border-red-400/30 bg-red-500/10 text-red-600 dark:text-red-300'
              }`}
            >
              {bulkMessage.text}
            </div>
          )}
        </div>
      </Card>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Core Identity */}
        <Card title="Donor Identity & Contact">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" required />
            </div>
            <div>
              <CountryPhoneInput
                label="Mobile Number"
                required
                compact
                forceWhiteText
                value={phoneValue}
                onChange={setPhoneValue}
                onValidityChange={(valid) => setIsPhoneValid(valid)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div className="lg:col-span-2">
              <CityLocationAutocomplete
                label="Location"
                placeholder="Search your city"
                required
                selectedLocation={selectedLocation}
                onSelect={setSelectedLocation}
                onClear={() => setSelectedLocation(null)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Detailed Address Note</label>
              <input type="text" value={formData.detailedAddressNote} onChange={(e) => setFormData((prev) => ({ ...prev, detailedAddressNote: e.target.value }))} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
          </div>
        </Card>

        {/* Medical Setup */}
        <Card title="Medical Profile & Stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Blood Group *</label>
              <select value={formData.bloodGroup} onChange={(e) => setFormData((prev) => ({ ...prev, bloodGroup: e.target.value }))} className="w-full bg-red-50 dark:bg-red-500/10 text-red-600 font-bold border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" required>
                <option value="">Select Group</option>
                <option>O+</option><option>O-</option><option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Availability Status</label>
              <select value={formData.availabilityStatus} onChange={(e) => setFormData((prev) => ({ ...prev, availabilityStatus: e.target.value }))} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none">
                <option value="ACTIVE_READY">Active / Ready</option>
                <option value="INACTIVE_UNAVAILABLE">Inactive / Unavailable</option>
                <option value="EMERGENCY_ONLY">Emergency Only</option>
              </select>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Last Donation Date</label>
               <button
                 type="button"
                 onClick={() => setIsLastDonationPickerOpen(true)}
                 className={`w-full flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm outline-none transition ${
                   formData.lastDonationDate
                     ? 'border-emerald-400/60 bg-emerald-50 text-gray-800 dark:bg-emerald-500/10 dark:text-white'
                     : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-[#0f1115] dark:text-gray-400'
                 }`}
               >
                 <CalendarDays className="h-4 w-4" />
                 <span>{formatDateLabel(formData.lastDonationDate)}</span>
               </button>
            </div>
            
            {/* Health Vitals */}
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Weight (kg) / Height (cm)</label>
               <div className="flex gap-2">
                 <input type="number" value={formData.weightKg} onChange={(e) => setFormData((prev) => ({ ...prev, weightKg: e.target.value }))} placeholder="kg" className="w-1/2 bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none" />
                 <input type="number" value={formData.heightCm} onChange={(e) => setFormData((prev) => ({ ...prev, heightCm: e.target.value }))} placeholder="cm" className="w-1/2 bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none" />
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Diabetic Level</label>
               <select value={formData.diabeticLevel} onChange={(e) => setFormData((prev) => ({ ...prev, diabeticLevel: e.target.value }))} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm outline-none">
                 <option value="Non-Diabetic">Non-Diabetic</option><option value="Type 1">Type 1</option><option value="Type 2">Type 2</option>
               </select>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Hemoglobin Level (g/dL)</label>
               <input type="text" value={formData.hemoglobin} onChange={(e) => setFormData((prev) => ({ ...prev, hemoglobin: e.target.value }))} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm outline-none" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Known Allergies</label>
               <input type="text" value={formData.allergies} onChange={(e) => setFormData((prev) => ({ ...prev, allergies: e.target.value }))} placeholder="e.g. Penicillin, Peanuts" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none" />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Vaccinations</label>
               <input type="text" value={formData.vaccinations} onChange={(e) => setFormData((prev) => ({ ...prev, vaccinations: e.target.value }))} placeholder="e.g. Hep B, COVID-19" className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none" />
             </div>
          </div>
        </Card>

        {/* Admin Meta & Security */}
        <Card title="Verification & Consent Setup">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Data Source Origin</label>
                <select value={formData.source} onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value }))} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none">
                  <option value="Offline Blood Camp">Offline Blood Camp</option>
                  <option value="Partner Hospital">Partner Hospital</option>
                  <option value="Direct Manual Outreach">Direct Manual Outreach</option>
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" checked={formData.idVerified} onChange={(e) => setFormData((prev) => ({ ...prev, idVerified: e.target.checked }))} className="w-4 h-4 text-red-600 rounded border-gray-300" />
                  ID Verified Manually
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" checked={formData.consentReceived} onChange={(e) => setFormData((prev) => ({ ...prev, consentReceived: e.target.checked }))} className="w-4 h-4 text-red-600 rounded border-gray-300" />
                  Consent Received Formally
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Admin Notes</label>
                <textarea rows={3} value={formData.adminNotes} onChange={(e) => setFormData((prev) => ({ ...prev, adminNotes: e.target.value }))} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none" placeholder="Internal remarks regarding this record..."></textarea>
              </div>
            </div>

            {/* Document Upload Area */}
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Medical Proof / Prescription Upload</label>
               <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-xl flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                 <UploadCloud className="text-gray-400 mb-2" size={32} />
                 <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drag & drop files or click to browse</p>
                 <p className="text-xs text-gray-500 mt-1">Supports PDF, JPG, PNG up to 10MB</p>
               </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
             <button type="submit" disabled={isSubmitting || !selectedLocation || !isPhoneValid || !formData.name || !formData.bloodGroup} className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
               <CheckCircle2 size={18} /> {isSubmitting ? 'Saving...' : 'Add Donor Record'}
             </button>
          </div>
          {submitMessage && (
            <div className={`mt-4 rounded-lg border px-4 py-3 text-sm font-semibold ${submitMessage.type === 'success' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'border-red-400/30 bg-red-500/10 text-red-600 dark:text-red-300'}`}>
              {submitMessage.text}
            </div>
          )}
        </Card>
      </form>

      <WheelDatePickerModal
        isOpen={isLastDonationPickerOpen}
        onClose={() => setIsLastDonationPickerOpen(false)}
        onConfirm={(value) => setFormData((prev) => ({ ...prev, lastDonationDate: value }))}
        initialDate={formData.lastDonationDate}
        title="Select Last Donation Date"
        subtitle="Use arrows and keep the selected value in the center row."
        confirmLabel="Apply Date"
        allowClear
        clearLabel="Clear Date"
        maxDate={new Date()}
        theme="light"
      />

      {/* Added Donors List preview */}
      <div className="pt-8">
        <h3 className="text-xl font-bold mb-4 border-t border-gray-200 dark:border-gray-800 pt-8">Recent Manual Entries</h3>
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-[#1a1b23]">
          <Table headers={['ID', 'Name', 'Blood Group', 'Location', 'Source', 'Status', 'Actions']}>
            {recentEntries.length === 0 ? (
              <TableRow>
                <TableCell className="font-medium text-gray-500">-</TableCell>
                <TableCell className="text-gray-500">No entries yet</TableCell>
                <TableCell className="text-gray-500">-</TableCell>
                <TableCell className="text-gray-500">-</TableCell>
                <TableCell className="text-gray-500">-</TableCell>
                <TableCell className="text-gray-500">-</TableCell>
                <TableCell className="text-gray-500">-</TableCell>
              </TableRow>
            ) : (
              recentEntries.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-semibold">{row.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell><Badge type="danger">{row.blood_group}</Badge></TableCell>
                  <TableCell>{row.location_city}, {row.location_country}</TableCell>
                  <TableCell className="text-gray-500">{row.source}</TableCell>
                  <TableCell><Badge type={row.is_active_donor ? 'success' : 'warning'}>{row.is_active_donor ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => void handleDelete(row.id)}
                      disabled={isDeleting === row.id}
                      className="text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                    >
                      {isDeleting === row.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </Table>
        </div>
      </div>

      <div className="pt-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold">Recent Community Entries</h3>
          <button
            type="button"
            onClick={() => void handleDeleteAllCommunity()}
            disabled={isCommunityDeletingAll || communityEntries.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {isCommunityDeletingAll ? 'Deleting All...' : 'Delete All'}
          </button>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-[#1a1b23]">
          <Table headers={['ID', 'Organization', 'Contact', 'Location', 'Mobile', 'Actions']}>
            {communityEntries.length === 0 ? (
              <TableRow>
                <TableCell className="font-medium text-gray-500">-</TableCell>
                <TableCell className="text-gray-500">No community entries yet</TableCell>
                <TableCell className="text-gray-500">-</TableCell>
                <TableCell className="text-gray-500">-</TableCell>
                <TableCell className="text-gray-500">-</TableCell>
                <TableCell className="text-gray-500">-</TableCell>
              </TableRow>
            ) : (
              communityEntries.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-semibold">{row.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell>{row.organization_name}</TableCell>
                  <TableCell>{row.contact_person || '-'}</TableCell>
                  <TableCell>{row.location_city}, {row.location_country}</TableCell>
                  <TableCell>{row.mobile}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => void handleCommunityDelete(row.id)}
                      disabled={isCommunityDeleting === row.id}
                      className="text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                    >
                      {isCommunityDeleting === row.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </Table>
        </div>
      </div>
    </div>
  );
}
