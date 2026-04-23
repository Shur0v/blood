import { NextResponse } from "next/server";
import { getPrisma } from "@/src/backend/config/db";
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from "@/src/backend/utils/session";

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfUtcDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);
const startOfUtcMonth = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const startOfUtcYear = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
const startOfUtcWeek = (date: Date) => {
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return startOfUtcDay(addDays(date, mondayOffset));
};

const pctChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const isNoisyComponentLabel = (value: string): boolean => {
  const lower = value.toLowerCase();
  const utilityHints = ["flex", "items-", "justify-", "rounded-", "text-", "bg-", "hover:", "w-", "h-", "px-", "py-", "md:", "lg:", "xl:"];
  const matched = utilityHints.filter((hint) => lower.includes(hint)).length;
  return matched >= 2;
};

const mapFromGroups = (groups: Array<{ page: string; component: string; _count: { _all: number } }>): Map<string, number> => {
  const map = new Map<string, number>();
  for (const row of groups) {
    map.set(`${row.page}::${row.component}`, row._count._all);
  }
  return map;
};

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const prisma = getPrisma();
    const now = new Date();
    const todayStart = startOfUtcDay(now);
    const tomorrowStart = addDays(todayStart, 1);
    const yesterdayStart = addDays(todayStart, -1);
    const weekStart = startOfUtcWeek(now);
    const prevWeekStart = addDays(weekStart, -7);
    const monthStart = startOfUtcMonth(now);
    const prevMonthStart = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1));
    const yearStart = startOfUtcYear(now);
    const prevYearStart = new Date(Date.UTC(yearStart.getUTCFullYear() - 1, 0, 1));

    const [
      todayCount,
      yesterdayCount,
      weekCount,
      prevWeekCount,
      monthCount,
      prevMonthCount,
      yearCount,
      prevYearCount,
      monthGroups,
      todayGroups,
      yesterdayGroups,
      weekGroups,
      prevWeekGroups,
      deviceRows,
      trendRows,
    ] = await Promise.all([
      prisma.analyticsClickLog.count({ where: { created_at: { gte: todayStart, lt: tomorrowStart } } }),
      prisma.analyticsClickLog.count({ where: { created_at: { gte: yesterdayStart, lt: todayStart } } }),
      prisma.analyticsClickLog.count({ where: { created_at: { gte: weekStart } } }),
      prisma.analyticsClickLog.count({ where: { created_at: { gte: prevWeekStart, lt: weekStart } } }),
      prisma.analyticsClickLog.count({ where: { created_at: { gte: monthStart } } }),
      prisma.analyticsClickLog.count({ where: { created_at: { gte: prevMonthStart, lt: monthStart } } }),
      prisma.analyticsClickLog.count({ where: { created_at: { gte: yearStart } } }),
      prisma.analyticsClickLog.count({ where: { created_at: { gte: prevYearStart, lt: yearStart } } }),
      prisma.analyticsClickLog.groupBy({
        by: ["page", "component"],
        where: { created_at: { gte: monthStart } },
        _count: { _all: true },
        _max: { created_at: true },
      }),
      prisma.analyticsClickLog.groupBy({
        by: ["page", "component"],
        where: { created_at: { gte: todayStart, lt: tomorrowStart } },
        _count: { _all: true },
      }),
      prisma.analyticsClickLog.groupBy({
        by: ["page", "component"],
        where: { created_at: { gte: yesterdayStart, lt: todayStart } },
        _count: { _all: true },
      }),
      prisma.analyticsClickLog.groupBy({
        by: ["page", "component"],
        where: { created_at: { gte: weekStart } },
        _count: { _all: true },
      }),
      prisma.analyticsClickLog.groupBy({
        by: ["page", "component"],
        where: { created_at: { gte: prevWeekStart, lt: weekStart } },
        _count: { _all: true },
      }),
      prisma.analyticsClickLog.groupBy({
        by: ["device_type"],
        where: { created_at: { gte: monthStart } },
        _count: { _all: true },
      }),
      prisma.analyticsClickLog.findMany({
        where: { created_at: { gte: addDays(todayStart, -13) } },
        select: { created_at: true },
      }),
    ]);

    const todayMap = mapFromGroups(todayGroups);
    const yesterdayMap = mapFromGroups(yesterdayGroups);
    const weekMap = mapFromGroups(weekGroups);
    const prevWeekMap = mapFromGroups(prevWeekGroups);

    const detailed = monthGroups
      .filter((row) => !isNoisyComponentLabel(row.component))
      .map((row) => {
      const key = `${row.page}::${row.component}`;
      const dailyNow = todayMap.get(key) ?? 0;
      const dailyPrev = yesterdayMap.get(key) ?? 0;
      const weeklyNow = weekMap.get(key) ?? 0;
      const weeklyPrev = prevWeekMap.get(key) ?? 0;
      const dailyChange = pctChange(dailyNow, dailyPrev);
      const weeklyChange = pctChange(weeklyNow, weeklyPrev);
      return {
        page: row.page,
        component: row.component,
        clickCount: row._count._all,
        lastSeen: row._max.created_at,
        dailyChange,
        weeklyChange,
        trend: weeklyChange >= 0 ? "up" : "down",
      };
      })
      .sort((a, b) => {
        const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
        const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
        return bTime - aTime;
      });

    const topSections = [...detailed]
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 5)
      .map((item) => ({
      component: item.component,
      clicks: item.clickCount,
      }));

    const deviceTotal = deviceRows.reduce((sum, row) => sum + row._count._all, 0) || 1;
    const deviceSplit = deviceRows.map((row) => ({
      device: row.device_type,
      clicks: row._count._all,
      percent: Number(((row._count._all / deviceTotal) * 100).toFixed(1)),
    }));

    const trendMap = new Map<string, number>();
    for (const row of trendRows) {
      const key = row.created_at.toISOString().slice(0, 10);
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }
    const trend = Array.from({ length: 14 }).map((_, index) => {
      const day = addDays(todayStart, -13 + index);
      const key = day.toISOString().slice(0, 10);
      return {
        day: key,
        count: trendMap.get(key) ?? 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          today: todayCount,
          yesterday: yesterdayCount,
          week: weekCount,
          prevWeek: prevWeekCount,
          month: monthCount,
          prevMonth: prevMonthCount,
          year: yearCount,
          prevYear: prevYearCount,
          trends: {
            today: pctChange(todayCount, yesterdayCount),
            week: pctChange(weekCount, prevWeekCount),
            month: pctChange(monthCount, prevMonthCount),
            year: pctChange(yearCount, prevYearCount),
          },
        },
        trend,
        deviceSplit,
        topSections,
        detailed: detailed.slice(0, 20).map(({ lastSeen, ...row }) => row),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch click analytics." }, { status: 500 });
  }
}
