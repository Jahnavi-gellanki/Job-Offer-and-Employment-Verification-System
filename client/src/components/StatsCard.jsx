import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatsCard({ 
  icon: Icon, 
  value, 
  label, 
  trend, 
  trendType = 'up', 
  color = 'blue',
  subtitle
}) {
  const colorMap = {
    blue: {
      glow: 'from-blue-600/20 to-cyan-600/10',
      border: 'hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      text: 'text-blue-400',
    },
    cyan: {
      glow: 'from-cyan-600/20 to-teal-600/10',
      border: 'hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      text: 'text-cyan-400',
    },
    purple: {
      glow: 'from-purple-600/20 to-indigo-600/10',
      border: 'hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      text: 'text-purple-400',
    },
    emerald: {
      glow: 'from-emerald-600/20 to-teal-600/10',
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      text: 'text-emerald-400',
    },
    amber: {
      glow: 'from-amber-600/20 to-orange-600/10',
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      text: 'text-amber-400',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 p-5 transition-all duration-300 hover:-translate-y-1 ${scheme.border} shadow-lg shadow-black/20 group`}>
      {/* Background ambient glow */}
      <div className={`absolute -right-8 -top-8 w-28 h-28 bg-gradient-to-br ${scheme.glow} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">{value}</span>
            {trend && (
              <span
                className={`inline-flex items-center text-xs font-semibold ${
                  trendType === 'up' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {trendType === 'up' ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                )}
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl border ${scheme.iconBg} transition-transform duration-300 group-hover:scale-110 shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
