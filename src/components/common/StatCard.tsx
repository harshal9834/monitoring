import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'positive' | 'warning' | 'critical' | 'neutral';
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  onClick,
}) => {
  const badgeClasses = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }[badge?.variant || 'neutral'];

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        {badge && (
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeClasses}`}>
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{subtitle}</p>}
    </div>
  );
};
