import React, { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { Search, Trophy, CheckCircle, AlertOctagon, User, ArrowRight } from 'lucide-react';

const AGENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function AgentExplorer() {
  const { data: sessions, loading } = useApi('/api/agents/sessions');

  const [selectedAgentId, setSelectedAgentId] = useState(23);
  const [comparedAgents, setComparedAgents] = useState([23, 7, 41, 12]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('wealth'); // 'wealth', 'roi', 'trades'

  // Aggregate stats per agent
  const agentStats = useMemo(() => {
    if (!sessions || !Array.isArray(sessions)) return [];

    const map = {};
    sessions.forEach((s) => {
      const id = s.agentId;
      if (id === null || id === undefined) return;

      if (!map[id]) {
        map[id] = {
          id,
          firstRecord: s,
          lastRecord: s,
          totalOrders: 0,
          history: [],
        };
      }

      // Track order count
      if (s.orderType && s.orderType !== 'no') {
        map[id].totalOrders++;
      }

      // Save history point
      map[id].history.push({
        day: s.day,
        session: s.session,
        label: `D${s.day}S${s.session}`,
        assets: s.totalAssets,
      });

      // Keep latest record
      const curMax = (map[id].lastRecord.day || 0) * 10 + (map[id].lastRecord.session || 0);
      const newScore = (s.day || 0) * 10 + (s.session || 0);
      if (newScore >= curMax) {
        map[id].lastRecord = s;
      }
    });

    return Object.values(map).map((ag) => {
      const initial = ag.firstRecord.totalAssets || 1_000_000;
      const finalW = ag.lastRecord.totalAssets || 0;
      const roi = initial > 0 ? ((finalW - initial) / initial) * 100 : 0;
      const isBankrupt = finalW < 10_000;

      return {
        id: ag.id,
        initialWealth: initial,
        finalWealth: finalW,
        totalOrders: ag.totalOrders,
        roi,
        status: isBankrupt ? 'Bankrupt' : 'Active',
        cash: ag.lastRecord.cash || 0,
        stockAValue: ag.lastRecord.stockAValue || 0,
        stockBValue: ag.lastRecord.stockBValue || 0,
        history: ag.history,
        lastRecord: ag.lastRecord,
      };
    });
  }, [sessions]);

  // Sort leaderboard
  const sortedLeaderboard = useMemo(() => {
    let list = [...agentStats];
    if (searchTerm) {
      list = list.filter((a) => a.id.toString().includes(searchTerm.trim()));
    }

    if (sortBy === 'wealth') {
      list.sort((a, b) => b.finalWealth - a.finalWealth);
    } else if (sortBy === 'roi') {
      list.sort((a, b) => b.roi - a.roi);
    } else if (sortBy === 'trades') {
      list.sort((a, b) => b.totalOrders - a.totalOrders);
    }

    return list;
  }, [agentStats, searchTerm, sortBy]);

  // Multi-line chart dataset
  const comparisonChartData = useMemo(() => {
    if (!sessions || comparedAgents.length === 0) return [];

    // Map each day/session combo
    const timepoints = {};
    comparedAgents.forEach((agentId) => {
      const agentRecords = sessions.filter((s) => s.agentId === agentId);
      agentRecords.forEach((r) => {
        const key = `D${r.day} S${r.session}`;
        if (!timepoints[key]) {
          timepoints[key] = { label: key, day: r.day, session: r.session };
        }
        timepoints[key][`Agent #${agentId}`] = r.totalAssets;
      });
    });

    return Object.values(timepoints).sort((a, b) => (a.day - b.day) || (a.session - b.session));
  }, [sessions, comparedAgents]);

  // Selected agent details
  const selectedAgent = useMemo(() => {
    return agentStats.find((a) => a.id === selectedAgentId) || agentStats[0];
  }, [agentStats, selectedAgentId]);

  // Selected agent recent orders
  const selectedAgentOrders = useMemo(() => {
    if (!sessions) return [];
    return sessions
      .filter((s) => s.agentId === selectedAgentId && s.orderType && s.orderType !== 'no')
      .slice(-4)
      .reverse();
  }, [sessions, selectedAgentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const toggleCompare = (id) => {
    if (comparedAgents.includes(id)) {
      if (comparedAgents.length > 1) {
        setComparedAgents(comparedAgents.filter((a) => a !== id));
      }
    } else {
      if (comparedAgents.length < 5) {
        setComparedAgents([...comparedAgents, id]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#f8fafc]">Agent Explorer & Strategy Benchmarking</h2>
          <p className="text-xs text-[#94a3b8] mt-1">
            Compare individual agent wealth accumulation trajectories, alpha generation, and trading styles.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[#64748b]" />
            <input
              type="text"
              placeholder="Filter by Agent ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0f172a] border border-[#334155] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-[#f8fafc] focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="wealth">Sort: Final Wealth</option>
            <option value="roi">Sort: ROI %</option>
            <option value="trades">Sort: Total Orders</option>
          </select>
        </div>
      </div>

      {/* Multi-line Wealth Comparison Chart */}
      <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#334155]/60 mb-4 gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#f8fafc]">Agent Wealth Comparison (Comparative Trajectory)</h3>
            <p className="text-xs text-[#94a3b8]">Select up to 5 agents from the leaderboard below to overlay</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {comparedAgents.map((id, idx) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold"
                style={{
                  backgroundColor: `${AGENT_COLORS[idx % AGENT_COLORS.length]}20`,
                  color: AGENT_COLORS[idx % AGENT_COLORS.length],
                  border: `1px solid ${AGENT_COLORS[idx % AGENT_COLORS.length]}50`,
                }}
              >
                Agent #{id}
                <button
                  onClick={() => toggleCompare(id)}
                  className="hover:opacity-75 ml-1 text-xs"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparisonChartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickFormatter={(v) => formatCurrency(v)} 
                domain={['auto', 'auto']} 
              />
              <Tooltip 
                formatter={(val) => formatCurrency(val)}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
              />
              <Legend verticalAlign="top" height={36} />

              {comparedAgents.map((id, idx) => (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={`Agent #${id}`}
                  stroke={AGENT_COLORS[idx % AGENT_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Leaderboard (Left 60%) + Agent Deep Dive (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaderboard Table (7 cols) */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2">
              <Trophy size={16} className="text-amber-400" />
              Agent Leaderboard
            </h3>
            <span className="text-xs font-mono text-[#64748b]">Click row to inspect</span>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#0f172a] border-b border-[#334155] text-[#94a3b8] font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3 text-right">Final Wealth</th>
                  <th className="py-2.5 px-3 text-right">Orders</th>
                  <th className="py-2.5 px-3 text-right">ROI</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/40 font-mono">
                {sortedLeaderboard.map((ag, idx) => {
                  const isSelected = selectedAgent?.id === ag.id;
                  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

                  return (
                    <tr
                      key={ag.id}
                      onClick={() => setSelectedAgentId(ag.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-600/15 border-l-2 border-blue-500'
                          : 'hover:bg-[#1e293b]/60'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold">
                        {medal || <span className="text-[#64748b]">#{idx + 1}</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-white">Agent #{ag.id}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        {formatCurrency(ag.finalWealth)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#94a3b8]">{ag.totalOrders}</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${ag.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatPercent(ag.roi)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            ag.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {ag.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Agent Deep Dive Card (5 cols) */}
        {selectedAgent && (
          <div className="lg:col-span-5 bg-[#0f172a] border border-blue-500/40 rounded-xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between pb-4 border-b border-[#334155]/60 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                  #{selectedAgent.id}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Agent #{selectedAgent.id}</h3>
                  <span className="text-[11px] font-mono text-[#94a3b8]">
                    {selectedAgent.roi >= 100 ? 'Alpha Arbitrageur' : selectedAgent.roi >= 0 ? 'Momentum Trader' : 'Risk-Averse'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => toggleCompare(selectedAgent.id)}
                className="px-2.5 py-1 text-xs font-mono rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors"
              >
                {comparedAgents.includes(selectedAgent.id) ? 'Remove Chart' : '+ Add Chart'}
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#1e293b]/60 p-3 rounded-lg border border-[#334155]/60">
                <div className="text-[10px] uppercase font-mono text-[#64748b]">Total Valuation</div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {formatCurrency(selectedAgent.finalWealth)}
                </div>
              </div>
              <div className="bg-[#1e293b]/60 p-3 rounded-lg border border-[#334155]/60">
                <div className="text-[10px] uppercase font-mono text-[#64748b]">Net Return</div>
                <div className={`text-lg font-bold font-mono ${selectedAgent.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPercent(selectedAgent.roi)}
                </div>
              </div>
            </div>

            {/* Portfolio Allocation breakdown */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-[#94a3b8] font-mono mb-1.5">
                <span>Asset Composition</span>
                <span className="text-white font-bold">{formatCurrency(selectedAgent.finalWealth)}</span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-[#f8fafc]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Cash
                  </span>
                  <span>{formatCurrency(selectedAgent.cash)}</span>
                </div>
                <div className="flex justify-between items-center text-[#f8fafc]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Stock A Value
                  </span>
                  <span>{formatCurrency(selectedAgent.stockAValue)}</span>
                </div>
                <div className="flex justify-between items-center text-[#f8fafc]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span> Stock B Value
                  </span>
                  <span>{formatCurrency(selectedAgent.stockBValue)}</span>
                </div>
              </div>
            </div>

            {/* Recent Executed Orders */}
            <div>
              <div className="text-xs font-semibold text-[#94a3b8] mb-2 font-mono">Recent Orders Placed</div>
              <div className="space-y-2">
                {selectedAgentOrders.length > 0 ? (
                  selectedAgentOrders.map((ord, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-[#1e293b]/40 border border-[#334155]/40 text-xs font-mono"
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            ord.orderType?.toLowerCase() === 'buy'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {ord.orderType?.toUpperCase()}
                        </span>
                        <span className="text-white">{ord.orderQuantity} shs Stock {ord.orderStock}</span>
                      </div>
                      <span className="text-emerald-400">${ord.orderPrice?.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#64748b] font-mono py-2 text-center">
                    No active trade orders in recorded sessions
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
