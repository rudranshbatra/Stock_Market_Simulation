import React from 'react';
import { useApi } from '../hooks/useApi';
import StatCard from '../components/StatCard';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { COLORS, EVENTS } from '../utils/constants';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend 
} from 'recharts';
import { BarChart3, DollarSign, Users, Award, ShieldAlert, ArrowUpRight } from 'lucide-react';

export default function Overview() {
  const { data: summary, loading: sumLoading } = useApi('/api/summary');
  const { data: stocks, loading: stocksLoading } = useApi('/api/stocks');
  const { data: dailyRecords } = useApi('/api/agents/daily');
  const { data: sessions } = useApi('/api/agents/sessions');

  // Format stock data for price timeline
  const stockChartData = React.useMemo(() => {
    if (!stocks || !Array.isArray(stocks)) return [];
    return stocks.map((s, idx) => ({
      index: idx,
      label: `D${s.day} S${s.session}`,
      day: s.day,
      session: s.session,
      'Stock A': s.stockA,
      'Stock B': s.stockB,
    }));
  }, [stocks]);

  // Aggregate orders by day for trade volume
  const volumeByDay = React.useMemo(() => {
    if (!sessions || !Array.isArray(sessions)) return [];
    const counts = {};
    sessions.forEach((s) => {
      const d = s.day || 0;
      counts[d] = (counts[d] || 0) + (s.orderType !== 'no' && s.orderQuantity > 0 ? s.orderQuantity : 1);
    });
    return Object.entries(counts)
      .map(([day, volume]) => ({ day: Number(day), volume }))
      .sort((a, b) => a.day - b.day);
  }, [sessions]);

  // Aggregate loans by day
  const loansByDay = React.useMemo(() => {
    if (!dailyRecords || !Array.isArray(dailyRecords)) return [];
    const totals = {};
    dailyRecords.forEach((r) => {
      const d = r.day || 0;
      totals[d] = (totals[d] || 0) + (r.loanTaken === 'yes' ? (r.loanAmount || 1) : 0);
    });
    return Object.entries(totals)
      .map(([day, amount]) => ({ day: Number(day), amount }))
      .sort((a, b) => a.day - b.day);
  }, [dailyRecords]);

  // Recent order sample
  const recentOrders = React.useMemo(() => {
    if (!sessions || !Array.isArray(sessions)) return [];
    return sessions
      .filter((s) => s.orderType && s.orderType !== 'no')
      .slice(-6)
      .reverse();
  }, [sessions]);

  if (sumLoading || stocksLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-[#94a3b8] font-mono">Loading market intelligence...</p>
        </div>
      </div>
    );
  }

  const avgPrice = summary ? ((summary.avgStockAPrice + summary.avgStockBPrice) / 2) : 35;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Trades Executed"
          value={formatNumber(summary?.totalTrades || 0)}
          change={12.4}
          subtitle="Multi-agent order book matches"
          icon={BarChart3}
          color="blue"
        />
        <StatCard
          title="Avg Market Price"
          value={formatCurrency(avgPrice)}
          change={-2.3}
          subtitle="Combined benchmark valuation"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Active Autonomous Agents"
          value={`${summary?.activeAgents || 50}/50`}
          change="100%"
          subtitle="Simulating concurrent trading"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Top Alpha Performer"
          value={`Agent #${summary?.topAgent ?? 23}`}
          change={142.6}
          subtitle="Highest portfolio valuation"
          icon={Award}
          color="amber"
        />
      </div>

      {/* Main Stock Price Chart */}
      <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#334155]/60 mb-5 gap-3">
          <div>
            <h2 className="text-base font-bold text-[#f8fafc] flex items-center gap-2">
              Stock Price Timeline
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Multi-Agent Valuation
              </span>
            </h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Comparative session pricing for Stock A vs Stock B with central bank policy markers
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-[#94a3b8]">Stock A:</span>
              <span className="text-white font-bold">{formatCurrency(summary?.latestStockAPrice || 30)}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-[#94a3b8]">Stock B:</span>
              <span className="text-white font-bold">{formatCurrency(summary?.latestStockBPrice || 40)}</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="label" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                domain={['auto', 'auto']}
                tickFormatter={(v) => `$${v}`}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '8px', 
                  fontSize: '12px',
                  color: '#f8fafc' 
                }} 
              />
              <Legend verticalAlign="top" height={36} />

              {/* Event markers */}
              {EVENTS.map((ev) => (
                <ReferenceLine
                  key={ev.day}
                  x={`D${ev.day} S1`}
                  stroke={ev.type === 'rate_cut' ? '#10b981' : '#ef4444'}
                  strokeDasharray="4 4"
                  label={{
                    value: ev.label,
                    fill: ev.type === 'rate_cut' ? '#10b981' : '#ef4444',
                    fontSize: 10,
                    position: 'top',
                  }}
                />
              ))}

              <Line 
                type="monotone" 
                dataKey="Stock A" 
                stroke="#3b82f6" 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: '#3b82f6' }}
                activeDot={{ r: 6, fill: '#60a5fa' }} 
              />
              <Line 
                type="monotone" 
                dataKey="Stock B" 
                stroke="#10b981" 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 6, fill: '#34d399' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two side-by-side charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Order Volume */}
        <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#f8fafc]">Trading Activity by Day</h3>
              <p className="text-xs text-[#94a3b8]">Volume of placed orders across trading sessions</p>
            </div>
            <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Aggregated Volume
            </span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeByDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickFormatter={(d) => `Day ${d}`} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
                />
                <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loan Activity */}
        <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#f8fafc]">Leverage & Loan Activity</h3>
              <p className="text-xs text-[#94a3b8]">Agent borrowing volume driven by interest rates</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Liquidity Injections
            </span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={loansByDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickFormatter={(d) => `Day ${d}`} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#emeraldGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Agent Order Telemetry Table */}
      <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h3 className="text-sm font-bold text-[#f8fafc]">Live Autonomous Agent Order Telemetry</h3>
          </div>
          <span className="text-xs text-[#64748b] font-mono">Recent Orders Sample</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#334155] text-[#94a3b8] uppercase font-mono text-[10px]">
                <th className="py-2.5 px-3">Agent</th>
                <th className="py-2.5 px-3">Day / Session</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Asset</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3 text-right">Order Price</th>
                <th className="py-2.5 px-3 text-right">Cash Pre-Trade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/40 font-mono">
              {recentOrders.length > 0 ? (
                recentOrders.map((ord, idx) => (
                  <tr key={idx} className="hover:bg-[#1e293b]/50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-blue-400">Agent #{ord.agentId}</td>
                    <td className="py-2.5 px-3 text-[#94a3b8]">Day {ord.day} • S{ord.session}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.orderType?.toLowerCase() === 'buy'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {ord.orderType?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">Stock {ord.orderStock}</td>
                    <td className="py-2.5 px-3 text-right text-[#f8fafc]">{formatNumber(ord.orderQuantity)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">${ord.orderPrice?.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-[#94a3b8]">{formatCurrency(ord.cash)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#64748b]">
                    No active trade orders in session records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
