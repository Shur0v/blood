'use client';

import React from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import CityLocationAutocomplete, { type LocationSuggestion } from '@/src/components/CityLocationAutocomplete';
import CountryPhoneInput, { emptyPhoneValue, type PhoneFieldValue } from '@/src/components/CountryPhoneInput';

interface ManualBloodDonorRow {
  id: string;
  name: string;
  blood_group: string;
  location_city: string;
  location_country: string;
  source: string;
  is_active_donor: boolean;
}

export default function ManualBloodDonorPage() {
  const [selectedLocation, setSelectedLocation] = React.useState<LocationSuggestion | null>(null);
  const [phoneValue, setPhoneValue] = React.useState<PhoneFieldValue>(emptyPhoneValue());
  const [isPhoneValid, setIsPhoneValid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recentEntries, setRecentEntries] = React.useState<ManualBloodDonorRow[]>([]);
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

  React.useEffect(() => {
    void loadRecentEntries();
  }, [loadRecentEntries]);

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
               <input type="date" value={formData.lastDonationDate} onChange={(e) => setFormData((prev) => ({ ...prev, lastDonationDate: e.target.value }))} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none" />
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
    </div>
  );
}
