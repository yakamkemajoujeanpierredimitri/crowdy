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
    <div className="absolute bottom-6 left-6 z-10 w-72 bg-black/85 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono font-bold text-neutral-400 tracking-wider">
          {isLiveBackend ? 'SERVER SYNCHRONIZER' : 'DECAY SIMULATOR CLOCK'}
        </span>
        {!isLiveBackend && (
          <button 
            onClick={() => setIsPlayMode(!isPlayMode)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isPlayMode 
                ? 'bg-yellow-400 text-black border-yellow-300 font-bold' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {isPlayMode ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
        )}
      </div>

      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[10px] text-neutral-400 font-mono">
          {isLiveBackend ? 'Server Local Time:' : 'Current Time:'}
        </span>
        <span className="text-xs font-bold font-mono text-yellow-400">
          {isLiveBackend 
            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
            : (simTime instanceof Date ? simTime : new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </span>
      </div>

      {!isLiveBackend ? (
        <>
          <input
            type="range"
            min="0"
            max="23"
            step="1"
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            value={currentHour}
            onChange={(e) => {
              const newHour = parseInt(e.target.value, 10);
              const newDate = new Date(simTime);
              newDate.setHours(newHour);
              setSimTime(newDate);
            }}
          />
          <div className="flex justify-between text-[7px] text-neutral-500 font-mono mt-1">
            <span>12am</span>
            <span>6am</span>
            <span>12pm</span>
            <span>6pm</span>
            <span>11pm</span>
          </div>
        </>
      ) : (
        <p className="text-[9px] text-neutral-400 leading-relaxed font-mono mt-1 border-t border-neutral-900 pt-2 text-center">
          Operating in live pipeline mode. Standard temporal decay calculations are processed directly on database commits.
        </p>
      )}
    </div>
  );
}
