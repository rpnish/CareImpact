import React from 'react';

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 animate-pulse border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-6 bg-slate-200 rounded-full w-16"></div>
      </div>
      <div className="h-8 bg-slate-200 rounded w-1/2 mb-3"></div>
      <div className="h-2 bg-slate-200 rounded w-full mb-4"></div>
      <div className="flex justify-between">
        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse shadow-xs">
      <div className="h-10 bg-slate-100 rounded mb-4 w-full"></div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-50 rounded flex items-center px-4 space-x-4">
            <div className="h-4 bg-slate-200 rounded w-24"></div>
            <div className="h-4 bg-slate-200 rounded w-32"></div>
            <div className="h-4 bg-slate-200 rounded w-16"></div>
            <div className="h-4 bg-slate-200 rounded w-20"></div>
            <div className="h-4 bg-slate-200 rounded w-28"></div>
            <div className="h-6 bg-slate-200 rounded-full w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-white rounded-2xl p-6 animate-pulse border border-slate-200 h-80 flex flex-col justify-between shadow-xs">
      <div className="h-5 bg-slate-200 rounded w-1/3"></div>
      <div className="h-48 bg-slate-50 rounded-xl flex items-center justify-center">
        <div className="h-24 w-24 rounded-full border-4 border-slate-200 animate-spin"></div>
      </div>
      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
    </div>
  );
}
