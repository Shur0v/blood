import { getIndexNowKey } from '@/src/lib/indexNow';

export const dynamic = 'force-dynamic';
export function GET() {
  const key = getIndexNowKey();
  return new Response(key || 'Not configured', {
    status: key ? 200 : 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}
