'use client';

import React from 'react';
import { Card } from '@/src/admin-dashboard/components/common/Card';
import { Badge } from '@/src/admin-dashboard/components/common/Badge';
import { 
  Users, UserCheck, UserMinus, HeartPulse, 
  ShieldAlert, Database, FileText, MousePointerClick,
  TrendingUp, Activity, Plus 
} from 'lucide-react';

export default function DashboardOverview() {
  const KPIS = [
    { title: 'Total Registered Users', value: '24,592', change: '+12%', icon: Users, color: 'text-blue-500' },
    { title: 'Total Active Donors', value: '18,204', change: '+5%', icon: UserCheck, color: 'text-green-500' },
    { title: 'Total Inactive Donors', value: '4,051', change: '-2%', icon: UserMinus, color: 'text-gray-500' },
    { title: 'Organ Registry Entries', value: '3,210', change: '+18%', icon: HeartPulse, color: 'text-red-500' },
    { title: 'Pending Verifications', value: '142', change: 'Urgent', icon: ShieldAlert, color: 'text-amber-500' },
    { title: 'Pending Organ Requests', value: '7', change: 'Critical', icon: Database, color: 'text-red-600' },
    { title: 'Reports Submitted', value: '24', change: '-10%', icon: AlertTriangleIcon, color: 'text-orange-500' },
    { title: 'Pending Blogs', value: '11', change: 'Action Required', icon: FileText, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Head */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Platform Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time health and analytics of the donation network.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
            <Plus size={16} /> Quick Actions
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="p-5 flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{kpi.title}</p>
                <h3 className="text-2xl font-bold">{kpi.value}</h3>
                <p className={`text-xs mt-2 font-medium ${kpi.change.includes('+') ? 'text-emerald-500' : kpi.change.includes('-') ? 'text-red-500' : 'text-amber-500'}`}>
                  {kpi.change}
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-800 ${kpi.color}`}>
                <Icon size={20} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart / Traffic Area */}
        <Card title="Traffic & Engagement" className="lg:col-span-2">
           <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl relative overflow-hidden">
             {/* Chart Placeholder UI */}
             <div className="absolute inset-0 bg-gradient-to-t from-red-50 to-transparent dark:from-red-500/5"></div>
             <TrendingUp size={48} className="text-red-200 dark:text-red-500/20 mb-2" />
             <p className="text-gray-400 font-medium">Traffic Line Chart Render Area</p>
           </div>
           <div className="grid grid-cols-3 gap-4 mt-6">
             <div className="text-center">
               <p className="text-sm text-gray-500">Today's Clicks</p>
               <p className="text-lg font-bold">12,450</p>
             </div>
             <div className="text-center border-l border-r border-gray-100 dark:border-gray-800">
               <p className="text-sm text-gray-500">Weekly Clicks</p>
               <p className="text-lg font-bold">84,921</p>
             </div>
             <div className="text-center">
               <p className="text-sm text-gray-500">Top CTA</p>
               <p className="text-lg font-bold text-red-500">Donate Now</p>
             </div>
           </div>
        </Card>

        {/* Priority Actions */}
        <Card title="Priority Actions Queue">
          <div className="space-y-4">
            {[
              { label: 'Pending Verifications', count: 142, type: 'warning' },
              { label: 'Unresolved Reports', count: 24, type: 'danger' },
              { label: 'Organ Requests Review', count: 7, type: 'danger' },
              { label: 'Blog Approvals', count: 11, type: 'info' }
            ].map((action, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer">
                <span className="text-sm font-medium">{action.label}</span>
                <Badge type={action.type as any}>{action.count} Items</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Summary */}
        <Card title="Regional Distribution Preview">
           <div className="flex items-center justify-between mb-4">
             <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex-1 mr-2">
               <h4 className="text-2xl font-bold">42</h4>
               <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Countries</p>
             </div>
             <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex-1 ml-2">
               <h4 className="text-2xl font-bold">1,204</h4>
               <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Cities</p>
             </div>
           </div>
           <ul className="space-y-3">
             <li className="flex justify-between items-center text-sm">
               <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> United States</span>
               <span className="font-medium text-gray-500">12,400 Donors</span>
             </li>
             <li className="flex justify-between items-center text-sm">
               <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400"></span> Bangladesh</span>
               <span className="font-medium text-gray-500">8,200 Donors</span>
             </li>
             <li className="flex justify-between items-center text-sm">
               <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-300"></span> United Kingdom</span>
               <span className="font-medium text-gray-500">3,100 Donors</span>
             </li>
           </ul>
        </Card>

        {/* Activity Feed */}
        <Card title="Recent Live Activity">
          <div className="space-y-4">
            {[
              { msg: 'New manual donor added (City: Dhaka)', time: '2 mins ago', icon: Activity },
              { msg: 'User verification submitted (ID: #4092)', time: '14 mins ago', icon: ShieldAlert },
              { msg: 'Organ Request approved by Admin A', time: '1 hour ago', icon: HeartPulse },
              { msg: 'Blog submission "Why O- is crucial" received', time: '3 hours ago', icon: FileText }
            ].map((feed, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1">
                  <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full ring-4 ring-gray-100 dark:ring-gray-800"></div>
                </div>
                <div>
                  <p className="text-sm font-medium">{feed.msg}</p>
                  <p className="text-xs text-gray-500">{feed.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const AlertTriangleIcon = (props:any) => <AlertTriangle {...props} />;
import { AlertTriangle } from 'lucide-react';
