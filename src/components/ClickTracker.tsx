"use client";
import {DISCOVERY_RESULT_EVENT,type DiscoverySnapshot} from '../lib/discoveryState';


import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {analyticsComponentLabel, documentClick, analyticsTargetPath, analyticsPageKey } from "@/src/lib/analytics";

type DeviceType = "mobile" | "tablet" | "desktop";

const MAX_COMPONENT_LENGTH = 120;
const FLUSH_SIZE = 20;
const FLUSH_INTERVAL_MS = 5000;
const MAX_QUEUE_SIZE = 100;
const HEATMAP_SESSION_STORAGE_KEY = "bn_heatmap_session_id";
const SCROLL_EVENT_STEP_PERCENT = 5;
const SCROLL_THROTTLE_MS = 1200;

const sanitizeLabel = (value: string): string => analyticsComponentLabel(value.replace(/\s+/g, " ").trim()).slice(0, MAX_COMPONENT_LENGTH);
const isLikelyUtilityClassText = (value: string): boolean => {
  const lower = value.toLowerCase();
  if (!lower.includes(" ")) return false;
  const utilityHints = ["flex", "items-", "justify-", "rounded-", "text-", "bg-", "hover:", "w-", "h-", "px-", "py-", "md:", "lg:", "xl:"];
  const matched = utilityHints.filter((hint) => lower.includes(hint)).length;
  return matched >= 2;
};

const compactHumanLabel = (value: string): string => {
  const cleaned = sanitizeLabel(value.replace(/[|,]+/g, " "));
  if (!cleaned) return "";
  if (isLikelyUtilityClassText(cleaned)) return "";

  const words = cleaned
    .split(" ")
    .filter((word) => !/^\+?\d{5,}$/.test(word))
    .slice(0, 4);
  return sanitizeLabel(words.join(" "));
};

const detectDeviceType = (): DeviceType => {
  const width = window.innerWidth;
  if (width <= 767) return "mobile";
  if (width <= 1024) return "tablet";
  return "desktop";
};

const createSessionId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, token => {
    const value = Math.floor(Math.random() * 16);
    return (token === 'x' ? value : (value & 3) | 8).toString(16);
  });
};

const getHeatmapSessionId = (): string => {
  try {
    const existing = window.sessionStorage.getItem(HEATMAP_SESSION_STORAGE_KEY);
    if (existing) return existing;
    const next = createSessionId();
    window.sessionStorage.setItem(HEATMAP_SESSION_STORAGE_KEY, next);
    return next;
  } catch {
    return createSessionId();
  }
};

const extractComponentName = (target: HTMLElement | null): string | null => {
  if (!target) return null;

  const tagged = target.closest("[data-analytics-component]") as HTMLElement | null;
  if (tagged?.dataset.analyticsComponent) {
    return sanitizeLabel(tagged.dataset.analyticsComponent);
  }

  const clickable = target.closest("button, a, input, select, textarea, [role='button']") as HTMLElement | null;
  if (!clickable) {
    return null;
  }

  const source = clickable;
  const nearMenu = Boolean(source.closest("aside, nav, [data-analytics-menu='true']"));

  if (source.tagName === "A") {
    const linkLabel = compactHumanLabel(
      source.getAttribute("aria-label") ||
      source.getAttribute("title") ||
      source.textContent ||
      ""
    );
    if (linkLabel) {
      return nearMenu ? `Menu: ${linkLabel}` : linkLabel;
    }
  }

  if (source.tagName === "BUTTON") {
    const buttonLabel = compactHumanLabel(
      source.getAttribute("aria-label") ||
      source.getAttribute("title") ||
      source.textContent ||
      ""
    );
    if (buttonLabel) {
      return nearMenu ? `Menu: ${buttonLabel}` : buttonLabel;
    }
    return nearMenu ? "Menu: Icon Button" : "Icon Button";
  }

  if (source.tagName === "SELECT") {
    const selectLabel = compactHumanLabel(
      source.getAttribute("aria-label") ||
      source.getAttribute("name") ||
      source.getAttribute("id") ||
      "Select Field"
    );
    return nearMenu ? `Menu: ${selectLabel}` : selectLabel;
  }

  if (source.tagName === "INPUT" || source.tagName === "TEXTAREA") {
    const inputLabel = compactHumanLabel(
      source.getAttribute("aria-label") ||
      source.getAttribute("name") ||
      source.getAttribute("id") ||
      (source as HTMLInputElement).placeholder ||
      "Input Field"
    );
    return nearMenu ? `Menu: ${inputLabel}` : inputLabel;
  }

  const rawLabel =
    source.getAttribute("aria-label") ||
    source.getAttribute("title") ||
    source.textContent ||
    "";

  const label = compactHumanLabel(rawLabel);
  if (!label) return null;
  return nearMenu ? `Menu: ${label}` : label;
};

export default function ClickTracker() {
  const pathname = usePathname();
  const pending = useRef<Array<Record<string, unknown>>>([]);
  const sending = useRef(false);
  useEffect(() => {
    if (!pathname || /^\/(admin-dashboard|api|dashboard)(\/|$)/.test(pathname)) return;
    if (window.self !== window.top) return;
    const sessionId = getHeatmapSessionId();
    let maxDepth = 0, lastScroll = 0;
    const flush = async () => {
      if (sending.current || !pending.current.length) return;
      sending.current = true;
      const batch = pending.current.splice(0, FLUSH_SIZE);
      try {
        const body=JSON.stringify({events:batch});
        const response = await fetch('/api/analytics/clicks', { method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:new Blob([body]).size<50000 });
        if (!response.ok) throw new Error('Analytics unavailable');
      } catch { pending.current = [...batch,...pending.current].slice(0,MAX_QUEUE_SIZE); }
      finally { sending.current = false; }
    };
    const page = () => analyticsPageKey(pathname, document.body.dataset.analyticsPage);
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const privateArea = target?.closest('[data-analytics-private], [role="dialog"], dialog');
      const component = target?.closest('a[href^="tel:"]') ? 'Donor contact initiated' : privateArea ? 'Private form interaction' : extractComponentName(target as HTMLElement) || 'Page background';
      const width = Math.max(document.documentElement.scrollWidth,window.innerWidth);
      const height = Math.max(document.documentElement.scrollHeight,document.body.scrollHeight,window.innerHeight);
      const anchor = target?.closest('button,a,input,select,textarea,[data-analytics-component]') || target;
      const rect = anchor?.getBoundingClientRect();
      const targetPath = !privateArea && anchor ? analyticsTargetPath(anchor) : undefined;
      const point = documentClick(event.clientX,event.clientY,window.scrollX,window.scrollY,width,height);
      pending.current.push({page:page(),component,deviceType:detectDeviceType(),timestamp:new Date().toISOString(),eventId:createSessionId(),sessionId,
        clickX:point.x,clickY:point.y,targetPath,targetX:rect?Math.max(0,Math.min(1,(event.clientX-rect.left)/Math.max(1,rect.width))):undefined,targetY:rect?Math.max(0,Math.min(1,(event.clientY-rect.top)/Math.max(1,rect.height))):undefined,surface:privateArea?'overlay':'document',viewportW:window.innerWidth,viewportH:window.innerHeight,documentW:width,documentH:height});
      if(pending.current.length>=FLUSH_SIZE) void flush();
      if(pending.current.length>MAX_QUEUE_SIZE) pending.current=pending.current.slice(-MAX_QUEUE_SIZE);
    };
    const discovery = (event:Event) => {
      if(page()==='profile')return;
      const state=(event as CustomEvent<DiscoverySnapshot>).detail;
      if(!state||!['blood','organ','request'].includes(state.kind)||typeof state.empty!=='boolean')return;
      // Aggregate outcome only: never send queries, categories, coordinates or contacts.
      pending.current.push({page:page(),component:'Discovery '+state.kind+(state.empty?' no matching results':' results available'),deviceType:detectDeviceType(),timestamp:new Date().toISOString()});
      if(pending.current.length>MAX_QUEUE_SIZE)pending.current=pending.current.slice(-MAX_QUEUE_SIZE);
    };
    const scroll = () => {
      if(Date.now()-lastScroll<SCROLL_THROTTLE_MS) return;
      const depth=Math.min(100,Math.round(window.scrollY/Math.max(1,document.documentElement.scrollHeight-window.innerHeight)*100));
      if(depth<maxDepth+SCROLL_EVENT_STEP_PERCENT) return;
      maxDepth=depth;lastScroll=Date.now();
      void fetch('/api/analytics/heatmap',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({events:[{page:page(),deviceType:detectDeviceType(),eventType:'scroll',sessionId,scrollDepth:depth,viewportW:window.innerWidth,viewportH:window.innerHeight}]})}).catch(()=>{});
    };
    const beacon=()=>{
      if(!pending.current.length) return;
      const batch=pending.current.slice(0,MAX_QUEUE_SIZE);
      if(navigator.sendBeacon?.('/api/analytics/clicks',new Blob([JSON.stringify({events:batch})],{type:'application/json'}))) pending.current.splice(0,batch.length);
      else void flush();
    };
    const visibility=()=>{if(document.visibilityState==='hidden')beacon();else void flush();};
    window.addEventListener(DISCOVERY_RESULT_EVENT,discovery);document.addEventListener('click',click,true);window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('pagehide',beacon);document.addEventListener('visibilitychange',visibility);
    const timer=window.setInterval(()=>void flush(),FLUSH_INTERVAL_MS);
    return()=>{window.removeEventListener(DISCOVERY_RESULT_EVENT,discovery);document.removeEventListener('click',click,true);window.removeEventListener('scroll',scroll);window.removeEventListener('pagehide',beacon);document.removeEventListener('visibilitychange',visibility);clearInterval(timer);beacon();};
  },[pathname]);
  return null;
}
