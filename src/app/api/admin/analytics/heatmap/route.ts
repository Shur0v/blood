import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const QuerySchema = z.object({
  page: z.string().min(1).max(120).default('home'),
  device: z.enum(['all', 'mobile', 'tablet', 'desktop']).default('all'),
  days: z.coerce.number().int().min(1).max(30).default(7),
  limit: z.coerce.number().int().min(50).max(2000).default(600),
});

const toPercent = (value: number, total: number) => (total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0);

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      page: url.searchParams.get('page') || 'home',
      device: url.searchParams.get('device') || 'all',
      days: url.searchParams.get('days') || '7',
      limit: url.searchParams.get('limit') || '600',
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid query params.' }, { status: 400 });
    }

    const { page, device, days, limit } = parsed.data;
    const prisma = getPrisma();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const deviceFilter = device === 'all' ? undefined : device;

    const whereAllEvents = {
      page,
      created_at: { gte: since },
      ...(deviceFilter ? { device_type: deviceFilter } : {}),
    };
    const whereClickEvents = {
      ...whereAllEvents,
      event_type: 'click',
    };
    const whereScrollEvents = {
      ...whereAllEvents,
      event_type: 'scroll',
    };

    const [points, totalPoints, recentPoints, scrollAgg, sessionRows, deviceSplitRows, pagesRows] = await Promise.all([
      prisma.analyticsHeatmapLog.findMany({
        where: whereClickEvents,
        orderBy: { created_at: 'desc' },
        take: limit,
        select: {
          click_x: true,
          click_y: true,
          created_at: true,
          device_type: true,
        },
      }),
      prisma.analyticsHeatmapLog.count({ where: whereClickEvents }),
      prisma.analyticsHeatmapLog.count({
        where: {
          ...whereClickEvents,
          created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.analyticsHeatmapLog.aggregate({
        where: whereScrollEvents,
        _avg: { scroll_depth: true },
      }),
      prisma.analyticsHeatmapLog.groupBy({
        by: ['session_id'],
        where: {
          ...whereAllEvents,
          session_id: { not: null },
        },
      }),
      prisma.analyticsHeatmapLog.groupBy({
        by: ['device_type'],
        where: {
          page,
          created_at: { gte: since },
        },
        _count: { _all: true },
      }),
      prisma.analyticsHeatmapLog.groupBy({
        by: ['page'],
        where: { created_at: { gte: since } },
        _count: { _all: true },
      }),
    ]);

    const avgScrollDepth = Math.round(scrollAgg._avg.scroll_depth ?? 0);

    let tl = 0;
    let tr = 0;
    let bl = 0;
    let br = 0;
    for (const p of points) {
      if (p.click_x < 0.5 && p.click_y < 0.5) tl += 1;
      else if (p.click_x >= 0.5 && p.click_y < 0.5) tr += 1;
      else if (p.click_x < 0.5 && p.click_y >= 0.5) bl += 1;
      else br += 1;
    }

    const zoneRanks = [
      { label: 'Top-Left Zone', count: tl },
      { label: 'Top-Right Zone', count: tr },
      { label: 'Bottom-Left Zone', count: bl },
      { label: 'Bottom-Right Zone', count: br },
    ].sort((a, b) => b.count - a.count);

    const sessionsProxy = sessionRows.length;

    const deviceTotal = deviceSplitRows.reduce((sum, row) => sum + row._count._all, 0);
    const deviceSplit = deviceSplitRows.map((row) => ({
      device: row.device_type,
      clicks: row._count._all,
      percent: toPercent(row._count._all, deviceTotal),
    }));

    return NextResponse.json({
      success: true,
      data: {
        selected: { page, device, days },
        metrics: {
          totalPoints,
          recentPoints,
          sessionsProxy,
          avgScrollDepth,
          topZone: zoneRanks[0]?.label ?? 'No Data',
        },
        points: points.map((p) => ({
          x: p.click_x ?? 0,
          y: p.click_y ?? 0,
          device: p.device_type,
          at: p.created_at,
        })),
        zones: {
          topLeft: tl,
          topRight: tr,
          bottomLeft: bl,
          bottomRight: br,
        },
        deviceSplit,
        pageOptions: pagesRows
          .sort((a, b) => b._count._all - a._count._all)
          .map((row) => ({
            page: row.page,
            count: row._count._all,
          })),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch heatmap analytics.' }, { status: 500 });
  }
}
