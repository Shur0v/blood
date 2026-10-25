'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import HomepageContentEditor from '@/src/components/HomepageContentEditor';
import RegionalContentEditor from '@/src/components/RegionalContentEditor';
import CityRequestVisibilityControl from '@/src/components/CityRequestVisibilityControl';
import PatientIdVisibilityControl from '@/src/components/PatientIdVisibilityControl';
import {
  Users, UserCheck, UserMinus, HeartPulse,
  ShieldAlert, Database, FileText, RefreshCw, ArrowUpRight, AlertTriangle
} from 'lucide-react';

interface OverviewPayload {
  kpis: {
    totalRegisteredUsers: number;
    totalActiveDonors: number;
    totalInactiveDonors: number;
    organRegistryEntries: number;
    pendingVerifications: number;
    pendingOrganRequests: number;
    reportsSubmitted: number;
    pendingBlogs: number;
  };
  traffic: {
    todayClicks: number;
    weekClicks: number;
    topCTA: string;
  };
  regional: {
    countries: number;
    cities: number;
    topRegions: Array<{ country: string; users: number }>;
  };
  queue: {
    pendingVerifications: number;
    unresolvedReports: number;
    organRequestsReview: number;
    blogApprovals: number;
  };
  recentActivity: Array<{
    type: string;
    message: string;
    at: string;
    status: string;
  }>;
}

const emptyPayload: OverviewPayload = {
  kpis: {
    totalRegisteredUsers: 0,
    totalActiveDonors: 0,
    totalInactiveDonors: 0,
    organRegistryEntries: 0,
    pendingVerifications: 0,
    pendingOrganRequests: 0,
    reportsSubmitted: 0,
    pendingBlogs: 0,
  },
  traffic: {
    todayClicks: 0,
    weekClicks: 0,
    topCTA: 'N/A',
  },
  regional: {
    countries: 0,
    cities: 0,
    topRegions: [],
  },
  queue: {
    pendingVerifications: 0,
    unresolvedReports: 0,
    organRequestsReview: 0,
    blogApprovals: 0,
  },
  recentActivity: [],
};

const fmtCount = (num: number) => num.toLocaleString();

export default function DashboardOverview() {
  const [data, setData] = React.useState<OverviewPayload>(emptyPayload);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error,setError] = React.useState('');
  const [hasLoaded,setHasLoaded] = React.useState(false);

  const loadOverview = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard-overview', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || 'The overview could not load.');
      }
      setData(payload.data as OverviewPayload);setHasLoaded(true);setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to refresh the overview.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadOverview();
    const timer = setInterval(() => {
      if(document.visibilityState==='visible')void loadOverview();
    }, 30000);
    return () => clearInterval(timer);
  }, [loadOverview]);

  const KPIS = [
    { title: 'Total Registered Users', value: fmtCount(data.kpis.totalRegisteredUsers), icon: Users, color: 'text-blue-500' },
    { title: 'Total Active Donors', value: fmtCount(data.kpis.totalActiveDonors), icon: UserCheck, color: 'text-green-500' },
    { title: 'Total Inactive Donors', value: fmtCount(data.kpis.totalInactiveDonors), icon: UserMinus, color: 'text-gray-500' },
    { title: 'Organ Registry Entries', value: fmtCount(data.kpis.organRegistryEntries), icon: HeartPulse, color: 'text-red-500' },
    { title: 'Pending Verifications', value: fmtCount(data.kpis.pendingVerifications), icon: ShieldAlert, color: 'text-amber-500' },
    { title: 'Pending Organ Requests', value: fmtCount(data.kpis.pendingOrganRequests), icon: Database, color: 'text-red-600' },
    { title: 'Reports Submitted', value: fmtCount(data.kpis.reportsSubmitted), icon: AlertTriangle, color: 'text-orange-500' },
    { title: 'Pending Blogs', value: fmtCount(data.kpis.pendingBlogs), icon: FileText, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-300">Network workspace</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">A clearer view of your community.</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Donation activity, pending reviews and visitor engagement in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadOverview()}
            disabled={isLoading} className="admin-action disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading?'animate-spin':''} /> Refresh
          </button>
        </div>
      </div>

      <PatientIdVisibilityControl />
      <CityRequestVisibilityControl />
      <RegionalContentEditor />
      <HomepageContentEditor />
      {error&&<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error} {hasLoaded?'Showing the last successful update.':''}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPIS.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="admin-stat flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{kpi.title}</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight">{hasLoaded?kpi.value:'—'}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-800 ${kpi.color}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Visitor engagement" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5 dark:border-rose-500/20 dark:bg-rose-500/5"><p className="text-xs font-medium text-slate-500 dark:text-slate-400">Clicks today</p><p className="mt-3 text-4xl font-semibold tracking-tight">{hasLoaded?fmtCount(data.traffic.todayClicks):'—'}</p><p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Recorded visitor interactions across the website.</p></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/40"><p className="text-xs font-medium text-slate-500 dark:text-slate-400">Clicks this week</p><p className="mt-3 text-4xl font-semibold tracking-tight">{hasLoaded?fmtCount(data.traffic.weekClicks):'—'}</p><p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Use click analytics to compare changes over time.</p></div></div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="min-w-0"><p className="text-xs text-slate-500 dark:text-slate-400">Most used action</p><p className="mt-1 break-words text-sm font-semibold">{hasLoaded?data.traffic.topCTA:'Loading…'}</p></div><Link href="/private/console-0be5626d4305f192e37e/workspace/click-analytics" className="admin-action">Click analytics<ArrowUpRight size={15}/></Link></div><div className="mt-5 flex flex-wrap gap-3"><Link href="/private/console-0be5626d4305f192e37e/workspace/heatmap" className="admin-action">Explore the live heatmap<ArrowUpRight size={15}/></Link><Link href="/private/console-0be5626d4305f192e37e/workspace/medical-operations" className="admin-action">Medical operations<ArrowUpRight size={15}/></Link></div>
        </Card>

        <Card title="Priority Actions Queue">
          <div className="space-y-4">
            {[
              { label: 'Pending Verifications', count: data.queue.pendingVerifications, type: 'warning',href:'/private/console-0be5626d4305f192e37e/workspace/users' },
              { label: 'Unresolved Reports', count: data.queue.unresolvedReports, type: 'danger',href:'/private/console-0be5626d4305f192e37e/workspace/reports' },
              { label: 'Organ Requests Review', count: data.queue.organRequestsReview, type: 'danger',href:'/private/operations-1c0fdec8fcca3f8ad2e6/workspace/organ-request' },
              { label: 'Blog Approvals', count: data.queue.blogApprovals, type: 'info',href:'/private/console-0be5626d4305f192e37e/workspace/write-blog' },
            ].map((action) => (
              <Link key={action.href} href={action.href} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                <span className="text-sm font-medium">{action.label}</span>
                <Badge type={action.type as 'warning' | 'danger' | 'info'}>{hasLoaded?action.count:'—'} Items</Badge>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Regional Distribution Preview">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex-1 mr-2">
              <h4 className="text-2xl font-bold">{fmtCount(data.regional.countries)}</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide mt-1">Countries</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex-1 ml-2">
              <h4 className="text-2xl font-bold">{fmtCount(data.regional.cities)}</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide mt-1">Cities</p>
            </div>
          </div>
          <ul className="space-y-3">
            {data.regional.topRegions.length === 0 ? (
              <li className="text-sm text-gray-500 dark:text-slate-400">No regional rows yet.</li>
            ) : (
              data.regional.topRegions.map((row) => (
                <li key={row.country} className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> {row.country}</span>
                  <span className="font-medium text-gray-500 dark:text-slate-400">{fmtCount(row.users)} Users</span>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card title="Recent Live Activity">
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">Loading activities...</p>
            ) : data.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">No recent activity found.</p>
            ) : (
              data.recentActivity.map((feed, i) => (
                <div key={`${feed.type}-${feed.at}-${i}`} className="flex gap-3">
                  <div className="mt-1">
                    <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full ring-4 ring-gray-100 dark:ring-gray-800"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{feed.message}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{new Date(feed.at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
