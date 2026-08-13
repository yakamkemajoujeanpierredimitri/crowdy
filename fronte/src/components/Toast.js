'use client';

import React from 'react';
import { ShieldAlert, Check } from 'lucide-react';

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] border backdrop-blur-md transition-all duration-300 ${
      toast.type === 'error' 
        ? 'bg-red-950/80 border-red-500/35 text-red-200' 
        : 'bg-slate-900/90 border-emerald-500/35 text-emerald-200'
    }`}>
      {toast.type === 'error' ? (
        <ShieldAlert className="w-4 h-4 text-red-400" />
      ) : (
        <Check className="w-4 h-4 text-emerald-400" />
      )}
      <span className="text-xs font-semibold">{toast.message}</span>
    </div>
  );
}
