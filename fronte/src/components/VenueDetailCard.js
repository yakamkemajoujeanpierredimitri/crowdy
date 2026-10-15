'use client';

import React from 'react';
import { 
  X, 
  Clock, 
  MapPin, 
  Globe, 
  ExternalLink, 
  Navigation,
  Lock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getCategoryLabel, reportOptions } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

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
  const { isPremiumUser, isBusinessPlus } = useAuth();
  const [highlights, setHighlights] = useState([]);
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [selectedHighlightIndex, setSelectedHighlightIndex] = useState(null);

  useEffect(() => {
    if (!selectedVenue) return;
    
    if (!isLiveBackend) {
      setHighlights([
        { id: 'mock-1', media_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80' },
        { id: 'mock-2', media_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80' },
        { id: 'mock-3', media_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=300&q=80' }
      ]);
      return;
    }
    
    let isMounted = true;
    const fetchHighlights = async () => {
      setHighlightsLoading(true);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/highlights/venue/${selectedVenue.id}`);
        if (!res.ok) throw new Error('Failed to fetch highlights');
        const data = await res.json();
        if (isMounted) {
          setHighlights(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setHighlightsLoading(false);
      }
    };
    
    fetchHighlights();
    
    return () => {
      isMounted = false;
    };
  }, [selectedVenue?.id, isLiveBackend]);

  if (!selectedVenue) return null;

  const safeHighlights = Array.isArray(highlights) ? highlights : [];
  const safeHistory = Array.isArray(selectedVenue?.history) && selectedVenue.history.length === 24
    ? selectedVenue.history
    : Array(24).fill(typeof selectedVenue?.current_score === 'number' ? selectedVenue.current_score : 20);

  return (
    <div className="absolute top-6 right-6 z-20 w-96 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-none rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
      <div className="bg-black/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-5 relative min-h-full">
        <button 
          onClick={() => setSelectedVenueId(null)}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-neutral-900/60 p-1.5 rounded-full border border-neutral-800 z-10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Place Image */}
        {selectedVenue.image && (
          <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4 border border-neutral-800">
            <img 
              src={selectedVenue.image} 
              alt={selectedVenue.name} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>
        )}

        {/* Highlights Section */}
        <div className="mb-4 space-y-1.5">
          <div className="flex justify-between items-center text-[8px] font-mono text-neutral-400 mb-2">
            <span>VENUE HIGHLIGHTS</span>
            {!isPremiumUser && (
              <span className="text-[7.5px] uppercase font-bold text-yellow-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Premium to unlock all
              </span>
            )}
          </div>
          
          {highlightsLoading ? (
            <div className="text-[10px] text-neutral-400 font-mono text-center py-2">Loading highlights...</div>
          ) : safeHighlights.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {safeHighlights.map((h, i) => {
                const isLocked = !isPremiumUser && !isBusinessPlus && i >= 1; // Free users see only 1 highlight
                
                return (
                  <div 
                    key={h.id} 
                    onClick={() => !isLocked && setSelectedHighlightIndex(i)}
                    className={`relative aspect-square rounded-md overflow-hidden border border-neutral-800 ${!isLocked ? 'cursor-pointer' : ''}`}
                  >
                    <img 
                      src={h.media_url} 
                      alt="Highlight" 
                      className={`w-full h-full object-cover transition-transform hover:scale-110 ${isLocked ? 'blur-sm brightness-50' : ''}`} 
                    />
                    {isLocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-1 text-center">
                        <Lock className="w-4 h-4 text-yellow-400 mb-1" />
                        <span className="text-[7px] font-bold text-white uppercase">Upgrade</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[10px] text-neutral-400 font-mono text-center py-4 bg-neutral-900/50 rounded-lg border border-neutral-800 border-dashed">
              No highlights yet.
            </div>
          )}
        </div>

        {/* Header Details */}
        <div className="space-y-1.5 pr-6">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono tracking-widest text-yellow-400 px-2 py-0.5 bg-yellow-950/40 border border-yellow-500/25 rounded-md uppercase font-semibold">
              {getCategoryLabel(selectedVenue.category)}
            </span>
            {selectedVenue.hours && (
              <span className="text-[9px] font-mono text-neutral-300 px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded-md flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-500" />
                Open: {selectedVenue.hours}
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-white font-mono">{selectedVenue.name}</h2>
          <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">{selectedVenue.description}</p>
          
          <div className="space-y-1 pt-2 border-t border-neutral-800 mt-2">
            <p className="text-[10px] text-neutral-300 font-mono flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              Address: <span className="text-white">{selectedVenue.address}</span>
            </p>
            {selectedVenue.website && (
              <p className="text-[10px] text-neutral-300 font-mono flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                Website:{' '}
                <a 
                  href={selectedVenue.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-yellow-400 hover:text-yellow-300 flex items-center gap-0.5 font-semibold"
                >
                  {selectedVenue.website.replace('https://', '')}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Score & Gauge */}
        <div className="flex items-center gap-4 py-4 my-3 border-t border-b border-neutral-800">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#262626" strokeWidth="4" />
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
            <span className="absolute text-[10px] font-bold font-mono text-white">{selectedVenue.current_score}%</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-mono" style={{ color: selectedVenue.color }}>
                {selectedVenue.label}
              </span>
              <span className="text-[9px] text-neutral-400 font-mono">({selectedVenue.source})</span>
            </div>
            <div className="text-[9px] text-neutral-300 font-mono mt-0.5 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-neutral-500" />
              <span>{selectedVenue.distance}m away</span>
              <span>•</span>
              {selectedVenue.distance <= 250 ? (
                <span className="text-yellow-400 font-bold">On-Site Verified</span>
              ) : (
                <span className="text-amber-400 font-medium">Remote report warning</span>
              )}
            </div>
          </div>
        </div>

        {/* One-tap Report Interface */}
        <div className="space-y-2">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-semibold">REPORT CROWD STATE</span>
          <div className="grid grid-cols-5 gap-1">
            {reportOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => submitLiveReport(opt.value)}
                className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-yellow-400/50 hover:bg-neutral-800 transition duration-150 cursor-pointer"
              >
                <span className="text-[8px] font-bold text-neutral-200">{opt.label}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
              </button>
            ))}
          </div>
        </div>

        {/* Interactive 24h Popularity profile chart */}
        <div className="mt-4 pt-3 border-t border-neutral-800 space-y-1.5">
          <div className="flex justify-between text-[8px] font-mono text-neutral-400">
            <span>24H POPULARITY PROFILE</span>
            <span className="text-[7.5px] uppercase font-bold text-neutral-400">
              {isLiveBackend ? 'Synchronized' : 'Click to warp time'}
            </span>
          </div>
          <div className="h-16 flex items-end justify-between gap-0.5 pt-1">
            {safeHistory.map((val, hr) => {
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
                  <div className="absolute bottom-full mb-0.5 left-1/2 -translate-x-1/2 bg-black text-[7px] px-1 py-0.5 rounded border border-neutral-800 font-mono hidden group-hover:block z-30 whitespace-nowrap text-white">
                    {hr}:00 ({val}%)
                  </div>
                  <div 
                    className={`w-full rounded-t transition-all ${
                      isCurrent ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'bg-neutral-800 group-hover:bg-neutral-700'
                    }`}
                    style={{ height: `${val}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal for Highlights */}
      {selectedHighlightIndex !== null && safeHighlights.length > 0 && safeHighlights[selectedHighlightIndex] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="relative bg-neutral-950 p-4 rounded-xl border border-neutral-800 shadow-2xl max-w-2xl w-full mx-4">
            <button 
              onClick={() => setSelectedHighlightIndex(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-neutral-900 p-2 rounded-full z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-between gap-4">
              <button 
                onClick={() => setSelectedHighlightIndex(prev => prev > 0 ? prev - 1 : prev)}
                disabled={selectedHighlightIndex === 0}
                className="p-2 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                <img 
                  src={safeHighlights[selectedHighlightIndex].media_url} 
                  alt="Highlight full" 
                  className="max-w-full max-h-[70vh] object-contain" 
                />
              </div>

              <button 
                onClick={() => setSelectedHighlightIndex(prev => {
                  const nextIndex = prev + 1;
                  const isNextLocked = !isPremiumUser && !isBusinessPlus && nextIndex >= 1;
                  if (nextIndex < safeHighlights.length && !isNextLocked) {
                    return nextIndex;
                  }
                  return prev;
                })}
                disabled={selectedHighlightIndex === safeHighlights.length - 1 || (!isPremiumUser && !isBusinessPlus && selectedHighlightIndex + 1 >= 1)}
                className="p-2 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
            <div className="text-center mt-4 text-neutral-400 font-mono text-xs">
              {selectedHighlightIndex + 1} / {!isPremiumUser && !isBusinessPlus ? 1 : safeHighlights.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
