'use client';
import React, { useEffect, useRef, useState } from 'react';

export const DECOY_DELAY_MS = 150_000;

export default function LegacyAccessDecoy() {
  const [pending,setPending]=useState(false),[denied,setDenied]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
  return <main className="grid min-h-screen place-items-center bg-slate-100 px-6 py-24 text-slate-900">
    <form className="w-full max-w-sm rounded-lg border border-slate-300 bg-white p-8 shadow-sm" onSubmit={event=>{
      event.preventDefault();if(pending)return;
      // Never send, log, store or validate credentials entered into the decoy.
      event.currentTarget.reset();setPending(true);setDenied(false);
      timer.current=setTimeout(()=>{setPending(false);setDenied(true);},DECOY_DELAY_MS);
    }}>
      <h1 className="mb-6 text-xl font-semibold">Staff sign in</h1>
      <label className="mb-4 block text-sm">Account ID<input autoComplete="off" className="mt-2 w-full rounded border border-slate-300 p-3" disabled={pending}/></label>
      <label className="mb-6 block text-sm">Password<input type="password" autoComplete="off" className="mt-2 w-full rounded border border-slate-300 p-3" disabled={pending}/></label>
      <button disabled={pending} className="w-full rounded bg-slate-800 p-3 text-white disabled:opacity-60">{pending?'Checking access…':'Sign in'}</button>
      <p role="status" aria-live="polite" className="mt-4 text-sm text-red-700">{denied?'Access denied.':''}</p>
    </form>
  </main>;
}
