import React, { useState } from 'react';
import { LayoutDashboard, MessageSquareText, Phone, Settings, Menu, Bell } from 'lucide-react';
import Dashboard from './components/Dashboard';
import TicketWorkspace from './components/TicketWorkspace';
import VoiceAgent from './components/VoiceAgent';
import { Ticket, TicketStatus, TicketPriority, Channel, Sentiment } from './types';

// Mock Data Initialization
const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TCK-2942',
    subject: 'Billing discrepancy in March invoice',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@techcorp.io',
    status: TicketStatus.OPEN,
    priority: TicketPriority.HIGH,
    channel: Channel.EMAIL,
    createdAt: new Date(),
    messages: [
      { id: '1', sender: 'user', content: 'Hi, I just saw my invoice for March and it is double what I usually pay. This is unacceptable. Please fix this immediately or I am cancelling.', timestamp: new Date() }
    ]
  },
  {
    id: 'TCK-2943',
    subject: 'Feature Request: Dark Mode',
    customerName: 'Mike Chen',
    customerEmail: 'mike@designstudio.com',
    status: TicketStatus.OPEN,
    priority: TicketPriority.LOW,
    channel: Channel.CHAT,
    createdAt: new Date(),
    messages: [
      { id: '2', sender: 'user', content: 'Hey team, love the tool. Any ETA on dark mode? My eyes are killing me.', timestamp: new Date() }
    ]
  },
  {
    id: 'TCK-2944',
    subject: 'API Connection Failed',
    customerName: 'DevOps Team',
    customerEmail: 'alerts@startup.com',
    status: TicketStatus.OPEN,
    priority: TicketPriority.CRITICAL,
    channel: Channel.EMAIL,
    createdAt: new Date(),
    messages: [
      { id: '3', sender: 'user', content: 'Urgent: Production API is returning 500 errors on the /users endpoint since 2am UTC.', timestamp: new Date() }
    ]
  }
];

const INITIAL_STATS = {
  ticketsResolved: 1248,
  avgResponseTime: '1m 42s',
  csatScore: 4.8,
  costSaved: 14500
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets' | 'voice' | 'settings'>('dashboard');
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [stats, setStats] = useState(INITIAL_STATS);

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    
    // Simulate updating stats if ticket resolved (mock logic)
    if (updatedTicket.status === TicketStatus.RESOLVED) {
       setStats(prev => ({
         ...prev,
         ticketsResolved: prev.ticketsResolved + 1,
         costSaved: prev.costSaved + 12
       }));
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 transition-all duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
          <span className="text-white font-semibold text-lg tracking-tight">SupportCopilot</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<MessageSquareText />} 
            label="Inbox" 
            active={activeTab === 'tickets'} 
            onClick={() => setActiveTab('tickets')}
            badge={tickets.length}
          />
          <NavItem 
            icon={<Phone />} 
            label="Voice Agent" 
            active={activeTab === 'voice'} 
            onClick={() => setActiveTab('voice')} 
          />
          <div className="pt-4 mt-4 border-t border-slate-700/50">
             <NavItem 
              icon={<Settings />} 
              label="Settings" 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
            />
          </div>
        </nav>

        <div className="p-4 bg-slate-800/50 m-3 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              JD
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Jane Doe</p>
              <p className="text-xs text-slate-400 truncate">Senior Agent</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center shrink-0">
          <h1 className="text-xl font-semibold text-slate-800">
            {activeTab === 'dashboard' && 'Operations Overview'}
            {activeTab === 'tickets' && 'Support Workspace'}
            {activeTab === 'voice' && 'Voice Channel'}
            {activeTab === 'settings' && 'System Configuration'}
          </h1>
          <div className="flex items-center gap-4">
             <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
                + New Ticket
             </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'dashboard' && <Dashboard stats={stats} />}
          {activeTab === 'tickets' && <TicketWorkspace tickets={tickets} onUpdateTicket={handleUpdateTicket} />}
          {activeTab === 'voice' && <VoiceAgent />}
          {activeTab === 'settings' && (
            <div className="flex items-center justify-center h-full text-slate-400">
              Settings Panel Placeholder
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick, badge }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-3">
      {React.cloneElement(icon, { size: 20, className: active ? 'text-white' : 'text-slate-400 group-hover:text-white' })}
      <span className="text-sm font-medium">{label}</span>
    </div>
    {badge && (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
        active ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
      }`}>
        {badge}
      </span>
    )}
  </button>
);

export default App;