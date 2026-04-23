import { NextResponse } from 'next/server';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfUtcDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);
const startOfUtcWeek = (date: Date) => {
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return startOfUtcDay(addDays(date, mondayOffset));
};

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const prisma = getPrisma();
    const now = new Date();
    const todayStart = startOfUtcDay(now);
    const weekStart = startOfUtcWeek(now);

    const [
      totalUsers,
      activeUserDonors,
      activeManualDonors,
      inactiveUserDonors,
      userOrganPledges,
      manualOrganDonors,
      pendingVerifications,
      pendingOrganRequests,
      totalReports,
      pendingBlogs,
      todayClicks,
      weekClicks,
      countries,
      cities,
      topRegionsRaw,
      recentUsers,
      recentReports,
      recentOrganRequests,
      recentVerifications,
      topCtaRow,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { is_active_donor: true } }),
      prisma.manualBloodDonor.count({ where: { is_active_donor: true } }),
      prisma.user.count({ where: { is_active_donor: false } }),
      prisma.organPledge.count({ where: { is_active: true } }),
      prisma.manualOrganDonor.count(),
      prisma.verificationDocument.count({ where: { review_status: 'PENDING' } }),
      prisma.organRequest.count({ where: { status: 'PENDING' } }),
      prisma.report.count(),
      prisma.blog.count({ where: { OR: [{ status: 'DRAFT' }, { status: 'PENDING' as any }] } }),
      prisma.analyticsClickLog.count({ where: { created_at: { gte: todayStart } } }),
      prisma.analyticsClickLog.count({ where: { created_at: { gte: weekStart } } }),
      prisma.user.findMany({
        distinct: ['location_country'],
        select: { location_country: true },
      }),
      prisma.user.findMany({
        distinct: ['location_country', 'location_city'],
        select: { location_country: true, location_city: true },
      }),
      prisma.user.groupBy({
        by: ['location_country'],
        _count: { _all: true },
        orderBy: { _count: { location_country: 'desc' } },
        take: 3,
      }),
      prisma.user.findMany({
        orderBy: { created_at: 'desc' },
        take: 4,
        select: { name: true, created_at: true, location_city: true },
      }),
      prisma.report.findMany({
        orderBy: { created_at: 'desc' },
        take: 4,
        select: { target_type: true, created_at: true, status: true },
      }),
      prisma.organRequest.findMany({
        orderBy: { created_at: 'desc' },
        take: 4,
        select: { name: true, organ_type: true, created_at: true, status: true },
      }),
      prisma.verificationDocument.findMany({
        orderBy: { created_at: 'desc' },
        take: 4,
        select: { document_type: true, created_at: true, review_status: true },
      }),
      prisma.analyticsClickLog.groupBy({
        by: ['component'],
        where: { created_at: { gte: weekStart } },
        _count: { _all: true },
        orderBy: { _count: { component: 'desc' } },
        take: 1,
      }),
    ]);

    const recentActivity = [
      ...recentUsers.map((row) => ({
        type: 'USER_REGISTERED',
        message: `New user registered (${row.name})`,
        at: row.created_at,
        status: 'INFO',
      })),
      ...recentReports.map((row) => ({
        type: 'REPORT',
        message: `Report submitted (${row.target_type})`,
        at: row.created_at,
        status: row.status,
      })),
      ...recentOrganRequests.map((row) => ({
        type: 'ORGAN_REQUEST',
        message: `Organ request: ${row.organ_type} (${row.name})`,
        at: row.created_at,
        status: row.status,
      })),
      ...recentVerifications.map((row) => ({
        type: 'VERIFICATION',
        message: `Verification document uploaded (${row.document_type})`,
        at: row.created_at,
        status: row.review_status,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 8);

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalRegisteredUsers: totalUsers,
          totalActiveDonors: activeUserDonors + activeManualDonors,
          totalInactiveDonors: inactiveUserDonors,
          organRegistryEntries: userOrganPledges + manualOrganDonors,
          pendingVerifications,
          pendingOrganRequests,
          reportsSubmitted: totalReports,
          pendingBlogs,
        },
        traffic: {
          todayClicks,
          weekClicks,
          topCTA: topCtaRow[0]?.component || 'N/A',
        },
        regional: {
          countries: countries.length,
          cities: cities.length,
          topRegions: topRegionsRaw.map((row) => ({
            country: row.location_country,
            users: row._count._all,
          })),
        },
        queue: {
          pendingVerifications,
          unresolvedReports: await prisma.report.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
          organRequestsReview: pendingOrganRequests,
          blogApprovals: pendingBlogs,
        },
        recentActivity: recentActivity.map((row) => ({
          ...row,
          at: row.at.toISOString(),
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to load dashboard overview.' }, { status: 500 });
  }
}
