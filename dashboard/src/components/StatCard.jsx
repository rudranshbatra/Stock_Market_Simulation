import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, change, subtitle, icon: Icon, color = 'blue' }) {
  const isPositive = typeof change === 'number' ? change >= 0 : true;

  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 hover:border-slate-500 transition-colors shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#94a3b8] tracking-wider uppercase">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${colorClasses[color] || colorClasses.blue}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold text-[#f8fafc] font-mono tracking-tight">{value}</div>
        {change !== undefined && change !== null && (
          <span
            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}
          >
            {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
            {typeof change === 'number' ? `${isPositive ? '+' : ''}${change.toFixed(1)}%` : change}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-[#64748b] mt-2 font-sans">{subtitle}</p>}
    </div>
  );
}
