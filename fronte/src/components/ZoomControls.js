'use client';

import React from 'react';

export default function ZoomControls({
  setZoom,
  setUserLoc
}) {
  return (
    <div className="absolute bottom-6 right-6 z-10 flex bg-black/85 border border-neutral-800 p-1 rounded-xl backdrop-blur-md gap-0.5 shadow-lg">
      <button 
        onClick={() => setZoom(z => Math.min(2.0, z + 0.15))} 
        className="w-7 h-7 rounded-lg hover:bg-neutral-800 hover:text-yellow-400 text-neutral-300 font-bold flex items-center justify-center text-xs border border-neutral-800 transition cursor-pointer"
      >
        +
      </button>
      <button 
        onClick={() => setZoom(z => Math.max(0.6, z - 0.15))} 
        className="w-7 h-7 rounded-lg hover:bg-neutral-800 hover:text-yellow-400 text-neutral-300 font-bold flex items-center justify-center text-xs border border-neutral-800 transition cursor-pointer"
      >
        -
      </button>
      <button 
        onClick={() => { setZoom(1); setUserLoc({ x: 380, y: 280 }); }} 
        className="w-7 h-7 rounded-lg hover:bg-neutral-800 hover:text-yellow-400 text-neutral-400 font-mono flex items-center justify-center text-[8px] border border-neutral-800 transition cursor-pointer"
        title="Reset Map"
      >
        RST
      </button>
    </div>
  );
}
