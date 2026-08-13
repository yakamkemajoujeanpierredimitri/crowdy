'use client';

import React from 'react';
import { 
  X, 
  Clock, 
  MapPin, 
  Globe, 
  ExternalLink, 
  Navigation 
} from 'lucide-react';
import { getCategoryLabel, reportOptions } from '../utils/helpers';

export default function VenueDetailCard({
  selectedVenue,
  setSelectedVenueId,
  isLiveBackend,
  submitLiveReport,
  currentHour,
  simTime,
  setSimTime,
  showToast
}) {
  if (!selectedVenue) return null;

  return (
    <div className="absolute top-6 right-6 z-10 w-96 max-w-[calc(100vw-3rem)]">
      <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-[0_15px_30px_rgba(0,0,0,0.5)] relative">
        <button 
          onClick={() => setSelectedVenueId(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 bg-slate-900/50 p-1.5 rounded-full border border-slate-800 z-10 animate-transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Place Image */}
        {selectedVenue.image && (
          <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4 border border-slate-800">
            <img 
              src={selectedVenue.image} 
              alt={selectedVenue.name} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          </div>
        )}

        {/* Header Details */}
        <div className="space-y-1.5 pr-6">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono tracking-widest text-emerald-400 px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/25 rounded-md uppercase">
              {getCategoryLabel(selectedVenue.category)}
            </span>
            {selectedVenue.hours && (
              <span className="text-[9px] font-mono text-slate-400 px-2 py-0.5 bg-slate-900 border border-slate-850 rounded-md flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                Open: {selectedVenue.hours}
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-white font-mono">{selectedVenue.name}</h2>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{selectedVenue.description}</p>
          
          <div className="space-y-1 pt-2 border-t border-slate-900 mt-2">
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              Address: {selectedVenue.address}
            </p>
            {selectedVenue.website && (
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                Website:{' '}
                <a 
                  href={selectedVenue.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 font-semibold"
                >
                  {selectedVenue.website.replace('https://', '')}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Score & Gauge */}
        <div className="flex items-center gap-4 py-4 my-3 border-t border-b border-slate-850">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#1e293b" strokeWidth="4" />
              <circle 
                cx="24" 
                cy="24" 
                r="20" 
                fill="none" 
                stroke={selectedVenue.color} 
                strokeWidth="4" 
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 * (1 - selectedVenue.current_score / 100)}
                className="transition-all duration-500 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-bold font-mono">{selectedVenue.current_score}%</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-mono" style={{ color: selectedVenue.color }}>
                {selectedVenue.label}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">({selectedVenue.source})</span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-slate-500" />
              <span>{selectedVenue.distance}m away</span>
              <span>•</span>
              {selectedVenue.distance <= 250 ? (
                <span className="text-emerald-400 font-bold">On-Site Verified</span>
              ) : (
                <span className="text-amber-500 font-medium">Remote report warning</span>
              )}
            </div>
          </div>
        </div>

        {/* One-tap Report Interface */}
        <div className="space-y-2">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">REPORT CROWD STATE</span>
          <div className="grid grid-cols-5 gap-1">
            {reportOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => submitLiveReport(opt.value)}
                className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 transition duration-150 cursor-pointer"
              >
                <span className="text-[8px] font-bold text-slate-400">{opt.label}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
              </button>
            ))}
          </div>
        </div>

        {/* Interactive 24h Popularity profile chart */}
        <div className="mt-4 pt-3 border-t border-slate-850 space-y-1.5">
          <div className="flex justify-between text-[8px] font-mono text-slate-500">
            <span>24H POPULARITY PROFILE</span>
            <span className="text-[7.5px] uppercase font-bold text-slate-500">
              {isLiveBackend ? 'Synchronized' : 'Click to warp time'}
            </span>
          </div>
          <div className="h-16 flex items-end justify-between gap-0.5 pt-1">
            {selectedVenue.history.map((val, hr) => {
              const isCurrent = hr === currentHour;
              return (
                <div 
                  key={hr} 
                  className="flex-1 flex flex-col justify-end h-full relative group cursor-pointer"
                  onClick={() => {
                    if (isLiveBackend) {
                      showToast('Simulated time adjustment disabled on Live Backend.', 'error');
                      return;
                    }
                    const newDate = new Date(simTime);
                    newDate.setHours(hr);
                    setSimTime(newDate);
                  }}
                >
                  <div className="absolute bottom-full mb-0.5 left-1/2 -translate-x-1/2 bg-slate-950 text-[7px] px-1 py-0.5 rounded border border-slate-800 font-mono hidden group-hover:block z-30 whitespace-nowrap">
                    {hr}:00 ({val}%)
                  </div>
                  <div 
                    className={`w-full rounded-t transition-all ${
                      isCurrent ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-slate-800 group-hover:bg-slate-700'
                    }`}
                    style={{ height: `${val}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
