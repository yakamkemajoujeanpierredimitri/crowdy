'use client';

import React from 'react';
import { Play, Pause } from 'lucide-react';

export default function SimulationWidget({
  isLiveBackend,
  isPlayMode,
  setIsPlayMode,
  simTime,
  setSimTime,
  currentHour
}) {
  return (
    <div className="absolute bottom-6 left-6 z-10 w-72 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider">
          {isLiveBackend ? 'SERVER SYNCHRONIZER' : 'DECAY SIMULATOR CLOCK'}
        </span>
        {!isLiveBackend && (
          <button 
            onClick={() => setIsPlayMode(!isPlayMode)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isPlayMode 
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {isPlayMode ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
        )}
      </div>

      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[10px] text-slate-500 font-mono">
          {isLiveBackend ? 'Server Local Time:' : 'Current Time:'}
        </span>
        <span className="text-xs font-bold font-mono text-emerald-400">
          {isLiveBackend 
            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
            : simTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </span>
      </div>

      {!isLiveBackend ? (
        <>
          <input
            type="range"
            min="0"
            max="23"
            step="1"
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            value={currentHour}
            onChange={(e) => {
              const newHour = parseInt(e.target.value, 10);
              const newDate = new Date(simTime);
              newDate.setHours(newHour);
              setSimTime(newDate);
            }}
          />
          <div className="flex justify-between text-[7px] text-slate-600 font-mono mt-1">
            <span>12am</span>
            <span>6am</span>
            <span>12pm</span>
            <span>6pm</span>
            <span>11pm</span>
          </div>
        </>
      ) : (
        <p className="text-[9px] text-slate-500 leading-relaxed font-mono mt-1 border-t border-slate-900 pt-2 text-center">
          Operating in live pipeline mode. Standard temporal decay calculations are processed directly on database commits.
        </p>
      )}
    </div>
  );
}
