import { z } from 'zod';

// Keep the interaction name, never the selected health-related category.
export function analyticsComponentLabel(value:string){return value.replace(/^(Blood|Organ(?: Blood)?) Filter (?!All$).+/,'$1 Filter change');}

export const ClickEventSchema = z.object({
  page: z.string().min(1).max(2048),
  component: z.string().min(1).max(120).transform(analyticsComponentLabel),
  deviceType: z.enum(['mobile', 'tablet', 'desktop']),
  timestamp: z.string().datetime().optional(),
  eventId: z.string().uuid().optional(),
  sessionId: z.string().min(8).max(160).optional(),
  clickX: z.number().min(0).max(1).optional(),
  clickY: z.number().min(0).max(1).optional(),
  viewportW: z.number().int().min(100).max(10000).optional(),
  viewportH: z.number().int().min(100).max(10000).optional(),
  documentW: z.number().int().min(100).max(1000000).optional(),
  documentH: z.number().int().min(100).max(1000000).optional(),
  targetPath: z.string().max(1500).regex(/^[a-z0-9:()>\s-]+$/).optional(),
  targetX: z.number().min(0).max(1).optional(),
  targetY: z.number().min(0).max(1).optional(),
  surface: z.enum(['document','overlay']).optional(),
}).superRefine((event, ctx) => {
  if (event.eventId && [event.clickX, event.clickY, event.documentW, event.documentH, event.viewportW, event.viewportH].some(value => value === undefined)) {
    ctx.addIssue({ code: 'custom', message: 'Document coordinates and dimensions are required for unified events.' });
  }
});

export function analyticsPagePath(page: string): string | null {
  const path = page === 'home' ? '/' : '/' + page.replace(/ > /g, '/').replace(/^\/+/, '');
  try {
    const decoded = decodeURIComponent(path);
    if (!/^\/[\p{L}\p{N}/_ -]*$/u.test(decoded) || decoded.includes('//') || /^\/(api|admin-dashboard|dashboard|profile|account|settings|private|login|register|user)(\/|$)/i.test(decoded)) return null;
  } catch { return null; }
  return path;
}

export function analyticsPageKey(pathname: string, view?: string): string {
  // Shared homepage content on another route must not replace that route's identity.
  if (view === 'profile') return 'profile';
  if (pathname === '/') return (view || 'home').trim().slice(0,2048);
  return pathname.replace(/^\/+/, '').replace(/\//g, ' > ').slice(0,2048) || 'home';
}

export function documentClick(clientX: number, clientY: number, scrollX: number, scrollY: number, width: number, height: number) {
  return { x: Math.max(0, Math.min(1, (clientX + scrollX) / Math.max(1, width))), y: Math.max(0, Math.min(1, (clientY + scrollY) / Math.max(1, height))) };
}

// Structural selector only: never store text, field values, class names or user identifiers.
export function analyticsTargetPath(element: Element): string | undefined {
  const parts: string[] = [];
  let node: Element | null = element;
  while (node && node !== node.ownerDocument.body && parts.length < 32) {
    const tag = node.tagName.toLowerCase();
    if (!/^[a-z][a-z0-9-]*$/.test(tag)) return;
    const siblings: Element[] = node.parentElement ? Array.from(node.parentElement.children).filter(child => child.tagName === node!.tagName) : [];
    parts.unshift(`${tag}:nth-of-type(${siblings.indexOf(node)+1})`);
    node = node.parentElement;
  }
  return node === element.ownerDocument.body ? ['body',...parts].join(' > ') : undefined;
}
