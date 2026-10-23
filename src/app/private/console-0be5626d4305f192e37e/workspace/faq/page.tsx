'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { CircleHelp, Plus, Save, Trash2, Search, ChevronDown, ArrowUpRight } from 'lucide-react';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyDraft = { question: '', answer: '', sortOrder: 0, isActive: true };

export default function FaqManagerPage() {
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [items, setItems] = useState<FaqItem[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/faqs', { method: 'GET', credentials: 'include', cache: 'no-store' });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setError(payload.message || 'Failed to load FAQ items.');
        return;
      }
      setItems(payload.data || []);
    } catch {
      setError('Failed to load FAQ items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createFaq = async () => {
    setCreating(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setError(payload.message || 'Failed to create FAQ.');
        return;
      }
      setItems(payload.data || []);
      setDraft(emptyDraft);
      setMessage('FAQ created.');
    } catch {
      setError('Failed to create FAQ.');
    } finally {
      setCreating(false);
    }
  };

  const saveFaq = async (item: FaqItem) => {
    setSavingId(item.id);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/faqs/${item.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setError(payload.message || 'Failed to update FAQ.');
        return;
      }
      setItems(payload.data || []);
      setMessage('FAQ updated.');
    } catch {
      setError('Failed to update FAQ.');
    } finally {
      setSavingId(null);
    }
  };

  const deleteFaq = async (id: string) => {
    setDeletingId(id);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setError(payload.message || 'Failed to delete FAQ.');
        return;
      }
      setItems(payload.data || []);
      setMessage('FAQ deleted.');
    } catch {
      setError('Failed to delete FAQ.');
    } finally {
      setDeletingId(null);
    }
  };

  const visible=items.filter(item=>(visibility==='all'||item.isActive===(visibility==='active'))&&(item.question+' '+item.answer).toLowerCase().includes(search.toLowerCase()));
  const active=items.filter(item=>item.isActive).length;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-300">Content workspace</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Answers that build trust.</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Keep donation guidance clear, useful and easy to find.</p></div><a href="/faq" target="_blank" rel="noopener noreferrer" className="admin-action">View public FAQ<ArrowUpRight size={15}/></a></div>
    <div className="grid grid-cols-3 gap-3 sm:gap-4">{[['Total FAQs',items.length],['Published',active],['Hidden',items.length-active]].map(([label,value])=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-700 dark:bg-[#162033]"><p className="text-xs text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold">{loading?'—':value}</p></div>)}</div>
    {error&&<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}{message&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.3fr)]"><Card><div className="mb-6 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"><Plus size={19}/></span><div><h3 className="text-lg font-semibold">Create a helpful answer</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Add a question and decide when it appears on the website.</p></div></div>
    <form onSubmit={event=>{event.preventDefault();void createFaq();}}><fieldset disabled={creating} className="min-w-0 space-y-5"><label className={labelClass}>Question<input required minLength={8} maxLength={300} aria-label="New FAQ question" value={draft.question} onChange={e=>setDraft(prev=>({...prev,question:e.target.value}))} placeholder="What would a donor like to know?" className={fieldClass}/></label><label className={labelClass}>Answer<textarea required minLength={12} maxLength={5000} rows={6} aria-label="New FAQ answer" value={draft.answer} onChange={e=>setDraft(prev=>({...prev,answer:e.target.value}))} placeholder="Write a clear, practical answer…" className={fieldClass}/></label><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"><label className={labelClass}>Display order<input type="number" min={0} max={9999} value={draft.sortOrder} onChange={e=>setDraft(prev=>({...prev,sortOrder:Number(e.target.value||0)}))} className={fieldClass}/><span className="mt-1 block text-[11px] font-normal text-slate-500 dark:text-slate-400">Lower numbers appear first.</span></label><label className="flex min-h-12 items-center gap-3 self-center rounded-xl border border-slate-200 px-3 py-3 text-sm dark:border-slate-700"><input type="checkbox" checked={draft.isActive} onChange={e=>setDraft(prev=>({...prev,isActive:e.target.checked}))} className="h-4 w-4 accent-rose-600"/>Publish on website</label></div><button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60 dark:bg-rose-500 dark:hover:bg-rose-600"><Plus size={17}/>{creating?'Creating…':'Add FAQ'}</button></fieldset></form></Card>
    <section className="min-w-0 space-y-4" aria-labelledby="faq-library-heading"><div><h3 id="faq-library-heading" className="text-lg font-semibold">Your answer library</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{visible.length} of {items.length} questions · open a question to edit</p></div><div className="flex flex-wrap gap-3"><label className="relative min-w-0 flex-1 basis-full sm:basis-0"><Search size={16} className="pointer-events-none absolute left-3 top-4 text-slate-400"/><input type="search" aria-label="Search FAQ questions and answers" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find a question or answer" className={fieldClass+' mt-0 pl-10'}/></label><select aria-label="FAQ visibility" value={visibility} onChange={e=>setVisibility(e.target.value)} className={fieldClass+' mt-0 sm:w-auto'}><option value="all">All statuses</option><option value="active">Published</option><option value="hidden">Hidden</option></select></div>
    {loading?<p role="status" className="p-5 text-sm text-slate-500 dark:text-slate-400">Loading your questions…</p>:!visible.length?<div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><CircleHelp size={24} className="mx-auto mb-3 text-rose-500"/><p className="text-sm text-slate-500 dark:text-slate-400">{items.length?'No questions match these filters.':'Your first helpful answer starts here.'}</p></div>:null}
    {items.map(item=><div key={item.id} hidden={!visible.some(row=>row.id===item.id)}><FaqEditorRow item={item} onSave={saveFaq} onDelete={deleteFaq} saving={savingId===item.id} deleting={deletingId===item.id}/></div>)}
    </section></div></div>;
}

const fieldClass='mt-2 min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-normal text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 dark:border-slate-700 dark:bg-[#131c2c] dark:text-slate-100';
const labelClass='block min-w-0 text-xs font-semibold text-slate-600 dark:text-slate-300';

function FaqEditorRow({
  item,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  item: FaqItem;
  onSave: (item: FaqItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
  deleting: boolean;
}) {
  const [local, setLocal] = useState(item);

  useEffect(() => {
    setLocal(item);
  }, [item]);

  return <details className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#162033]">
    <summary className="flex min-h-20 cursor-pointer list-none items-start justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden"><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className={'rounded-full px-2.5 py-1 text-[10px] font-semibold '+(item.isActive?'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300':'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400')}>{item.isActive?'Published':'Hidden'}</span><span className="text-[10px] text-slate-400">Order {item.sortOrder}</span></div><h4 className="break-words text-sm font-semibold leading-6">{item.question}</h4><p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">{item.answer}</p></div><ChevronDown size={17} className="mt-1 shrink-0 text-slate-400 transition-transform group-open:rotate-180"/></summary>
    <form onSubmit={event=>{event.preventDefault();void onSave(local);}} className="border-t border-slate-100 p-5 dark:border-slate-700"><fieldset disabled={saving||deleting} className="min-w-0 space-y-4"><label className={labelClass}>Question<input required minLength={8} maxLength={300} aria-label="FAQ question" value={local.question} onChange={e=>setLocal(prev=>({...prev,question:e.target.value}))} className={fieldClass}/></label><label className={labelClass}>Answer<textarea required minLength={12} maxLength={5000} rows={5} aria-label="FAQ answer" value={local.answer} onChange={e=>setLocal(prev=>({...prev,answer:e.target.value}))} className={fieldClass}/></label><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Display order<input type="number" min={0} max={9999} value={local.sortOrder} onChange={e=>setLocal(prev=>({...prev,sortOrder:Number(e.target.value||0)}))} className={fieldClass}/></label><label className="flex min-h-12 items-center gap-3 self-end rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700"><input type="checkbox" checked={local.isActive} onChange={e=>setLocal(prev=>({...prev,isActive:e.target.checked}))} className="h-4 w-4 accent-rose-600"/>Publish on website</label></div><div className="flex flex-wrap justify-between gap-3 pt-2"><button type="button" onClick={()=>void onDelete(local.id)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 px-4 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"><Trash2 size={15}/>{deleting?'Deleting…':'Delete'}</button><button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60 dark:bg-rose-500 dark:hover:bg-rose-600"><Save size={15}/>{saving?'Saving…':'Save changes'}</button></div></fieldset></form>
  </details>;
}
