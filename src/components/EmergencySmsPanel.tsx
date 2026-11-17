'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ChevronDown, MessageSquare } from 'lucide-react';
import { GROUPS } from '@/src/lib/emergencySms';
import styles from './emergencySms.module.css';

type Branch = { id: string; name: string; area: string; contact: string };
type Catalog = { enabled: boolean; visible: boolean; notice: string; branches: Branch[] };
type History = { id: string; status: string; Branch: { name: string } };
type InboxItem = { id: string; response: string | null; Request: { status: string; needed_at: string; blood_group: string; Branch: Branch } };
type Account = { enabled: boolean; history: History[]; inbox: InboxItem[]; consent: { available: boolean; language: string } | null };
type Detail = {
  id: string; hospital: string; status: string; charged: number; refunded: number; coverage: number;
  pilotCount: number; paidCount: number; previewBn: string; previewEn: string; previewSegmentsBn: number; previewSegmentsEn: number;
  deliveries: { status: string; response: string | null; _count: number }[];
};

const statuses: Record<string, string> = {
  PENDING: 'হাসপাতালের নিশ্চিতকরণ বাকি', VERIFIED: 'হাসপাতাল যাচাই করেছে',
  REJECTED: 'হাসপাতাল অনুমোদন দেয়নি', QUEUED: 'পরীক্ষামূলক প্রেরণের অপেক্ষায়',
  DISPATCH_COMPLETE: 'পরীক্ষামূলক প্রেরণ শেষ', STOPPED: 'অনুরোধ বন্ধ',
  HOSPITAL_CONFIRMED: 'হাসপাতাল ফল নিশ্চিত করেছে',
};

export async function emergencyFetch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    cache: 'no-store',
    ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.data?.error || payload.message || 'এই মুহূর্তে কাজটি সম্পন্ন করা যাচ্ছে না।');
  return payload.data as T;
}

export const emergencyApi = '/api/emergency-sms';
export function statusLabel(status: string) { return statuses[status] || status; }

function CreateRequest({ branches, disabled, submit }: {
  branches: Branch[]; disabled: boolean; submit: (form: FormData) => void;
}) {
  const [branchId, setBranchId] = useState('');
  const branch = branches.find(item => item.id === branchId);
  return <form onSubmit={event => { event.preventDefault(); submit(new FormData(event.currentTarget)); }}>
    <label>যাচাইকৃত হাসপাতাল শাখা<select required name="branch" value={branchId} onChange={event => setBranchId(event.target.value)}>
      <option value="">শাখা নির্বাচন করুন</option>
      {branches.map(item => <option key={item.id} value={item.id}>{item.name} · {item.area}</option>)}
    </select></label>
    {branch && <p>হাসপাতালের প্রকাশিত যোগাযোগ <a href={'tel:' + branch.contact}>{branch.contact}</a></p>}
    <label>হাসপাতালের রেফারেন্স <input name="reference" required minLength={3} maxLength={40} autoComplete="off" /></label>
    <div className={styles.fields}>
      <label>রক্তের গ্রুপ<select required name="group">{GROUPS.map(group => <option key={group}>{group}</option>)}</select></label>
      <label>হাসপাতাল-নির্ধারিত উপাদান<select name="component">
        <option value="WHOLE_BLOOD">পূর্ণ রক্ত</option><option value="RED_CELLS">লোহিত রক্তকণিকা</option>
        <option value="PLATELETS">প্লেটলেট</option><option value="PLASMA">প্লাজমা</option>
      </select></label>
    </div>
    <label>প্রয়োজনের সময় (বাংলাদেশ সময়)<input name="needed" type="datetime-local" required /></label>
    <p>রোগীর নাম, রিপোর্ট বা পরিবারের নম্বর দেবেন না।</p>
    <button disabled={disabled}>হাসপাতালের যাচাইয়ের জন্য জমা দিন</button>
  </form>;
}

function ReviewRequest({ detail, disabled, start }: {
  detail: Detail; disabled: boolean; start: (funding: 'PILOT' | 'PAID', count: number) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const simulated = detail.deliveries.reduce((sum, item) => sum + item._count, 0);
  const interested = detail.deliveries.filter(item => item.response === 'INTERESTED').reduce((sum, item) => sum + item._count, 0);
  return <div className={styles.review}>
    <h4>{detail.hospital}</h4><p role="status">{statusLabel(detail.status)}</p>
    {detail.status === 'VERIFIED' && <>
      <details><summary>বাংলা ও ইংরেজি বার্তার নমুনা</summary><p>{detail.previewBn} · {detail.previewSegmentsBn} অংশ</p><p lang="en">{detail.previewEn} · {detail.previewSegmentsEn} segments</p></details>
      <p>৫ কিমির মধ্যে সম্ভাব্য প্রাপক {detail.paidCount} জন। স্পনসর পাইলটে সর্বোচ্চ {detail.pilotCount} জন।</p>
      {detail.paidCount === 0 ? <p>বর্তমানে উপযুক্ত প্রাপক পাওয়া যায়নি। হাসপাতাল ও বিনামূল্যের অনুসন্ধান ব্যবহার করুন।</p> : <>
        <p>প্রেরণের আগে কভারেজ বদলাতে পারে। কোনো প্রেরণ হওয়ার আগে অনুরোধ বন্ধ হলে পরীক্ষামূলক পুরো মূল্য ফেরত দেখানো হবে।</p>
        <label className={styles.check}><input type="checkbox" checked={confirm} onChange={event => setConfirm(event.target.checked)} /> দেখানো কভারেজ ও শর্ত বুঝেছি</label>
        <div className={styles.actions}>
          {detail.pilotCount > 0 && <button disabled={disabled || !confirm} onClick={() => start('PILOT', detail.pilotCount)}>স্পনসর পাইলট · ৳০</button>}
          <button disabled={disabled || !confirm} onClick={() => start('PAID', detail.paidCount)}>৳৩৫ পরীক্ষামূলক পেমেন্ট</button>
        </div>
      </>}
    </>}
    {detail.charged > 0 && <p>পরীক্ষামূলক রসিদ · ৳{detail.charged / 100} · {detail.id}</p>}
    {detail.refunded > 0 && <p>পরীক্ষামূলক ফেরত · ৳{detail.refunded / 100}</p>}
    {detail.coverage > 0 && <p>কভারেজ {detail.coverage} · পরীক্ষামূলক প্রেরণ {simulated} · আগ্রহী {interested}</p>}
  </div>;
}

export default function EmergencySmsPanel({ open, accountEntry = false }: { open: boolean; accountEntry?: boolean }) {
  const [catalog, setCatalog] = useState<Catalog>();
  const [account, setAccount] = useState<Account>();
  const [detail, setDetail] = useState<Detail>();
  const [expanded, setExpanded] = useState(accountEntry);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [point, setPoint] = useState<{ latitude: number; longitude: number }>();
  const [selectedId, setSelectedId] = useState('');
  const loadAccount = async () => setAccount(await emergencyFetch<Account>(emergencyApi + '?view=account'));
  const loadDetail = async (id: string) => {
    setSelectedId(id);
    setDetail(await emergencyFetch<Detail>(emergencyApi + '?view=detail&id=' + encodeURIComponent(id)));
  };
  useEffect(() => {
    if (!open) return;
    let current = true;
    emergencyFetch<Catalog>(emergencyApi).then(value => { if (current) setCatalog(value); }).catch(() => {});
    return () => { current = false; };
  }, [open]);
  useEffect(() => {
    if (!open || !expanded || (!catalog?.enabled && !accountEntry)) return;
    let current = true;
    emergencyFetch<Account>(emergencyApi + '?view=account').then(value => { if (current) setAccount(value); }).catch(() => {});
    return () => { current = false; };
  }, [open, expanded, catalog?.enabled, accountEntry]);

  if (!open || ((!catalog?.enabled || !catalog.visible) && !(accountEntry && account && (account.history.length || account.consent)))) return null;

  async function perform(work: () => Promise<unknown>, success = '') {
    setBusy(true); setMessage('');
    try { await work(); setMessage(success); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'পরে আবার চেষ্টা করুন।'); }
    finally { setBusy(false); }
  }

  function mutate(body: unknown) { return emergencyFetch<{ id?: string }>(emergencyApi, body); }
  function create(data: FormData) {
    void perform(async () => {
      const neededAt = new Date(String(data.get('needed')) + ':00+06:00');
      if (!Number.isFinite(neededAt.getTime())) throw new Error('প্রয়োজনের সময় নির্বাচন করুন।');
      const res = await mutate({ action: 'create', branch: data.get('branch'), reference: data.get('reference'),
        group: data.get('group'), component: data.get('component'), neededAt: neededAt.toISOString() });
      if (res.id) await loadDetail(res.id);
      await loadAccount();
    });
  }

  function locate() {
    setPoint(undefined);
    if (!navigator.geolocation) { setMessage('এই ডিভাইসের অবস্থান পাওয়া যাচ্ছে না।'); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (coords.accuracy > 150) { setMessage('আরও নির্ভুল অবস্থান প্রয়োজন।'); return; }
      setPoint({ latitude: coords.latitude, longitude: coords.longitude });
      setMessage('অবস্থান পাওয়া গেছে। সম্মতি দিয়ে এটি আলাদা সেবা-বিন্দু হিসেবে সংরক্ষণ করুন।');
    }, () => setMessage('অবস্থান পাওয়া যায়নি। অনুমতি পরীক্ষা করুন।'), { enableHighAccuracy: true, timeout: 12_000 });
  }

  return <section lang="bn" className={styles.panel} aria-label="জরুরি রক্তদাতা এসএমএস">
    <div className={styles.heading}><MessageSquare size={22} aria-hidden="true" /><div>
      <h3>জরুরি রক্তদাতা এসএমএস</h3>
      <p>৳৩৫ · হাসপাতালের ৫ কিমির মধ্যে সর্বোচ্চ ৫০ জন সম্মত নিবন্ধিত দাতাকে বার্তা পাঠানোর চেষ্টা।</p>
      <p>দাতার সাড়া ও রক্তদানের সিদ্ধান্ত হাসপাতালের সঙ্গে নিশ্চিত করুন।</p>
    </div></div>
    <p className={styles.notice}>{catalog?.notice || 'নতুন অনুরোধ বন্ধ। আগের অনুরোধের তথ্য দেখতে পারবেন।'}</p>
    <div className={styles.actions}>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'ফর্ম গুটিয়ে নিন' : 'অনুরোধ শুরু করুন'} <ChevronDown size={15} /></button>
      <a href="/donors">বিনামূল্যে দাতা খুঁজুন</a>
    </div>
    {expanded && <div className={styles.content}>
      {!account && <p>অনুরোধ জমা ও আগের অবস্থা দেখতে <a href="/?profile=1">BloodNet অ্যাকাউন্টে প্রবেশ করুন</a>।</p>}
      {account && <>
        {detail ? <>
          <div className={styles.actions}><button type="button" onClick={() => { setDetail(undefined); setSelectedId(''); }}>নতুন অনুরোধ</button>
            <button type="button" disabled={busy} onClick={() => void perform(() => loadDetail(selectedId))}>অবস্থা হালনাগাদ</button></div>
          <ReviewRequest key={detail.id + ':' + detail.paidCount + ':' + detail.pilotCount} detail={detail} disabled={busy}
            start={(funding, count) => void perform(async () => { await mutate({ action: 'start', id: detail.id, funding, count }); await loadDetail(detail.id); })} />
        </> : catalog?.branches.length ? <CreateRequest branches={catalog.branches} disabled={busy} submit={create} />
          : <p>এই মুহূর্তে কোনো শাখা নতুন পরীক্ষামূলক অনুরোধ নিচ্ছে না।</p>}
        {account.history.length > 0 && <details><summary>আমার আগের অনুরোধ</summary>
          <ul>{account.history.map(item => <li key={item.id}><button type="button" disabled={busy} onClick={() => void perform(() => loadDetail(item.id))}>{item.Branch.name} · {statusLabel(item.status)}</button></li>)}</ul>
        </details>}
        {accountEntry && (catalog?.enabled || account.consent) && <details><summary>দাতার পরীক্ষামূলক সম্মতি ও বার্তা</summary>
          <p>আপনার নিশ্চিত সেবা-বিন্দু ব্যক্তিগত থাকবে। এটি লাইভ অবস্থান নয়। পরীক্ষায় মোবাইলে বার্তা যাবে না।</p>
          <p>সম্মতি {account.consent?.available ? 'চালু' : 'বন্ধ'}</p>
          {catalog?.enabled && <><button type="button" onClick={locate}>বর্তমান অবস্থান থেকে সেবা-বিন্দু নির্বাচন</button>
          <form onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            if (point) void perform(async () => { await mutate({ action: 'consent', ...point, language: form.get('language'), available: true, agree: true }); await loadAccount(); }, 'সম্মতি সংরক্ষিত হয়েছে।');
          }}>
            <label>বার্তার ভাষা<select name="language" defaultValue={account.consent?.language || 'bn'}><option value="bn">বাংলা</option><option value="en">English</option></select></label>
            <label className={styles.check}><input type="checkbox" required /> এই সেবা-বিন্দুর জন্য পরীক্ষামূলক জরুরি বার্তা পেতে সম্মত</label>
            <button disabled={!point || busy}>সম্মতি সংরক্ষণ</button>
          </form></>}
          {account.consent?.available && <button type="button" disabled={busy} onClick={() => void perform(async () => { await mutate({ action: 'withdraw' }); await loadAccount(); }, 'সম্মতি বন্ধ হয়েছে।')}>বার্তা বন্ধ করুন</button>}
          {account.inbox.map(item => <article key={item.id}>
            <p>{item.Request.Branch.name} · {item.Request.blood_group} · {statusLabel(item.Request.status)}</p>
            {(['INTERESTED','DECLINED'] as const).map(response => <button type="button" key={response} disabled={busy || item.response === response || Date.parse(item.Request.needed_at) <= Date.now() || !['QUEUED','DISPATCH_COMPLETE'].includes(item.Request.status)}
              onClick={() => void perform(async () => { await mutate({ action: 'respond', delivery: item.id, response }); await loadAccount(); })}>{response === 'INTERESTED' ? 'আগ্রহী' : 'এড়িয়ে যান'}</button>)}
          </article>)}
        </details>}
      </>}
    </div>}
    {message && <p role="status">{message}</p>}
  </section>;
}

export function EmergencyWorkspace({ children }: { children: ReactNode }) {
  return <section lang="bn" className={styles.workspace}>{children}</section>;
}
