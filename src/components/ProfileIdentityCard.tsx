"use client";

import { useEffect, useState } from 'react';
import { Check, Copy, Fingerprint, Pencil, X } from 'lucide-react';
import { normalizeProfileCode, PROFILE_CODE_PATTERN } from '@/src/lib/profileIdentifier';

type Identity = { profileCode: string; nextChangeAt: string | null; available?: boolean };
export default function ProfileIdentityCard({ userId, initialCode, onSessionExpired, readOnly=false, nextChangeAt=null }: {
  userId: string; initialCode?: string; onSessionExpired?: () => void; readOnly?: boolean; nextChangeAt?: string | null;
}) {
  const [identity, setIdentity] = useState<Identity>({ profileCode: initialCode || '', nextChangeAt: null });
  const [editing, setEditing] = useState(false);
  const [candidate, setCandidate] = useState('');
  const [message, setMessage] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setIdentity({ profileCode: initialCode || '', nextChangeAt });
    setEditing(false);
    if (readOnly) return () => controller.abort();
    fetch('/api/users/me/profile-id', { credentials: 'include', cache: 'no-store', signal: controller.signal })
      .then(async res => {
        if (res.status === 401) onSessionExpired?.();
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Unable to load your profile ID.');
        setIdentity(data.data);
      }).catch(error => { if (error.name !== 'AbortError') setMessage(error.message); });
    return () => controller.abort();
  }, [userId, initialCode, onSessionExpired, readOnly, nextChangeAt]);

  useEffect(() => {
    setAvailable(null);
    if (!editing || !PROFILE_CODE_PATTERN.test(candidate)) { setChecking(false); return; }
    const controller = new AbortController();
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/me/profile-id?code=${encodeURIComponent(candidate)}`, { credentials: 'include', cache: 'no-store', signal: controller.signal });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Unable to check this ID.');
        setAvailable(data.data.available);
      } catch (error) { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Unable to check this ID.'); }
      finally { if (!controller.signal.aborted) setChecking(false); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [candidate, editing]);

  const locked = Boolean(identity.nextChangeAt && new Date(identity.nextChangeAt) > new Date());
  const save = async () => {
    setSaving(true); setMessage('');
    try {
      const res = await fetch('/api/users/me/profile-id', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: candidate }) });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.message || 'Unable to save this ID.');
      setIdentity(payload.data); setEditing(false); setMessage('Profile ID updated. Share the new ID with your doctor.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save this ID.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 text-left sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><Fingerprint className="h-5 w-5" /></span>
          <div><p className="text-xs font-semibold text-slate-600">Your patient ID</p><p className="font-mono text-2xl font-semibold tracking-[0.2em] text-slate-900">{identity.profileCode || '••••'}</p></div>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={!identity.profileCode} aria-label="Copy patient ID" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50" onClick={async () => {
            try { await navigator.clipboard.writeText(identity.profileCode); setMessage('Patient ID copied.'); } catch { setMessage(`Your ID is ${identity.profileCode}.`); }
          }}><Copy className="h-4 w-4" /></button>
          <button type="button" aria-label="Edit patient ID" title="Edit patient ID" disabled={readOnly || locked || !identity.profileCode} onClick={() => { setCandidate(identity.profileCode); setMessage(''); setEditing(!editing); }} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Pencil className="h-4 w-4" /></button>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600">Share this ID with your doctor to receive prescriptions in your profile and email. {locked ? `Next change: ${new Date(identity.nextChangeAt!).toLocaleDateString()}.` : 'Choose four letters or numbers; changes then unlock every six months.'}</p>
      {editing && (
        <form onSubmit={e => { e.preventDefault(); void save(); }} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <label htmlFor="patient-id-choice" className="block text-sm font-semibold text-slate-700">New patient ID</label>
          <div className="flex flex-wrap gap-2">
            <input id="patient-id-choice" value={candidate} onChange={e => { setCandidate(normalizeProfileCode(e.target.value).replace(/[^A-Z0-9]/g, '').slice(0,4)); setMessage(''); }} maxLength={4} autoComplete="off" spellCheck={false} className="min-h-12 min-w-[7rem] basis-full grow rounded-xl border border-slate-200 bg-slate-50 px-4 font-mono text-lg tracking-wide text-slate-900 outline-none focus:border-rose-700 sm:basis-28" />
            <button type="submit" disabled={saving || checking || !available || candidate === identity.profileCode} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-600"><Check className="h-4 w-4" />{saving ? 'Saving…' : 'Save ID'}</button>
            <button type="button" aria-label="Cancel ID change" onClick={() => setEditing(false)} className="flex min-h-12 items-center rounded-full px-3 text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <p aria-live="polite" className={`text-xs ${available === false ? 'text-rose-700' : 'text-slate-600'}`}>{checking ? 'Checking availability…' : available === false ? 'Already taken or reserved. Try another ID.' : available ? 'Available. Saving locks changes for six months.' : 'Use exactly four letters or numbers.'}</p>
        </form>
      )}
      {message && <p role="status" className="mt-3 text-xs leading-5 text-slate-700">{message}</p>}
    </div>
  );
}
