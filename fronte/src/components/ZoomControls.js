'use client';

import React from 'react';

export default function ZoomControls({
  setZoom,
  setUserLoc
}) {
  return (
    <div className="absolute bottom-6 right-6 z-10 flex bg-slate-950/80 border border-slate-800 p-1 rounded-xl backdrop-blur-md gap-0.5">
      <button 
        onClick={() => setZoom(z => Math.min(2.0, z + 0.15))} 
        className="w-7 h-7 rounded-lg hover:bg-slate-900 text-slate-300 font-bold flex items-center justify-center text-xs border border-slate-850 cursor-pointer"
      >
        +
      </button>
      <button 
        onClick={() => setZoom(z => Math.max(0.6, z - 0.15))} 
        className="w-7 h-7 rounded-lg hover:bg-slate-900 text-slate-300 font-bold flex items-center justify-center text-xs border border-slate-850 cursor-pointer"
      >
        -
      </button>
      <button 
        onClick={() => { setZoom(1); setUserLoc({ x: 380, y: 280 }); }} 
        className="w-7 h-7 rounded-lg hover:bg-slate-900 text-slate-400 font-mono flex items-center justify-center text-[8px] border border-slate-850 cursor-pointer"
        title="Reset Map"
      >
        RST
      </button>
    </div>
  );
}
