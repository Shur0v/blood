"use client";

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { isDiscoveryPath } from '../lib/discoveryRoutes';

export default function SeoPagePresentation({children}:{children:ReactNode}) {
  const pathname=usePathname();
  return isDiscoveryPath(pathname)?<div className={pathname.startsWith('/donors/')?'donor-editorial-shell':'donor-directory-page'} onClickCapture={event=>{
    if(window.self===window.top||event.ctrlKey||event.metaKey||event.shiftKey)return;
    const link=(event.target as HTMLElement).closest('a');
    if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
    const url=new URL(link.href,window.location.href);
    if(url.hash&&url.pathname===pathname)return;
    event.preventDefault();event.stopPropagation();
    if(url.origin===window.location.origin&&isDiscoveryPath(url.pathname)) {
      url.searchParams.set('donorExplore','1');window.location.assign(url.href);
    }else window.open(url.href,'_blank','noopener,noreferrer');
  }}>{children}</div>:<>{children}</>;
}
