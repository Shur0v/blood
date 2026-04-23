'use client';

import React from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { MousePointerClick, ChevronDown, SplitSquareVertical, Activity, MonitorSmartphone, Monitor, Smartphone } from 'lucide-react';

type DeviceFilter = 'all' | 'desktop' | 'tablet' | 'mobile';

interface HeatmapPoint {
  x: number;
  y: number;
  device: string;
  at: string;
}

interface HeatmapPayload {
  selected: { page: string; device: DeviceFilter; days: number };
  metrics: {
    totalPoints: number;
    recentPoints: number;
    sessionsProxy: number;
    avgScrollDepth: number;
    topZone: string;
  };
  points: HeatmapPoint[];
  zones: {
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
  };
  deviceSplit: Array<{ device: string; clicks: number; percent: number }>;
  pageOptions: Array<{ page: string; count: number }>;
}

const emptyPayload: HeatmapPayload = {
  selected: { page: 'home', device: 'all', days: 7 },
  metrics: { totalPoints: 0, recentPoints: 0, sessionsProxy: 0, avgScrollDepth: 0, topZone: 'No Data' },
  points: [],
  zones: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
  deviceSplit: [],
  pageOptions: [],
};

export default function HeatmapPage() {
  const [selectedPage, setSelectedPage] = React.useState('home');
  const [selectedDevice, setSelectedDevice] = React.useState<DeviceFilter>('all');
  const [days, setDays] = React.useState(7);
  const [data, setData] = React.useState<HeatmapPayload>(emptyPayload);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadHeatmap = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: selectedPage,
        device: selectedDevice,
        days: String(days),
        limit: '800',
      });
      const res = await fetch(`/api/admin/analytics/heatmap?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        setData(emptyPayload);
        return;
      }
      setData(payload.data as HeatmapPayload);
    } finally {
      setIsLoading(false);
    }
  }, [days, selectedDevice, selectedPage]);

  React.useEffect(() => {
    void loadHeatmap();
    const timer = setInterval(() => {
      void loadHeatmap();
    }, 10000);
    return () => clearInterval(timer);
  }, [loadHeatmap]);

  const pageOptions = data.pageOptions.length > 0 ? data.pageOptions : [{ page: selectedPage, count: 0 }];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Heatmap Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Real click-density visualization using tracked interaction coordinates.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm flex items-center gap-2 shadow-sm">
            <span className="font-semibold">Live Mode</span>
            <SplitSquareVertical size={16} className="text-gray-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-0">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tracked Page Selector</label>
              <div className="relative">
                <select
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm appearance-none"
                >
                  {pageOptions.map((row) => (
                    <option key={row.page} value={row.page}>
                      {row.page} ({row.count})
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Heatmap Type</label>
              <button className="w-full flex items-center gap-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-lg text-sm font-medium transition">
                <MousePointerClick size={16} /> Click Heatmap
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Device Target</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                {[
                  { key: 'all', icon: <MonitorSmartphone size={18} />, title: 'All' },
                  { key: 'desktop', icon: <Monitor size={18} />, title: 'Desktop' },
                  { key: 'tablet', icon: <MonitorSmartphone size={18} />, title: 'Tablet' },
                  { key: 'mobile', icon: <Smartphone size={18} />, title: 'Mobile' },
                ].map((item) => (
                  <button
                    key={item.key}
                    title={item.title}
                    onClick={() => setSelectedDevice(item.key as DeviceFilter)}
                    className={`flex-1 flex justify-center py-2 transition ${
                      selectedDevice === item.key
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {item.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Timeframe</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value={1}>Last 24 Hours</option>
                <option value={7}>Last 7 Days</option>
                <option value={14}>Last 14 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>
          </Card>

          <Card title="Analytics for Selection">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Heat Points</p>
                <p className="text-xl font-bold">{data.metrics.totalPoints.toLocaleString()}</p>
              </div>
              <hr className="border-gray-100 dark:border-gray-800" />
              <div>
                <p className="text-sm text-gray-500">Average Scroll Depth</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, data.metrics.avgScrollDepth))}%` }} />
                  </div>
                  <span className="text-sm font-bold">{data.metrics.avgScrollDepth}%</span>
                </div>
              </div>
              <hr className="border-gray-100 dark:border-gray-800" />
              <div>
                <p className="text-sm text-gray-500">Top Interaction Zone</p>
                <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-1">{data.metrics.topZone}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="p-0 border-gray-800 bg-[#0a0a0c] overflow-hidden flex flex-col h-[800px]">
            <div className="p-3 border-b border-gray-800 bg-[#111115] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-gray-500 ml-2 font-mono">
                  /{selectedPage} / {selectedDevice.toUpperCase()} / Click Mode
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-blue-500">Cold</span>
                <div className="w-24 h-2 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full"></div>
                <span className="text-red-500">Hot</span>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden bg-[#0f1115]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                  Loading heatmap points...
                </div>
              ) : data.points.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center px-8">
                  <div>
                    <p className="text-gray-300 font-semibold">No heatmap data found for this selection.</p>
                    <p className="text-gray-500 text-sm mt-2">Clicks will appear here once users interact with this page.</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0">
                  {data.points.map((point, index) => (
                    <div
                      key={`${point.at}-${index}`}
                      className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/30 shadow-[0_0_18px_rgba(239,68,68,0.9)]"
                      style={{
                        left: `${point.x * 100}%`,
                        top: `${point.y * 100}%`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
