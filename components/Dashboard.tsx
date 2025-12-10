import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { DollarSign, CheckCircle, Clock, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { DashboardStats } from '../types';

const data = [
  { name: 'Mon', tickets: 40, autoResolved: 24, escalated: 2 },
  { name: 'Tue', tickets: 55, autoResolved: 30, escalated: 4 },
  { name: 'Wed', tickets: 48, autoResolved: 35, escalated: 1 },
  { name: 'Thu', tickets: 62, autoResolved: 45, escalated: 3 },
  { name: 'Fri', tickets: 70, autoResolved: 50, escalated: 5 },
  { name: 'Sat', tickets: 30, autoResolved: 20, escalated: 0 },
  { name: 'Sun', tickets: 25, autoResolved: 18, escalated: 0 },
];

const categoryData = [
  { name: 'Billing', value: 35, color: '#6366f1' },
  { name: 'Tech Support', value: 45, color: '#3b82f6' },
  { name: 'Feature Req', value: 15, color: '#10b981' },
  { name: 'Sales', value: 5, color: '#f59e0b' },
];

interface DashboardProps {
  stats: DashboardStats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Cost Saved" 
          value={`$${stats.costSaved.toLocaleString()}`} 
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />} 
          change="+12% vs last week"
          trend="up"
        />
        <StatCard 
          title="Auto-Resolved" 
          value={stats.ticketsResolved.toString()} 
          icon={<CheckCircle className="w-5 h-5 text-blue-600" />} 
          change="68% automation rate"
          trend="up"
        />
        <StatCard 
          title="Avg Resolution" 
          value={stats.avgResponseTime} 
          icon={<Clock className="w-5 h-5 text-indigo-600" />} 
          change="-25% faster"
          trend="up"
        />
        <StatCard 
          title="CSAT Score" 
          value={stats.csatScore.toFixed(1)} 
          icon={<Users className="w-5 h-5 text-purple-600" />} 
          change="4.8/5.0 target"
          trend="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-500" />
            Ticket Volume & Automation
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAuto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Area type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTickets)" name="Total Tickets" />
                <Area type="monotone" dataKey="autoResolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAuto)" name="AI Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Ticket Categories</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, change, trend }: any) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
      </div>
      <div className="p-2 bg-slate-50 rounded-lg">
        {icon}
      </div>
    </div>
    <div className="flex items-center gap-1">
       <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'}`}>
         {change}
       </span>
    </div>
  </div>
);

export default Dashboard;