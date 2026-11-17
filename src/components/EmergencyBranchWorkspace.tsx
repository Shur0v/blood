'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { EmergencyWorkspace, emergencyApi, emergencyFetch, statusLabel } from './EmergencySmsPanel';

type Access = { branch_id: string; role: string; Branch: { name: string } };
type Row = { id: string; branch_id: string; reference: string; status: string; blood_group: string; component: string; needed_at: string; funding: string };
type Workspace = { access: Access[]; rows: Row[]; staff: { id: string; branch_id: string; role: string; email: string; revoked_at: string | null }[];
  finance: { id: string; charged_paisa: number; refund_paisa: number; status: string }[] };
const steps: Record<string, string> = { VERIFY: 'যাচাই করুন', REJECT: 'প্রত্যাখ্যান', STOP: 'বন্ধ করুন', SECOND: 'দ্বিতীয় ব্যাচ অনুমোদন', CONFIRM: 'হাসপাতালের ফল নিশ্চিত করুন' };

export default function EmergencyBranchWorkspace() {
  const [data, setData] = useState<Workspace>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState('');
  const load = async () => setData(await emergencyFetch<Workspace>(emergencyApi + '?view=workspace'));
  useEffect(() => { void load().catch(error => setMessage(error.message)); }, []);
  async function action(body: unknown) {
    setBusy(true); setMessage(''); setInvite('');
    try {
      const response = await emergencyFetch<{ token?: string }>(emergencyApi, body);
      if (response.token) setInvite(response.token);
      await load(); setMessage('কাজটি সম্পন্ন হয়েছে।');
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>, name: string) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    void action({ ...values, action: name });
  }
  const admins = data?.access.filter(item => item.role === 'BRANCH_ADMIN') || [];
  return <EmergencyWorkspace>
    <h1>হাসপাতাল কর্মক্ষেত্র</h1>
    <p>শুধু অনুমোদিত শাখায় কাজ করুন। পরীক্ষামূলক কার্যপ্রবাহে বাস্তব চার্জ বা এসএমএস হয় না।</p>
    {!data && <a href="/?profile=1">BloodNet অ্যাকাউন্টে প্রবেশ করুন</a>}
    <details><summary>আমন্ত্রণ গ্রহণ</summary>
      <form onSubmit={event => submit(event, 'accept')}>
        <label>একবার ব্যবহারযোগ্য কোড<input name="token" required autoComplete="off" maxLength={43} /></label><button disabled={busy}>আমন্ত্রণ গ্রহণ করুন</button>
      </form>
    </details>
    {data?.access.map(item => <p key={item.branch_id + item.role}>{item.Branch.name} · {item.role}</p>)}
    {admins.length > 0 && <details><summary>শাখার টিম অ্যাক্সেস</summary>
      <form onSubmit={event => submit(event, 'invite')}>
        <label>শাখা<select name="branch">{admins.map(item => <option value={item.branch_id} key={item.branch_id}>{item.Branch.name}</option>)}</select></label>
        <label>অ্যাকাউন্টের ইমেইল<input name="email" type="email" required /></label>
        <label>ভূমিকা<select name="role"><option value="VERIFIER">যাচাইকারী</option><option value="DISPATCH">ডিসপ্যাচ</option><option value="CAMPAIGN">ক্যাম্পেইন</option></select></label>
        <button disabled={busy}>কোড তৈরি করুন</button>
      </form>
      {invite && <p>ব্যক্তিগতভাবে পাঠানোর একবার ব্যবহারযোগ্য কোড <code>{invite}</code></p>}
      {data?.staff.map(item => <article key={item.id}>{item.email} · {item.role} {!item.revoked_at && <button disabled={busy} onClick={() => void action({ action: 'revoke', branch: item.branch_id, access: item.id })}>প্রত্যাহার</button>}</article>)}
    </details>}
    {data?.rows.map(row => {
      const roles = data.access.filter(item => item.branch_id === row.branch_id).map(item => item.role);
      const verify = roles.includes('BRANCH_ADMIN') || roles.includes('VERIFIER');
      const dispatch = roles.includes('BRANCH_ADMIN') || roles.includes('DISPATCH');
      const visible = [
        ...(verify && row.status === 'PENDING' ? ['VERIFY','REJECT'] : []),
        ...(verify && row.status === 'VERIFIED' ? ['REJECT'] : []),
        ...(dispatch && row.status === 'QUEUED' && row.funding === 'PILOT' ? ['SECOND'] : []),
        ...((verify || dispatch) && ['PENDING','VERIFIED','QUEUED','DISPATCH_COMPLETE'].includes(row.status) ? ['STOP'] : []),
        ...(verify && ['QUEUED','DISPATCH_COMPLETE','STOPPED'].includes(row.status) ? ['CONFIRM'] : []),
      ];
      return <article key={row.id}><p>{row.reference} · {row.blood_group} · {row.component} · {new Date(row.needed_at).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })} · {statusLabel(row.status)}</p>
        {visible.map(step => <button key={step} disabled={busy} onClick={() => void action({ action: 'operate', id: row.id, step })}>{steps[step]}</button>)}</article>;
    })}
    {data?.finance.length ? <details><summary>শাখার পরীক্ষামূলক লেনদেন</summary>
      {data.finance.map(row => <p key={row.id}>{row.id} · ৳{row.charged_paisa / 100} · ফেরত ৳{row.refund_paisa / 100}</p>)}
    </details> : null}
    <p role="status">{message}</p>
  </EmergencyWorkspace>;
}
