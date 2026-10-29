import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { EVENTS, TOTAL_DAYS } from '../utils/constants';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Play, Pause, RotateCcw, FastForward, Rewind, 
  Zap, Compass, Activity, ArrowRight 
} from 'lucide-react';

export default function Playback() {
  const { data: stocks, loading: stocksLoading } = useApi('/api/stocks');
  const { data: sessions, loading: sessionsLoading } = useApi('/api/agents/sessions');

  // Max day in the simulation
  const maxSimDay = useMemo(() => {
    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) return 264;
    const days = stocks.map((s) => s.day || 0);
    return Math.max(...days, 1);
  }, [stocks]);

  const [currentDay, setCurrentDay] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 5x
  const timerRef = useRef(null);

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(200, 1000 / playbackSpeed);
      timerRef.current = setInterval(() => {
        setCurrentDay((prev) => {
          if (prev >= maxSimDay) {
            setIsPlaying(false);
            return maxSimDay;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, maxSimDay]);

  // Filter stocks up to current day
  const revealedStocks = useMemo(() => {
    if (!stocks || !Array.isArray(stocks)) return [];
    return stocks
      .filter((s) => (s.day || 0) <= currentDay)
      .map((s, idx) => ({
        index: idx,
        label: `D${s.day}S${s.session}`,
        day: s.day,
        session: s.session,
        stockA: s.stockA,
        stockB: s.stockB,
      }));
  }, [stocks, currentDay]);

  // Current day stock prices
  const currentPrices = useMemo(() => {
    if (revealedStocks.length === 0) return { a: 30, b: 40 };
    const latest = revealedStocks[revealedStocks.length - 1];
    return {
      a: latest.stockA || 30,
      b: latest.stockB || 40,
    };
  }, [revealedStocks]);

  // Today's orders from sessions
  const todaysOrders = useMemo(() => {
    if (!sessions || !Array.isArray(sessions)) return { buys: 0, sells: 0, total: 0 };
    const daySessions = sessions.filter((s) => (s.day || 0) === currentDay);
    let buys = 0;
    let sells = 0;
    daySessions.forEach((s) => {
      const type = (s.orderType || '').toLowerCase();
      if (type === 'buy') buys++;
      else if (type === 'sell') sells++;
    });
    return {
      buys,
      sells,
      total: buys + sells,
      matched: Math.min(buys, sells),
    };
  }, [sessions, currentDay]);

  // Agent activity donut data
  const activityDonut = useMemo(() => {
    const totalAgents = 50;
    const buying = Math.min(todaysOrders.buys, totalAgents);
    const selling = Math.min(todaysOrders.sells, totalAgents - buying);
    const holding = Math.max(0, totalAgents - buying - selling);

    return [
      { name: 'Buying', value: buying, color: '#10b981' },
      { name: 'Selling', value: selling, color: '#ef4444' },
      { name: 'Holding', value: holding, color: '#64748b' },
    ];
  }, [todaysOrders]);

  // Market sentiment score (0 - 100)
  const sentiment = useMemo(() => {
    const total = todaysOrders.buys + todaysOrders.sells;
    if (total === 0) return { score: 50, label: 'Neutral', color: 'text-amber-400' };
    const ratio = todaysOrders.buys / total;
    const score = Math.round(ratio * 100);
    if (score >= 60) return { score, label: 'Moderately Bullish', color: 'text-emerald-400' };
    if (score >= 45) return { score, label: 'Neutral / Range-Bound', color: 'text-amber-400' };
    return { score, label: 'Bearish Bias', color: 'text-red-400' };
  }, [todaysOrders]);

  // Active Macro Event banner
  const activeEvent = useMemo(() => {
    return EVENTS.find((e) => e.day === currentDay);
  }, [currentDay]);

  if (stocksLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#f8fafc] flex items-center gap-2">
            🎬 Interactive Simulation Playback
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Live Replay Engine
            </span>
          </h2>
          <p className="text-xs text-[#94a3b8] mt-1">
            Scrub through the 264-day historical simulation timeline to witness emergent market micro-dynamics.
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-[#94a3b8]">TIMELINE PROGRESS:</span>
          <span className="text-blue-400 font-bold">
            Day {currentDay} of {maxSimDay}
          </span>
          <span className="text-[#64748b]">({Math.round((currentDay / maxSimDay) * 100)}%)</span>
        </div>
      </div>

      {/* Scrubber & Player Controls Card */}
      <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-2xl space-y-5">
        {/* Progress Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-[#94a3b8]">
            <span>Day 1 (Inception)</span>
            <span className="text-white font-bold">Day {currentDay}</span>
            <span>Day {maxSimDay} (Horizon)</span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min={1}
              max={maxSimDay}
              value={currentDay}
              onChange={(e) => {
                setCurrentDay(Number(e.target.value));
                if (isPlaying) setIsPlaying(false);
              }}
              className="w-full h-2 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
            />
          </div>
        </div>

        {/* Playback Button Bar */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#334155]/60 gap-4">
          {/* Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => { setCurrentDay(1); setIsPlaying(false); }}
              className="p-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] hover:text-white transition-colors"
              title="Reset to Day 1"
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={() => setCurrentDay((d) => Math.max(1, d - 1))}
              className="p-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] hover:text-white transition-colors"
              title="Previous Day"
            >
              <Rewind size={16} />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span className="text-xs font-mono">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={() => setCurrentDay((d) => Math.min(maxSimDay, d + 1))}
              className="p-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] hover:text-white transition-colors"
              title="Next Day"
            >
              <FastForward size={16} />
            </button>
          </div>

          {/* Speed Pills */}
          <div className="flex items-center space-x-1.5 bg-[#1e293b] p-1 rounded-lg border border-[#334155]">
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all ${
                  playbackSpeed === speed
                    ? 'bg-blue-600 text-white'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Macro Event Banner (Visible on event trigger) */}
        {activeEvent && (
          <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-start space-x-3 text-xs animate-fadeIn">
            <Zap size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-300 font-mono text-sm">
                ⚡ Macro Event Triggered: {activeEvent.label} (Day {activeEvent.day})
              </div>
              <p className="text-emerald-100/80 mt-1">{activeEvent.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Revealing Stock Price Chart */}
      <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#334155]/60 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-2">
              <Activity size={16} className="text-blue-400" />
              Dynamic Stock Price Valuation (Revealed to Day {currentDay})
            </h3>
            <p className="text-xs text-[#94a3b8]">Live simulated price progression as playback advances</p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-[#94a3b8]">Stock A:</span>
              <span className="text-white font-bold">${currentPrices.a.toFixed(2)}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-[#94a3b8]">Stock B:</span>
              <span className="text-white font-bold">${currentPrices.b.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revealedStocks} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} 
              />
              <Line 
                type="monotone" 
                dataKey="stockA" 
                name="Stock A" 
                stroke="#3b82f6" 
                strokeWidth={2.5} 
                dot={false}
                activeDot={{ r: 5 }} 
              />
              <Line 
                type="monotone" 
                dataKey="stockB" 
                name="Stock B" 
                stroke="#10b981" 
                strokeWidth={2.5} 
                dot={false}
                activeDot={{ r: 5 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3 Real-time Daily Telemetry Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Orders Panel */}
        <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-xl">
          <h4 className="text-xs font-mono font-bold text-[#94a3b8] uppercase tracking-wider mb-3">
            Day {currentDay} Order Book
          </h4>
          <div className="space-y-3 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Buy Orders:
              </span>
              <span className="font-bold text-white">{todaysOrders.buys}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-2 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400"></span> Sell Orders:
              </span>
              <span className="font-bold text-white">{todaysOrders.sells}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-[#334155]/60">
              <span className="text-[#94a3b8]">Matched Trades:</span>
              <span className="font-bold text-blue-400">{todaysOrders.matched}</span>
            </div>
          </div>
        </div>

        {/* Agent Activity Donut */}
        <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-xl">
          <h4 className="text-xs font-mono font-bold text-[#94a3b8] uppercase tracking-wider mb-2">
            Agent Collective Stance
          </h4>
          <div className="flex items-center justify-between">
            <div className="h-28 w-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityDonut}
                    innerRadius={28}
                    outerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {activityDonut.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              {activityDonut.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-[#94a3b8]">{item.name}:</span>
                  <span className="text-white font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Sentiment Gauge */}
        <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 shadow-xl">
          <h4 className="text-xs font-mono font-bold text-[#94a3b8] uppercase tracking-wider mb-3">
            Market Sentiment Index
          </h4>
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className={`text-xl font-bold font-mono ${sentiment.color}`}>
                {sentiment.label}
              </span>
              <span className="text-xs font-mono text-[#94a3b8]">{sentiment.score}/100</span>
            </div>

            <div className="w-full bg-[#1e293b] rounded-full h-2 overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${sentiment.score}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[10px] font-mono text-[#64748b]">
              <span>0 (Bearish)</span>
              <span>50 (Neutral)</span>
              <span>100 (Bullish)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
