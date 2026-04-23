'use client';

import React from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { UploadCloud, CheckCircle2, HeartPulse } from 'lucide-react';
import CityLocationAutocomplete, { type LocationSuggestion } from '@/src/components/CityLocationAutocomplete';
import CountryPhoneInput, { emptyPhoneValue, type PhoneFieldValue } from '@/src/components/CountryPhoneInput';
import { ORGAN_CATALOG } from '@/src/lib/organCatalog';

const ORGAN_OPTIONS = [...ORGAN_CATALOG];

interface ManualOrganDonorRow {
  id: string;
  name: string;
  blood_group: string | null;
  organ_type: string;
  location_city: string;
  location_country: string;
  source: string;
}

export default function ManualOrganDonorPage() {
  const [selectedLocation, setSelectedLocation] = React.useState<LocationSuggestion | null>(null);
  const [phoneValue, setPhoneValue] = React.useState<PhoneFieldValue>(emptyPhoneValue());
  const [isPhoneValid, setIsPhoneValid] = React.useState(false);
  const [selectedOrgans, setSelectedOrgans] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [recentEntries, setRecentEntries] = React.useState<ManualOrganDonorRow[]>([]);
  const [submitMessage, setSubmitMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    bloodGroup: '',
    medicalNote: '',
    consentReceived: true,
    visibilityPreference: 'PUBLIC_LISTED',
  });

  const toggleOrgan = (organ: string) => {
    setSelectedOrgans((prev) => (prev.includes(organ) ? prev.filter((item) => item !== organ) : [...prev, organ]));
  };

  const loadRecentEntries = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/manual-organ-donors', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        return;
      }
      setRecentEntries(payload.data || []);
    } catch {
      // silent
    }
  }, []);

  React.useEffect(() => {
    void loadRecentEntries();
  }, [loadRecentEntries]);

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
    if (!formData.name.trim()) {
      setSubmitMessage({ type: 'error', text: 'Name is required.' });
      return;
    }
    if (selectedOrgans.length === 0) {
      setSubmitMessage({ type: 'error', text: 'Select at least one organ.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/manual-organ-donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          bloodGroup: formData.bloodGroup,
          organs: selectedOrgans,
          visibilityPreference: formData.visibilityPreference,
          consentReceived: formData.consentReceived,
          medicalNote: formData.medicalNote,
          location: selectedLocation,
          phone: {
            country_name: phoneValue.countryName,
            country_code: phoneValue.countryCode,
            dial_code: phoneValue.dialCode,
            local_phone_number: phoneValue.localPhoneNumber,
            full_phone_number: phoneValue.fullPhoneNumber,
          },
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to add manual organ donor.');
      }

      setSubmitMessage({ type: 'success', text: 'Manual organ donor saved successfully.' });
      setFormData({
        name: '',
        email: '',
        bloodGroup: '',
        medicalNote: '',
        consentReceived: true,
        visibilityPreference: 'PUBLIC_LISTED',
      });
      setSelectedOrgans([]);
      setSelectedLocation(null);
      setPhoneValue(emptyPhoneValue());
      setIsPhoneValid(false);
      await loadRecentEntries();
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error?.message || 'Failed to add manual organ donor.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this manual organ donor record?')) {
      return;
    }
    try {
      setIsDeleting(id);
      const res = await fetch(`/api/admin/manual-organ-donors?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete organ donor.');
      }
      setRecentEntries((prev) => prev.filter((row) => row.id !== id));
      setSubmitMessage({ type: 'success', text: 'Manual organ donor deleted successfully.' });
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error?.message || 'Failed to delete organ donor.' });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><HeartPulse className="text-purple-500"/> Manual Organ Donor Entry</h2>
        <p className="text-sm text-gray-500 mt-1">Register verified individuals to the backend Organ Donor Registry system manually.</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card title="Donor Primary Identity">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500" />
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
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Blood Group</label>
              <select value={formData.bloodGroup} onChange={(e) => setFormData((prev) => ({ ...prev, bloodGroup: e.target.value }))} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Unknown / Not shared</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <CityLocationAutocomplete
                label="Location"
                placeholder="Search your city"
                required
                selectedLocation={selectedLocation}
                onSelect={setSelectedLocation}
                onClear={() => setSelectedLocation(null)}
              />
            </div>
          </div>
        </Card>

        {/* Organ Selection UI */}
        <Card title="Willing Organ Pledge Selection">
           <p className="text-sm text-gray-500 mb-4 tracking-wide">Select the multiple organs the donor has officially pledged.</p>
           <div className="flex flex-wrap gap-3">
             {ORGAN_OPTIONS.map((organ) => (
               <label key={organ} className="relative cursor-pointer">
                 <input type="checkbox" checked={selectedOrgans.includes(organ)} onChange={() => toggleOrgan(organ)} className="peer sr-only" />
                 <div className="px-5 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1b23] text-gray-700 dark:text-gray-300 font-medium peer-checked:border-purple-500 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-500/10 peer-checked:text-purple-700 dark:peer-checked:text-purple-400 transition-all shadow-sm">
                   {organ}
                 </div>
               </label>
             ))}
           </div>
        </Card>

        <Card title="Verification & Consent Setup">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Medical Health Note</label>
                <textarea rows={2} value={formData.medicalNote} onChange={(e) => setFormData((prev) => ({ ...prev, medicalNote: e.target.value }))} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none" placeholder="Underlying conditions affecting donation scope..."></textarea>
              </div>
              <div className="flex gap-4 flex-col">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#0f1115]">
                  <input type="checkbox" checked={formData.consentReceived} onChange={(e) => setFormData((prev) => ({ ...prev, consentReceived: e.target.checked }))} className="w-5 h-5 text-purple-600 rounded border-gray-300" />
                  I confirm that physical or legal consent was received and verified.
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Visibility Preference</label>
                <select value={formData.visibilityPreference} onChange={(e) => setFormData((prev) => ({ ...prev, visibilityPreference: e.target.value }))} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none">
                  <option value="PUBLIC_LISTED">Publicly Listed (Verified Request Scope)</option>
                  <option value="PRIVATE_REGISTRY">Private Registry (Backend Match Only)</option>
                </select>
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Medical Credential / Form Upload</label>
               <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-xl flex flex-col items-center justify-center h-[200px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                 <UploadCloud className="text-gray-400 mb-2" size={32} />
                 <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Consent PDF</p>
               </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
             <button type="submit" disabled={isSubmitting || !selectedLocation || !isPhoneValid || !formData.name} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
               <CheckCircle2 size={18} /> {isSubmitting ? 'Saving...' : 'Add to Organ Registry'}
             </button>
          </div>
          {submitMessage && (
            <div className={`mt-4 rounded-lg border px-4 py-3 text-sm font-semibold ${submitMessage.type === 'success' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'border-red-400/30 bg-red-500/10 text-red-600 dark:text-red-300'}`}>
              {submitMessage.text}
            </div>
          )}
        </Card>
      </form>

      <div className="pt-8">
        <h3 className="text-xl font-bold mb-4 border-t border-gray-200 dark:border-gray-800 pt-8">Recent Manual Organ Entries</h3>
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-[#1a1b23]">
          <Table headers={['ID', 'Name', 'Pledged Organs', 'Location', 'Consent', 'Actions']}>
            {recentEntries.length === 0 ? (
              <TableRow>
                <TableCell className="font-medium text-gray-500">-</TableCell>
                <TableCell className="text-gray-500">No entries yet</TableCell>
                <TableCell className="text-gray-500">-</TableCell>
                <TableCell className="text-gray-500">-</TableCell>
                <TableCell className="text-gray-500">-</TableCell>
                <TableCell className="text-gray-500">-</TableCell>
              </TableRow>
            ) : (
              recentEntries.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-semibold text-purple-600 dark:text-purple-400">{row.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {row.organ_type.split(',').map((organ) => (
                        <span key={`${row.id}-${organ}`} className="text-xs border border-gray-300 dark:border-gray-600 px-2 py-0.5 rounded-full">{organ.trim()}</span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{row.location_city}, {row.location_country}</TableCell>
                  <TableCell><Badge type="success">Verified On File</Badge></TableCell>
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
    </div>
  );
}
