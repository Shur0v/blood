'use client';

import React from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import {
  Users, UserCheck, UserMinus, HeartPulse,
  ShieldAlert, Database, FileText, TrendingUp, Activity, Plus, AlertTriangle
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
        setData(emptyPayload);
        return;
      }
      setData(payload.data as OverviewPayload);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadOverview();
    const timer = setInterval(() => {
      void loadOverview();
    }, 10000);
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
          <h2 className="text-2xl font-bold">Platform Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time health and analytics of the donation network.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadOverview()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
          >
            <Plus size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="p-5 flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{kpi.title}</p>
                <h3 className="text-2xl font-bold">{kpi.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-800 ${kpi.color}`}>
                <Icon size={20} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Traffic & Engagement" className="lg:col-span-2">
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-red-50 to-transparent dark:from-red-500/5"></div>
            <TrendingUp size={48} className="text-red-200 dark:text-red-500/20 mb-2" />
            <p className="text-gray-400 font-medium">Live Traffic Snapshot</p>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Today&apos;s Clicks</p>
              <p className="text-lg font-bold">{fmtCount(data.traffic.todayClicks)}</p>
            </div>
            <div className="text-center border-l border-r border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-500">Weekly Clicks</p>
              <p className="text-lg font-bold">{fmtCount(data.traffic.weekClicks)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Top CTA</p>
              <p className="text-lg font-bold text-red-500">{data.traffic.topCTA}</p>
            </div>
          </div>
        </Card>

        <Card title="Priority Actions Queue">
          <div className="space-y-4">
            {[
              { label: 'Pending Verifications', count: data.queue.pendingVerifications, type: 'warning' },
              { label: 'Unresolved Reports', count: data.queue.unresolvedReports, type: 'danger' },
              { label: 'Organ Requests Review', count: data.queue.organRequestsReview, type: 'danger' },
              { label: 'Blog Approvals', count: data.queue.blogApprovals, type: 'info' },
            ].map((action, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer">
                <span className="text-sm font-medium">{action.label}</span>
                <Badge type={action.type as 'warning' | 'danger' | 'info'}>{action.count} Items</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Regional Distribution Preview">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex-1 mr-2">
              <h4 className="text-2xl font-bold">{fmtCount(data.regional.countries)}</h4>
              <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Countries</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex-1 ml-2">
              <h4 className="text-2xl font-bold">{fmtCount(data.regional.cities)}</h4>
              <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Cities</p>
            </div>
          </div>
          <ul className="space-y-3">
            {data.regional.topRegions.length === 0 ? (
              <li className="text-sm text-gray-500">No regional rows yet.</li>
            ) : (
              data.regional.topRegions.map((row) => (
                <li key={row.country} className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> {row.country}</span>
                  <span className="font-medium text-gray-500">{fmtCount(row.users)} Users</span>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card title="Recent Live Activity">
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading activities...</p>
            ) : data.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity found.</p>
            ) : (
              data.recentActivity.map((feed, i) => (
                <div key={`${feed.type}-${feed.at}-${i}`} className="flex gap-3">
                  <div className="mt-1">
                    <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full ring-4 ring-gray-100 dark:ring-gray-800"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{feed.message}</p>
                    <p className="text-xs text-gray-500">{new Date(feed.at).toLocaleString()}</p>
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
