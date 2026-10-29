import React, { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { Filter, PieChart as PieIcon, Activity, Layers } from 'lucide-react';

export default function MarketAnalysis() {
  const { data: stocks, loading: stocksLoading } = useApi('/api/stocks');
  const { data: sessions, loading: sessionsLoading } = useApi('/api/agents/sessions');

  const [activeStock, setActiveStock] = useState('both'); // 'both', 'A', 'B'

  // Format stock data for deep dive
  const stockData = useMemo(() => {
    if (!stocks || !Array.isArray(stocks)) return [];
    return stocks.map((s, idx) => ({
      index: idx,
      label: `D${s.day} S${s.session}`,
      day: s.day,
      session: s.session,
      stockA: s.stockA,
      stockB: s.stockB,
      spread: Math.abs((s.stockB || 0) - (s.stockA || 0)),
    }));
  }, [stocks]);

  // Order distribution: Buy vs Sell
  const orderSplit = useMemo(() => {
    if (!sessions || !Array.isArray(sessions)) return [];
    let buys = 0;
    let sells = 0;
    sessions.forEach((s) => {
      const type = (s.orderType || '').toLowerCase();
      if (type === 'buy') buys += s.orderQuantity || 1;
      else if (type === 'sell') sells += s.orderQuantity || 1;
    });

    const total = buys + sells || 1;
    return [
      { name: 'Buy Orders', value: buys, percent: Math.round((buys / total) * 100), color: '#10b981' },
      { name: 'Sell Orders', value: sells, percent: Math.round((sells / total) * 100), color: '#ef4444' },
    ];
  }, [sessions]);

  // Price distribution buckets
  const priceBuckets = useMemo(() => {
    if (!sessions || !Array.isArray(sessions)) return [];
    const buckets = {
      '<$25': 0,
      '$25-$30': 0,
      '$30-$35': 0,
      '$35-$40': 0,
      '$40-$45': 0,
      '>$45': 0,
    };

    sessions.forEach((s) => {
      const p = s.orderPrice || 0;
      if (p > 0) {
        if (p < 25) buckets['<$25']++;
        else if (p < 30) buckets['$25-$30']++;
        else if (p < 35) buckets['$30-$35']++;
        else if (p < 40) buckets['$35-$40']++;
        else if (p < 45) buckets['$40-$45']++;
        else buckets['>$45']++;
      }
    });

    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [sessions]);

  // Session activity breakdown (Session 1, 2, 3)
  const sessionBreakdown = useMemo(() => {
    if (!sessions || !Array.isArray(sessions)) return [];
    const sessCount = { 1: 0, 2: 0, 3: 0 };
    sessions.forEach((s) => {
      if (s.session && sessCount[s.session] !== undefined) {
        if (s.orderType && s.orderType !== 'no') {
          sessCount[s.session]++;
        }
      }
    });

    return [
      { session: 'Session 1 (Pre-Market / Open)', orders: sessCount[1], fill: '#3b82f6' },
      { session: 'Session 2 (Mid-Day Continuous)', orders: sessCount[2], fill: '#10b981' },
      { session: 'Session 3 (Closing Cross)', orders: sessCount[3], fill: '#8b5cf6' },
    ];
  }, [sessions]);

  if (stocksLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#f8fafc]">Market Microstructure & Order Dynamics</h2>
          <p className="text-xs text-[#94a3b8] mt-1">
            In-depth analysis of bid/ask distribution, price clustering, and multi-session liquidity flows.
          </p>
        </div>

        {/* Toggle Ticker Filters */}
        <div className="flex items-center space-x-2 bg-[#0f172a] p-1 rounded-lg border border-[#334155]">
          <button
            onClick={() => setActiveStock('both')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeStock === 'both'
                ? 'bg-blue-600 text-white shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Both Tickers
          </button>
          <button
            onClick={() => setActiveStock('A')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeStock === 'A'
                ? 'bg-blue-500 text-white shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Stock A
          </button>
          <button
            onClick={() => setActiveStock('B')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeStock === 'B'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Stock B
          </button>
        </div>
      </div>

      {/* Main Interactive Chart */}
      <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#334155]/60 mb-4">
          <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            Stock Price Deep Dive & Spread Differential
          </h3>
          <span className="text-xs font-mono text-[#64748b]">Hover points for session details</span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stockData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
              />
              <Legend verticalAlign="top" height={36} />

              {(activeStock === 'both' || activeStock === 'A') && (
                <Line 
                  type="monotone" 
                  dataKey="stockA" 
                  name="Stock A ($)" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  dot={false}
                  activeDot={{ r: 6 }} 
                />
              )}

              {(activeStock === 'both' || activeStock === 'B') && (
                <Line 
                  type="monotone" 
                  dataKey="stockB" 
                  name="Stock B ($)" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  dot={false}
                  activeDot={{ r: 6 }} 
                />
              )}

              {activeStock === 'both' && (
                <Line 
                  type="monotone" 
                  dataKey="spread" 
                  name="Spread (|B - A|)" 
                  stroke="#8b5cf6" 
                  strokeDasharray="4 4"
                  strokeWidth={1.5} 
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Session Activity Bar Chart */}
      <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2">
              <Layers size={16} className="text-purple-400" />
              Intraday Session Liquidity Intensity
            </h3>
            <p className="text-xs text-[#94a3b8]">Breakdown of agent orders placed across each trading session phase</p>
          </div>
          <span className="text-xs font-mono text-[#94a3b8]">3 Sessions / Day</span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sessionBreakdown} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" fontSize={11} />
              <YAxis dataKey="session" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
              />
              <Bar dataKey="orders" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid: Order Distribution + Price Clustering */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Split Donut */}
        <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2">
              <PieIcon size={16} className="text-emerald-400" />
              Order Direction Distribution
            </h3>
            <span className="text-xs font-mono text-[#64748b]">Buy vs Sell Ratio</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="h-52 w-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderSplit}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {orderSplit.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {orderSplit.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <div>
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-[#94a3b8] font-mono">
                      {formatNumber(item.value)} orders ({item.percent}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Price Histogram */}
        <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#f8fafc]">Trade Price Clustering Histogram</h3>
            <span className="text-xs font-mono text-[#64748b]">Order Frequency</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceBuckets} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
