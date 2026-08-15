import React from 'react';
import { CheckCircle2, AlertCircle, MinusCircle, Clock, ShieldCheck } from 'lucide-react';

export default function StatusBadge({ status, size = 'sm', showIcon = true }) {
  if (!status) return <span className="text-slate-500">—</span>;
  
  const normalized = String(status).toLowerCase().trim();

  if (normalized === 'compliant' || normalized === 'completed') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-teal/15 text-teal-light border border-teal/30 ${
        size === 'lg' ? 'px-3.5 py-1.5 text-sm' : size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-xs'
      }`}>
        {showIcon && <CheckCircle2 className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
        <span className="capitalize">{normalized}</span>
      </span>
    );
  }

  if (normalized === 'gap' || normalized === 'pending') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose/15 text-rose-light border border-rose/30 ${
        size === 'lg' ? 'px-3.5 py-1.5 text-sm' : size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-xs'
      }`}>
        {showIcon && (normalized === 'pending' ? <Clock className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} /> : <AlertCircle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />)}
        <span className="capitalize">{normalized === 'gap' ? 'Care Gap' : normalized}</span>
      </span>
    );
  }

  if (normalized === 'not_eligible' || normalized === 'ineligible') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700 ${
        size === 'lg' ? 'px-3 py-1 text-sm' : size === 'md' ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-[11px]'
      }`}>
        {showIcon && <MinusCircle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5 text-slate-500'} />}
        <span>Not Eligible</span>
      </span>
    );
  }

  return <span className="text-slate-400 text-xs">{status}</span>;
}
