'use client';

import React from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Table, TableRow, TableCell } from '@/src/admin-dashboard/components/common/Table';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { Activity, TrendingUp, Monitor, Smartphone, Tablet, Sparkles } from 'lucide-react';

interface AnalyticsPayload {
  summary: {
    today: number;
    yesterday: number;
    week: number;
    prevWeek: number;
    month: number;
    prevMonth: number;
    year: number;
    prevYear: number;
    trends: {
      today: number;
      week: number;
      month: number;
      year: number;
    };
  };
  trend: Array<{ day: string; count: number }>;
  deviceSplit: Array<{ device: string; clicks: number; percent: number }>;
  topSections: Array<{ component: string; clicks: number }>;
  detailed: Array<{
    page: string;
    component: string;
    clickCount: number;
    dailyChange: number;
    weeklyChange: number;
    trend: 'up' | 'down';
  }>;
}

const formatCount = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
};

const formatTrend = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const emptyAnalytics: AnalyticsPayload = {
  summary: {
    today: 0,
    yesterday: 0,
    week: 0,
    prevWeek: 0,
    month: 0,
    prevMonth: 0,
    year: 0,
    prevYear: 0,
    trends: { today: 0, week: 0, month: 0, year: 0 },
  },
  trend: [],
  deviceSplit: [],
  topSections: [],
  detailed: [],
};

export default function ClickAnalyticsPage() {
  const [analytics, setAnalytics] = React.useState<AnalyticsPayload>(emptyAnalytics);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadAnalytics = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics/clicks', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        return;
      }
      setAnalytics(payload.data as AnalyticsPayload);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAnalytics();
    const timer = setInterval(() => {
      void loadAnalytics();
    }, 10000);
    return () => clearInterval(timer);
  }, [loadAnalytics]);

  const maxTrend = analytics.trend.reduce((max, row) => Math.max(max, row.count), 1);
  const maxTopSection = analytics.topSections.reduce((max, row) => Math.max(max, row.clicks), 1);
  const getDevice = (name: string) => {
    const key = name.toLowerCase();
    if (key === 'mobile') return { icon: <Smartphone size={18} />, label: 'Mobile' };
    if (key === 'tablet') return { icon: <Tablet size={18} />, label: 'Tablet' };
    return { icon: <Monitor size={18} />, label: 'Desktop' };
  };
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-2xl font-bold">Component Click Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">Deep-dive tracking of user interactions across all UI components and sections.</p>
      </div>

      {/* Main summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Today', val: analytics.summary.today, trend: `${formatTrend(analytics.summary.trends.today)} vs yesterday` },
          { label: 'This Week', val: analytics.summary.week, trend: `${formatTrend(analytics.summary.trends.week)} vs last week` },
          { label: 'This Month', val: analytics.summary.month, trend: `${formatTrend(analytics.summary.trends.month)} vs last month` },
          { label: 'This Year', val: analytics.summary.year, trend: `${formatTrend(analytics.summary.trends.year)} vs last year` },
        ].map((stat, i) => (
          <Card key={i} className="p-5 border-l-4 border-l-red-500 rounded-lg">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</h4>
            <p className="text-3xl font-bold">{formatCount(stat.val)}</p>
            <p className="text-xs text-emerald-500 font-medium mt-2 flex items-center gap-1"><TrendingUp size={12}/> {stat.trend}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <Card title="Click Volume Trend (Last 14 Days)" className="col-span-2">
           <div className="h-64 bg-gray-50 dark:bg-[#0f1115] border border-dashed border-gray-200 dark:border-gray-800 rounded-xl relative p-4">
             {analytics.trend.length === 0 ? (
               <div className="h-full flex items-center justify-center">
                 <p className="text-gray-400 font-medium">No click data yet. Start clicking the site to build analytics.</p>
               </div>
             ) : (
               <div className="h-full flex items-end gap-2">
                 {analytics.trend.map((point) => (
                   <div key={point.day} className="flex-1 flex flex-col items-center justify-end gap-2">
                     <div
                       className="w-full rounded-t bg-gradient-to-t from-red-500 to-red-300 min-h-[4px]"
                       style={{ height: `${Math.max(4, Math.round((point.count / maxTrend) * 180))}px` }}
                       title={`${point.day}: ${point.count.toLocaleString()} clicks`}
                     />
                     <span className="text-[10px] text-gray-500">{point.day.slice(5)}</span>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </Card>

        {/* AI Insights Proxy UI */}
        <Card title="AI Interaction Insights" className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <Sparkles className="text-blue-500 shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-gray-700 dark:text-gray-300">Top clicked section this month: <span className="font-bold text-blue-600 dark:text-blue-400">{analytics.topSections[0]?.component || 'N/A'}</span>.</p>
            </div>
            <div className="flex gap-3 items-start">
              <Sparkles className="text-blue-500 shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-gray-700 dark:text-gray-300">Today recorded <span className="font-bold text-blue-600 dark:text-blue-400">{analytics.summary.today.toLocaleString()}</span> total clicks across tracked components.</p>
            </div>
            <div className="flex gap-3 items-start">
              <Sparkles className="text-blue-500 shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-gray-700 dark:text-gray-300">{analytics.deviceSplit[0]?.device || 'Device'} currently leads interactions at <span className="font-bold text-blue-600 dark:text-blue-400">{analytics.deviceSplit[0]?.percent ?? 0}%</span>.</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Device Split" className="p-0">
          <div className="p-6 pb-2">
            {analytics.deviceSplit.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">No device data yet.</p>
            ) : (
              analytics.deviceSplit.map((row) => {
                const meta = getDevice(row.device);
                return (
                  <div key={row.device} className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 text-gray-600">{meta.icon}{meta.label}</div>
                    <span className="font-bold">{row.percent}%</span>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card title="Top Sections Ranked" className="md:col-span-2">
           <div className="space-y-3">
             {analytics.topSections.length === 0 ? (
              <p className="text-sm text-gray-500">No section ranking data yet.</p>
             ) : (
              analytics.topSections.map((section, index) => (
                <div key={section.component} className="flex items-center justify-between">
                  <span className="font-medium text-sm">{section.component}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${Math.max(8, Math.round((section.clicks / maxTopSection) * 100))}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{formatCount(section.clicks)}</span>
                  </div>
                </div>
              ))
             )}
           </div>
        </Card>
      </div>

      {/* Deep Section-wise Table */}
      <h3 className="text-xl font-bold pt-4">Detailed Component Tracking</h3>
      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-[#1a1b23]">
        <Table headers={['Page', 'Section/Component', 'Click Count', 'Daily Change', 'Weekly Change', 'Trend']}>
          {isLoading ? (
            <TableRow>
              <TableCell>Loading...</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
          ) : analytics.detailed.length === 0 ? (
            <TableRow>
              <TableCell>No data yet</TableCell>
              <TableCell>Start interacting with the website</TableCell>
              <TableCell>0</TableCell>
              <TableCell><Badge type="default">0%</Badge></TableCell>
              <TableCell><Badge type="default">0%</Badge></TableCell>
              <TableCell><TrendingUp size={16} className="text-gray-400"/></TableCell>
            </TableRow>
          ) : (
            analytics.detailed.map((row) => (
              <TableRow key={`${row.page}-${row.component}`}>
                <TableCell>{row.page}</TableCell>
                <TableCell className="font-medium text-blue-600">{row.component}</TableCell>
                <TableCell>{row.clickCount.toLocaleString()}</TableCell>
                <TableCell><Badge type={row.dailyChange >= 0 ? 'success' : 'danger'}>{formatTrend(row.dailyChange)}</Badge></TableCell>
                <TableCell><Badge type={row.weeklyChange >= 0 ? 'success' : 'danger'}>{formatTrend(row.weeklyChange)}</Badge></TableCell>
                <TableCell><TrendingUp size={16} className={row.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}/></TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </div>
    </div>
  );
}
