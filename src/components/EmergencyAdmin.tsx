'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { renderTemplate, smsSegments, validTemplateBody } from '@/src/lib/emergencySms';
import { EmergencyWorkspace, emergencyFetch, statusLabel } from './EmergencySmsPanel';

type Branch = { id: string; name: string; area: string; contact: string; latitude: number; longitude: number;
  active: boolean; opens_minute: number; closes_minute: number; sponsor_remaining: number };
type Template = { id: string; language: string; status: string; body: string };
type Admin = { enabled: boolean; branches: Branch[]; templates: Template[];
  requests: { id: string; branch_id: string; status: string; charged_paisa: number; refund_paisa: number; _count: { deliveries: number } }[];
  events: { id: string; event: string; created_at: string }[];
  access: { id: string; role: string; email: string; revoked_at: string | null; accepted_at: string | null }[] };
const endpoint = '/api/admin/emergency-sms';

export default function EmergencyAdmin() {
  const [data, setData] = useState<Admin>();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState('');
  const [edit, setEdit] = useState<Branch>();
  const [language, setLanguage] = useState('bn');
  const [draft, setDraft] = useState('');
  const previewTemplate = (lang: string, body?: string) => renderTemplate(lang, 'পরীক্ষামূলক হাসপাতাল', 'ঢাকা', 'O+', new Date(), 'https://bloodnet.live/…', body);
  const load = async () => setData(await emergencyFetch<Admin>(endpoint));
  useEffect(() => { void load().catch(error => setMessage(error.message)); }, []);

  async function action(body: object) {
    setBusy(true); setMessage(''); setInvite('');
    try {
      const res = await emergencyFetch<{ token?: string; csv?: string }>(endpoint, { ...body, password });
      if (res.token) setInvite(res.token);
      if (res.csv) {
        const href = URL.createObjectURL(new Blob([res.csv], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = href;
        link.download = 'bloodnet-emergency-simulation-finance.csv';
        link.click();
        setTimeout(() => URL.revokeObjectURL(href), 1000);
      }
      await load();
      setMessage('পরিবর্তন সংরক্ষিত হয়েছে।');
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); setPassword(''); }
  }

  function saveBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void action({ action: 'branch', id: edit?.id, name: form.get('name'), area: form.get('area'),
      contact: form.get('contact'), latitude: Number(form.get('latitude')), longitude: Number(form.get('longitude')),
      opens: Number(form.get('opens')), closes: Number(form.get('closes')), active: form.has('active'),
      addCredits: Number(form.get('credits')) });
  }

  function issue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = String(form.get('expires') || '');
    void action({ action: 'invite', branch: form.get('branch'), email: form.get('email'), role: form.get('role'),
      expiresAt: date ? new Date(date + ':00+06:00').toISOString() : undefined });
  }

  return <EmergencyWorkspace>
    <h1>জরুরি দাতা এসএমএস</h1>
    <p role="status">{data?.enabled ? 'পরীক্ষামূলক মোড · বাস্তব পেমেন্ট বা এসএমএস হবে না।' : 'সেবা বন্ধ · পরীক্ষামূলক সেটআপের জন্য পরিচালনা নির্দেশিকা দেখুন।'}</p>
    <p><a href="../documentation">Platform Guide</a> · <a href="/emergency-sms/workspace">হাসপাতাল কর্মক্ষেত্র</a></p>
    <label>পরিবর্তন অনুমোদনের জন্য বর্তমান অ্যাডমিন পাসওয়ার্ড
      <input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} />
    </label>
    <details open><summary>হাসপাতাল ও শাখা</summary>
      {data?.branches.map(branch => <article key={branch.id}>
        <p>{branch.name} · {branch.area} · {branch.active ? 'সক্রিয়' : 'বন্ধ'} · পাইলট প্রাপক ক্রেডিট {branch.sponsor_remaining}</p>
        <button disabled={!data.enabled} onClick={() => setEdit(branch)}>সম্পাদনা</button>{' '}
        {branch.active && <button disabled={!password || busy} onClick={() => void action({ action: 'pause', branch: branch.id })}>শাখার পাঠানো ও নতুন অনুরোধ বন্ধ করুন</button>}
      </article>)}
      {data?.enabled && <>
        {edit && <button onClick={() => setEdit(undefined)}>নতুন শাখা</button>}
        <form key={edit?.id || 'new'} onSubmit={saveBranch}>
          <h2>{edit ? 'শাখা সম্পাদনা' : 'শাখা যোগ'}</h2>
          <label>হাসপাতালের শাখা<input name="name" required maxLength={100} defaultValue={edit?.name} /></label>
          <label>এলাকা<input name="area" required maxLength={100} defaultValue={edit?.area} /></label>
          <label>প্রকাশিত যোগাযোগ (+880)<input name="contact" required type="tel" defaultValue={edit?.contact} /></label>
          <label>অক্ষাংশ<input name="latitude" type="number" step="any" required defaultValue={edit?.latitude} /></label>
          <label>দ্রাঘিমাংশ<input name="longitude" type="number" step="any" required defaultValue={edit?.longitude} /></label>
          <label>খোলার সময় (বাংলাদেশ সময়, মধ্যরাত থেকে মিনিট)<input name="opens" type="number" min="0" max="1439" required defaultValue={edit?.opens_minute ?? 0} /></label>
          <label>বন্ধের সময় (বাংলাদেশ সময়, মধ্যরাত থেকে মিনিট)<input name="closes" type="number" min="1" max="1440" required defaultValue={edit?.closes_minute ?? 1440} /></label>
          <label>যোগ করা পরীক্ষামূলক ক্রেডিট<input name="credits" type="number" min="0" max="5000" required defaultValue="0" /></label>
          <label><input name="active" type="checkbox" defaultChecked={edit?.active} /> পরীক্ষামূলক অনুরোধ গ্রহণ করুন</label>
          <button disabled={!password || busy}>শাখা সংরক্ষণ করুন</button>
        </form>
      </>}
    </details>
    <details><summary>টিম অ্যাক্সেস</summary>
      {data?.enabled && data.branches.length > 0 && <form onSubmit={issue}>
        <label>শাখা<select name="branch">{data.branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
        <label>BloodNet অ্যাকাউন্টের ইমেইল<input name="email" type="email" required maxLength={254} /></label>
        <label>ভূমিকা<select name="role"><option value="BRANCH_ADMIN">শাখা প্রশাসক</option><option value="VERIFIER">যাচাইকারী</option><option value="DISPATCH">ডিসপ্যাচ</option><option value="FINANCE">অর্থ</option><option value="CAMPAIGN">ক্যাম্পেইন</option></select></label>
        <label>ঐচ্ছিক অনুমতির মেয়াদ (বাংলাদেশ সময়)<input name="expires" type="datetime-local" /></label>
        <button disabled={!password || busy}>আমন্ত্রণ তৈরি করুন</button>
      </form>}
      {invite && <p>আমন্ত্রিত ব্যক্তিকে ব্যক্তিগতভাবে পাঠান। কোড ২৪ ঘণ্টা বৈধ <code>{invite}</code></p>}
      {data?.access.map(item => <article key={item.id}>
        {item.email} · {item.role} · {item.revoked_at ? 'প্রত্যাহৃত' : item.accepted_at ? 'গৃহীত' : 'আমন্ত্রণ দেওয়া হয়েছে'}
        {!item.revoked_at && <button disabled={!password || busy} onClick={() => void action({ action: 'revoke', access: item.id })}>প্রত্যাহার</button>}
      </article>)}
    </details>
    <details><summary>টেমপ্লেট ও নমুনা</summary>
      <p>অনুমোদিত ঘর: <code>{'{hospital} {area} {group} {time} {link}'}</code>। প্রতিটি ঠিক একবার ব্যবহার করুন।</p>
      {data?.enabled && <form onSubmit={event => { event.preventDefault(); void action({ action: 'draftTemplate', body: draft, language }); }}>
        <label>ভাষা<select value={language} onChange={event => setLanguage(event.target.value)}><option value="bn">বাংলা</option><option value="en">English</option></select></label>
        <label>খসড়া<textarea value={draft} onChange={event => setDraft(event.target.value)} maxLength={380} rows={4} /></label>
        <button disabled={!password || busy || !validTemplateBody(draft)}>খসড়া সংরক্ষণ করুন</button>
      </form>}
      {data?.templates.map(template => {
        const preview = previewTemplate(template.language, template.body);
        return <article key={template.id}><p>{template.language} · {template.status} · আনুমানিক {smsSegments(preview)} অংশ</p>
          <p>{preview}</p>
          {data.enabled && template.status !== 'PUBLISHED' && <button disabled={!password || busy} onClick={() => void action({ action: 'publishTemplate', template: template.id })}>
            {template.status === 'ARCHIVED' ? 'পুরোনো সংস্করণ আবার প্রকাশ করুন' : 'নমুনা অনুমোদন ও প্রকাশ করুন'}
          </button>}
        </article>;
      })}
    </details>
    <details><summary>অনুরোধ, পরীক্ষামূলক অর্থ ও ফেরত</summary>
      <button disabled={!password || busy} onClick={() => void action({ action: "exportFinance" })}>পরীক্ষামূলক লেনদেন CSV</button>
      {data?.requests.map(row => <p key={row.id}>{row.id} · {statusLabel(row.status)} · প্রেরণ {row._count.deliveries} · ৳{row.charged_paisa / 100} · ফেরত ৳{row.refund_paisa / 100}</p>)}
    </details>
    <details><summary>পরিবর্তনের ইতিহাস</summary>
      {data?.events.map(row => <p key={row.id}>{row.created_at} · {row.event}</p>)}
    </details>
    <button type="button" disabled={busy} onClick={() => void load().catch(error => setMessage(error.message))}>হালনাগাদ করুন</button>
    <p role="status">{message}</p>
  </EmergencyWorkspace>;
}
