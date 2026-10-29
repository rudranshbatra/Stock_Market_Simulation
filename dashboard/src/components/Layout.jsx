import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  BrainCircuit, 
  PlayCircle, 
  Activity, 
  ShieldCheck,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';

export default function Layout({ children }) {
  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Market Analysis', path: '/market', icon: BarChart3 },
    { name: 'Agent Explorer', path: '/agents', icon: Users },
    { name: 'Predictions', path: '/predictions', icon: BrainCircuit },
    { name: 'Playback', path: '/playback', icon: PlayCircle },
  ];

  return (
    <div className="flex h-screen bg-[#0b1326] text-[#f8fafc] overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#090d16] border-r border-[#334155] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-5 border-b border-[#334155]">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <TrendingUp size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-wide text-white flex items-center gap-2">
                  StockAgent
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Pro
                  </span>
                </h1>
                <p className="text-[11px] text-[#64748b] font-mono">Terminal v4.2</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 shadow-sm shadow-blue-500/10'
                        : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b]/60'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* System & Market Status footer */}
        <div className="p-4 border-t border-[#334155] space-y-3">
          <div className="bg-[#0f172a] rounded-lg p-3 border border-[#334155]/70 text-xs">
            <div className="flex items-center justify-between text-[#94a3b8] mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Engine Ready
              </span>
              <span className="font-mono text-[10px] text-emerald-400">12ms</span>
            </div>
            <p className="text-[#64748b] text-[11px] leading-relaxed">
              Multi-Agent LLM Trading Simulation • 50 Traders
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-[#64748b] px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-blue-400" />
              Audit Verified
            </span>
            <span className="font-mono text-[10px]">v4.2.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-[#090d16]/90 backdrop-blur border-b border-[#334155] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-[#94a3b8]">PORTFOLIO SIM:</span>
              <span className="text-emerald-400 font-bold">$38.42M</span>
              <span className="text-emerald-500 text-[10px]">+4.8%</span>
            </div>
            <div className="h-4 w-px bg-[#334155]"></div>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-[#94a3b8]">HORIZON:</span>
              <span className="text-[#f8fafc]">264 Trading Days</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">
              <Activity size={12} />
              API Connected (:5000)
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0b1326]">
          {children}
        </main>
      </div>
    </div>
  );
}
