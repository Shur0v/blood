'use client';
import React,{useState,useEffect} from 'react';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {LayoutDashboard,Users,AlertTriangle,UserMinus,Globe,Droplet,Heart,Image as ImageIcon,PenTool,MousePointerClick,Map,Shield,Menu,X,Search,FileText,Palette,CircleHelp,Megaphone,HeartPulse,Sun,Moon,ArrowUpRight} from 'lucide-react';
const MENU_ITEMS = [
  { name: 'Dashboard Overview', href: '/private/console-0be5626d4305f192e37e/workspace', icon: LayoutDashboard },
  { name: 'Medical Operations', href: '/private/console-0be5626d4305f192e37e/workspace/medical-operations', icon: HeartPulse },
  { name: 'All User List', href: '/private/console-0be5626d4305f192e37e/workspace/users', icon: Users },
  { name: 'Reports', href: '/private/console-0be5626d4305f192e37e/workspace/reports', icon: AlertTriangle },
  { name: 'Patient Aid Requests', href: '/private/console-0be5626d4305f192e37e/workspace/financial-requests', icon: FileText },
  { name: 'Inactive Donors', href: '/private/console-0be5626d4305f192e37e/workspace/inactive-donors', icon: UserMinus },
  { name: 'Total Regional Users', href: '/private/console-0be5626d4305f192e37e/workspace/regional-users', icon: Globe },
  { name: 'Manual Blood Donor', href: '/private/console-0be5626d4305f192e37e/workspace/manual-blood-donor', icon: Droplet },
  { name: 'Manual Organ Donor', href: '/private/console-0be5626d4305f192e37e/workspace/manual-organ-donor', icon: Heart },
  { name: 'Homepage Image Slider', href: '/private/console-0be5626d4305f192e37e/workspace/slider-manager', icon: ImageIcon },
  { name: 'Write Blog', href: '/private/console-0be5626d4305f192e37e/workspace/write-blog', icon: PenTool },
  { name: 'Total Click Count', href: '/private/console-0be5626d4305f192e37e/workspace/click-analytics', icon: MousePointerClick },
  { name: 'Heatmap', href: '/private/console-0be5626d4305f192e37e/workspace/heatmap', icon: Map },
  { name: 'Theme Control', href: '/private/console-0be5626d4305f192e37e/workspace/theme-control', icon: Palette },
  { name: 'Ads Control', href: '/private/console-0be5626d4305f192e37e/workspace/ads-control', icon: Megaphone },
  { name: 'FAQ Manager', href: '/private/console-0be5626d4305f192e37e/workspace/faq', icon: CircleHelp },
  { name: 'Spam Monitor', href: '/private/console-0be5626d4305f192e37e/workspace/spam-monitor', icon: AlertTriangle },
  { name: 'Policy Update', href: '/private/console-0be5626d4305f192e37e/workspace/policy', icon: Shield },
];

export default function AdminDashboardLayout({children}:{children:React.ReactNode}){
 const router=useRouter(),pathname=usePathname();
 const [open,setOpen]=useState(false),[checking,setChecking]=useState(true),[authorized,setAuthorized]=useState(false),[theme,setTheme]=useState<'light'|'dark'>('light'),[search,setSearch]=useState('');
 useEffect(()=>{try{const saved=localStorage.getItem('bloodnet-admin-theme');setTheme(saved==='dark'?'dark':'light');}catch{}},[]);
 useEffect(()=>{let active=true;void(async()=>{try{const res=await fetch('/api/auth/session',{credentials:'include',cache:'no-store'});const payload=await res.json();if(!res.ok||!['ADMIN'].includes(payload?.user?.role))throw new Error();if(active)setAuthorized(true);}catch{if(active)router.replace('/private/console-0be5626d4305f192e37e/login');}finally{if(active)setChecking(false);}})();return()=>{active=false;};},[router]);
 useEffect(()=>{setOpen(false);setSearch('');},[pathname]);
 useEffect(()=>{if(!open)return;const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape);},[open]);
 const toggleTheme=()=>setTheme(value=>{const next=value==='light'?'dark':'light';try{localStorage.setItem('bloodnet-admin-theme',next);}catch{}return next;});
 if(checking||!authorized)return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">Checking your admin session…</div>;
 const title=MENU_ITEMS.find(item=>item.href===pathname)?.name||'Admin Center';
 const matches=MENU_ITEMS.filter(item=>item.name.toLowerCase().includes(search.toLowerCase()));
 return <div data-admin-theme={theme} className="admin-shell flex h-dvh overflow-hidden bg-[#f4f6fa] font-sans text-slate-900 dark:bg-[#101827] dark:text-slate-100">
 {open&&<button aria-label="Close navigation overlay" onClick={()=>setOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"/>}
 <aside id="admin-navigation" aria-label="Administration navigation" className={'fixed inset-y-0 left-0 z-50 flex w-[min(280px,85vw)] shrink-0 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:w-[260px] lg:translate-x-0 dark:border-slate-700/60 dark:bg-[#162033] '+(open?'translate-x-0':'-translate-x-full')}>
 <div className="flex h-24 shrink-0 items-center justify-between gap-3 px-6"><Link href="/private/console-0be5626d4305f192e37e/workspace" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/15"><Droplet size={22}/></span><span><span className="block text-lg font-semibold tracking-tight">BloodNet</span><span className="text-xs text-slate-500">Administration</span></span></Link><button aria-label="Close navigation" onClick={()=>setOpen(false)} className="admin-action lg:hidden"><X size={18}/></button></div>
 <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-6"><p className="px-4 pb-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Workspace</p>{MENU_ITEMS.map(item=>{const active=pathname===item.href;const Icon=item.icon;return <Link key={item.href} href={item.href} aria-current={active?'page':undefined} onClick={()=>setOpen(false)} className={'flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors '+(active?'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300':'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white')}><Icon size={17} className="shrink-0"/>{item.name}</Link>;})}</nav><div className="border-t border-slate-200 p-4 dark:border-slate-700"><Link href="/" className="admin-action w-full justify-between">View website<ArrowUpRight size={16}/></Link></div></aside>
 <div className="flex min-w-0 flex-1 flex-col"><header className="relative z-30 flex min-h-20 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-8 dark:border-slate-700/60 dark:bg-[#162033]/90"><div className="flex min-w-0 items-center gap-3"><button className="admin-action lg:hidden" aria-label="Open navigation" aria-expanded={open} aria-controls="admin-navigation" onClick={()=>setOpen(true)}><Menu size={18}/></button><div className="min-w-0"><p className="hidden text-[11px] text-slate-400 sm:block">Your workspace /</p><h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1></div></div><div className="flex shrink-0 items-center gap-3"><div className="relative hidden md:block"><label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-400 dark:border-slate-700 dark:bg-slate-900"><Search size={16}/><input aria-label="Find an admin tool" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find a tool…" className="w-40 bg-transparent text-sm text-slate-700 outline-none dark:text-slate-200"/></label>{search&&<div className="absolute right-0 top-full mt-2 max-h-80 w-72 overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">{matches.length?matches.map(item=><Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-rose-50 hover:text-rose-700">{item.name}</Link>):<p className="p-3 text-sm text-slate-500">No matching tools.</p>}</div>}</div><button onClick={toggleTheme} aria-label={theme==='light'?'Switch to dark mode':'Switch to light mode'} className="admin-action">{theme==='light'?<Moon size={18}/>:<Sun size={18}/>}</button><span className="hidden h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 sm:flex">AD</span></div></header>
 <main className="min-w-0 flex-1 overflow-y-auto p-4 pb-10 sm:p-8"><div className="mx-auto w-full max-w-[1600px]">{children}</div></main></div></div>;
}
