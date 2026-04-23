'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Scale, Save, AlertTriangle, CheckCircle2, FileText, Shield, Globe, Mail, Phone, MapPin, Type } from 'lucide-react';

type PolicyKey = 'terms' | 'privacySummary' | 'privacyFull';

type SiteContentForm = {
  termsOfService: string;
  privacySummary: string;
  privacyPolicyFull: string;
  footerContactEmail: string;
  footerContactPhone: string;
  footerContactAddress: string;
  footerAboutText: string;
  footerCopyright: string;
  joinCommunityTelegramUrl: string;
  joinCommunityTitle: string;
  joinCommunityDescription: string;
  joinCommunityMembersTitle: string;
  joinCommunityMembersDesc: string;
  joinCommunityAlertsTitle: string;
  joinCommunityAlertsDesc: string;
  joinCommunityVerifiedTitle: string;
  joinCommunityVerifiedDesc: string;
  joinCommunityTrustText: string;
  joinCommunityActiveRequestsText: string;
  impactLivesSaved: number;
  impactCountries: number;
  impactActiveDonors: number;
  impactSuccessRate: number;
  updatedAt?: string;
};

const policyOptions: Array<{ key: PolicyKey; label: string; icon: React.ReactNode }> = [
  { key: 'terms', label: 'Terms of Service (Full)', icon: <FileText size={15} /> },
  { key: 'privacySummary', label: 'Privacy Summary', icon: <Shield size={15} /> },
  { key: 'privacyFull', label: 'Privacy Policy (Full)', icon: <Globe size={15} /> },
];

const emptyState: SiteContentForm = {
  termsOfService: '',
  privacySummary: '',
  privacyPolicyFull: '',
  footerContactEmail: '',
  footerContactPhone: '',
  footerContactAddress: '',
  footerAboutText: '',
  footerCopyright: '',
  joinCommunityTelegramUrl: '',
  joinCommunityTitle: '',
  joinCommunityDescription: '',
  joinCommunityMembersTitle: '',
  joinCommunityMembersDesc: '',
  joinCommunityAlertsTitle: '',
  joinCommunityAlertsDesc: '',
  joinCommunityVerifiedTitle: '',
  joinCommunityVerifiedDesc: '',
  joinCommunityTrustText: '',
  joinCommunityActiveRequestsText: '',
  impactLivesSaved: 12,
  impactCountries: 45,
  impactActiveDonors: 25,
  impactSuccessRate: 99,
  updatedAt: undefined,
};

export default function PolicyUpdatePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<SiteContentForm>(emptyState);
  const [activePolicy, setActivePolicy] = useState<PolicyKey>('terms');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch('/api/admin/policy-content', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await res.json();
        if (!res.ok || !payload.success) {
          setErrorMessage(payload.message || 'Failed to load policy data.');
          return;
        }
        setForm(payload.data);
      } catch {
        setErrorMessage('Failed to load policy data.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, []);

  const activePolicyValue = useMemo(() => {
    if (activePolicy === 'terms') return form.termsOfService;
    if (activePolicy === 'privacySummary') return form.privacySummary;
    return form.privacyPolicyFull;
  }, [activePolicy, form]);

  const setActivePolicyValue = (value: string) => {
    setForm((prev) => {
      if (activePolicy === 'terms') return { ...prev, termsOfService: value };
      if (activePolicy === 'privacySummary') return { ...prev, privacySummary: value };
      return { ...prev, privacyPolicyFull: value };
    });
  };

  const previewValue = (value: string) => value || 'No content yet.';

  const saveAll = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);
    try {
      const payload = {
        termsOfService: form.termsOfService,
        privacySummary: form.privacySummary,
        privacyPolicyFull: form.privacyPolicyFull,
        footerContactEmail: form.footerContactEmail,
        footerContactPhone: form.footerContactPhone,
        footerContactAddress: form.footerContactAddress,
        footerAboutText: form.footerAboutText,
        footerCopyright: form.footerCopyright,
        joinCommunityTelegramUrl: form.joinCommunityTelegramUrl,
        joinCommunityTitle: form.joinCommunityTitle,
        joinCommunityDescription: form.joinCommunityDescription,
        joinCommunityMembersTitle: form.joinCommunityMembersTitle,
        joinCommunityMembersDesc: form.joinCommunityMembersDesc,
        joinCommunityAlertsTitle: form.joinCommunityAlertsTitle,
        joinCommunityAlertsDesc: form.joinCommunityAlertsDesc,
        joinCommunityVerifiedTitle: form.joinCommunityVerifiedTitle,
        joinCommunityVerifiedDesc: form.joinCommunityVerifiedDesc,
        joinCommunityTrustText: form.joinCommunityTrustText,
        joinCommunityActiveRequestsText: form.joinCommunityActiveRequestsText,
        impactLivesSaved: form.impactLivesSaved,
        impactCountries: form.impactCountries,
        impactActiveDonors: form.impactActiveDonors,
        impactSuccessRate: form.impactSuccessRate,
      };
      const res = await fetch('/api/admin/policy-content', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        // Keep this during dev so we can diagnose payload/API issues quickly.
        console.error('[PolicyPage] save failed', { status: res.status, result });
        setErrorMessage(result.message || 'Failed to save policy content.');
        return;
      }
      setForm(result.data);
      setSaveMessage('Saved and published successfully.');
    } catch {
      setErrorMessage('Failed to save policy content.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="text-blue-500" />
            Legal & Policy Editor
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Edit website legal content and footer contact information using live database values.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-4 rounded-xl flex gap-3 text-sm text-amber-800 dark:text-amber-300 leading-relaxed shadow-sm">
        <AlertTriangle className="shrink-0 mt-0.5 text-amber-500" size={18} />
        <p>
          <strong>Compliance Notice:</strong> Any update here immediately becomes the source for Terms, Privacy Summary,
          Full Privacy page, and Footer Contact Info.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Policy Section</p>
              <div className="flex flex-wrap gap-2">
                {policyOptions.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActivePolicy(item.key)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border transition flex items-center gap-2 ${
                      activePolicy === item.key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-[#0f1115] border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    {policyOptions.find((o) => o.key === activePolicy)?.label} Editor
                  </label>
                  <textarea
                    value={activePolicyValue}
                    onChange={(e) => setActivePolicyValue(e.target.value)}
                    placeholder="Write content here..."
                    className="w-full min-h-[430px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Live Preview (Edited Version)
                  </label>
                  <div className="min-h-[430px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] p-4 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-sans">
                      {previewValue(activePolicyValue)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-[#0f1115] p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">All Policy Text Preview</p>
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  <div>
                    <p className="font-semibold text-sm mb-1">Terms of Service</p>
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-sans">
                      {previewValue(form.termsOfService)}
                    </pre>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="font-semibold text-sm mb-1">Privacy Summary</p>
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-sans">
                      {previewValue(form.privacySummary)}
                    </pre>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="font-semibold text-sm mb-1">Privacy Policy (Full)</p>
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-sans">
                      {previewValue(form.privacyPolicyFull)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Footer Contact Information</p>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center gap-1">
                  <Mail size={12} /> Contact Email
                </label>
                <input
                  value={form.footerContactEmail}
                  onChange={(e) => setForm((prev) => ({ ...prev, footerContactEmail: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center gap-1">
                  <Phone size={12} /> Contact Phone (Optional)
                </label>
                <input
                  value={form.footerContactPhone}
                  onChange={(e) => setForm((prev) => ({ ...prev, footerContactPhone: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center gap-1">
                  <MapPin size={12} /> Address
                </label>
                <input
                  value={form.footerContactAddress}
                  onChange={(e) => setForm((prev) => ({ ...prev, footerContactAddress: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Footer About Text</label>
                <textarea
                  value={form.footerAboutText}
                  onChange={(e) => setForm((prev) => ({ ...prev, footerAboutText: e.target.value }))}
                  className="w-full min-h-[110px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block flex items-center gap-1">
                  <Type size={12} /> Footer Copyright
                </label>
                <input
                  value={form.footerCopyright}
                  onChange={(e) => setForm((prev) => ({ ...prev, footerCopyright: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Homepage Impact + Join Community</p>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Lives Saved (k+ number)</label>
                <input
                  type="number"
                  min={0}
                  value={form.impactLivesSaved}
                  onChange={(e) => setForm((prev) => ({ ...prev, impactLivesSaved: Number(e.target.value || 0) }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Countries</label>
                <input
                  type="number"
                  min={0}
                  value={form.impactCountries}
                  onChange={(e) => setForm((prev) => ({ ...prev, impactCountries: Number(e.target.value || 0) }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Active Donors (k+ number)</label>
                <input
                  type="number"
                  min={0}
                  value={form.impactActiveDonors}
                  onChange={(e) => setForm((prev) => ({ ...prev, impactActiveDonors: Number(e.target.value || 0) }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Success Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.impactSuccessRate}
                  onChange={(e) => setForm((prev) => ({ ...prev, impactSuccessRate: Number(e.target.value || 0) }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Join Community Button URL (opens in new tab)</label>
                <input
                  value={form.joinCommunityTelegramUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, joinCommunityTelegramUrl: e.target.value }))}
                  placeholder="https://t.me/your_channel"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Join Community Title</label>
                <input
                  value={form.joinCommunityTitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, joinCommunityTitle: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Join Community Description</label>
                <textarea
                  value={form.joinCommunityDescription}
                  onChange={(e) => setForm((prev) => ({ ...prev, joinCommunityDescription: e.target.value }))}
                  className="w-full min-h-[90px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Card 1 Title</label>
                <input
                  value={form.joinCommunityMembersTitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, joinCommunityMembersTitle: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Card 1 Subtitle</label>
                <input
                  value={form.joinCommunityMembersDesc}
                  onChange={(e) => setForm((prev) => ({ ...prev, joinCommunityMembersDesc: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Card 2 Title</label>
                <input
                  value={form.joinCommunityAlertsTitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, joinCommunityAlertsTitle: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Card 2 Subtitle</label>
                <input
                  value={form.joinCommunityAlertsDesc}
                  onChange={(e) => setForm((prev) => ({ ...prev, joinCommunityAlertsDesc: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Card 3 Title</label>
                <input
                  value={form.joinCommunityVerifiedTitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, joinCommunityVerifiedTitle: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Card 3 Subtitle</label>
                <input
                  value={form.joinCommunityVerifiedDesc}
                  onChange={(e) => setForm((prev) => ({ ...prev, joinCommunityVerifiedDesc: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Trust Line Text</label>
                <input
                  value={form.joinCommunityTrustText}
                  onChange={(e) => setForm((prev) => ({ ...prev, joinCommunityTrustText: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Active Requests Pill Text</label>
                <input
                  value={form.joinCommunityActiveRequestsText}
                  onChange={(e) => setForm((prev) => ({ ...prev, joinCommunityActiveRequestsText: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1115] px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <Card title="Live Metadata">
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Status</p>
                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  {isLoading ? 'Loading...' : 'Connected'}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Last Updated</p>
                <p className="font-semibold">{form.updatedAt ? new Date(form.updatedAt).toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Current Editor Block</p>
                <p className="font-semibold">Terms + Privacy + Footer Contact</p>
              </div>
            </div>
          </Card>

          <Card title="Client Preview Snapshot">
            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5">
                <p className="font-bold mb-1">Impact Section</p>
                <p className="text-gray-500">
                  Lives Saved: {form.impactLivesSaved}k+ • Countries: {form.impactCountries} • Active Donors: {form.impactActiveDonors}k+ • Success: {form.impactSuccessRate}%
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5">
                <p className="font-bold mb-1">Join Community Button URL</p>
                <p className="text-gray-500 break-all">{form.joinCommunityTelegramUrl || 'No URL set'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5">
                <p className="font-bold mb-1">Terms</p>
                <p className="text-gray-500 line-clamp-3">{form.termsOfService}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5">
                <p className="font-bold mb-1">Privacy Summary</p>
                <p className="text-gray-500 line-clamp-3">{form.privacySummary}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5">
                <p className="font-bold mb-1">Footer Contact</p>
                <p className="text-gray-500">{form.footerContactEmail}</p>
                <p className="text-gray-500">{form.footerContactAddress}</p>
                {form.footerContactPhone.trim() && <p className="text-gray-500">{form.footerContactPhone}</p>}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      )}
      {saveMessage && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={14} />
          {saveMessage}
        </div>
      )}

      <div className="flex justify-end">
        <button
          disabled={isSaving || isLoading}
          onClick={() => void saveAll()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-lg shadow-md flex items-center gap-2"
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save & Publish'}
        </button>
      </div>
    </div>
  );
}
