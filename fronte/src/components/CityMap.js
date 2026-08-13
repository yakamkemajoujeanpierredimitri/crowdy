'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Coffee, 
  Dumbbell, 
  Trees, 
  Utensils, 
  Music 
} from 'lucide-react';
import { classifyScore } from '../utils/helpers';

export default function CityMap({
  zoom,
  userLoc,
  setUserLoc,
  computedVenues,
  venueFilters,
  selectedVenueId,
  setSelectedVenueId
}) {
  const [isDraggingUser, setIsDraggingUser] = useState(false);

  const selectedVenue = computedVenues.find(v => v.id === selectedVenueId) || null;

  // Dragging user pin
  const handleMapMouseDown = (e) => {
    if (e.target.id === 'user-pin-target') {
      setIsDraggingUser(true);
    }
  };

  const handleMapMouseMove = useCallback((e) => {
    if (!isDraggingUser) return;
    const svg = document.getElementById('city-map-svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const x = Math.min(800, Math.max(0, (clientX - rect.left) * scaleX));
    const y = Math.min(600, Math.max(0, (clientY - rect.top) * scaleY));
    
    setUserLoc({ x: Math.round(x), y: Math.round(y) });
  }, [isDraggingUser, setUserLoc]);

  const handleMapMouseUp = useCallback(() => {
    if (isDraggingUser) {
      setIsDraggingUser(false);
    }
  }, [isDraggingUser]);

  useEffect(() => {
    if (isDraggingUser) {
      window.addEventListener('mouseup', handleMapMouseUp);
      window.addEventListener('mousemove', handleMapMouseMove);
    }
    return () => {
      window.removeEventListener('mouseup', handleMapMouseUp);
      window.removeEventListener('mousemove', handleMapMouseMove);
    };
  }, [isDraggingUser, handleMapMouseUp, handleMapMouseMove]);

  return (
    <div className="absolute inset-0 z-0">
      <svg 
        id="city-map-svg"
        className="w-full h-full select-none"
        viewBox="0 0 800 600"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
        onMouseDown={handleMapMouseDown}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.04)" strokeWidth="1" />
          </pattern>
          
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-strong" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid Map Background */}
        <rect width="800" height="600" fill="#020617" />
        <rect width="800" height="600" fill="url(#grid)" />

        {/* Glowing water canal */}
        <path 
          d="M -50,100 C 150,110 200,80 320,160 C 440,240 400,320 520,380 C 640,440 700,410 850,450" 
          fill="none" 
          stroke="#1e3a8a" 
          strokeWidth="48" 
          strokeLinecap="round" 
          opacity="0.1"
        />
        <path 
          d="M -50,100 C 150,110 200,80 320,160 C 440,240 400,320 520,380 C 640,440 700,410 850,450" 
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth="10" 
          strokeLinecap="round" 
          opacity="0.12"
          filter="url(#glow)"
        />

        {/* Streets */}
        <line x1="150" y1="-20" x2="150" y2="620" stroke="#0f172a" strokeWidth="20" opacity="0.5" />
        <line x1="380" y1="-20" x2="380" y2="620" stroke="#0f172a" strokeWidth="20" opacity="0.5" />
        <line x1="600" y1="-20" x2="600" y2="620" stroke="#0f172a" strokeWidth="20" opacity="0.5" />
        <line x1="-20" y1="120" x2="820" y2="120" stroke="#0f172a" strokeWidth="20" opacity="0.5" />
        <line x1="-20" y1="280" x2="820" y2="280" stroke="#0f172a" strokeWidth="20" opacity="0.5" />
        <line x1="-20" y1="460" x2="820" y2="460" stroke="#0f172a" strokeWidth="20" opacity="0.5" />

        {/* Dash Lines for street visuals */}
        <line x1="150" y1="-20" x2="150" y2="620" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" strokeDasharray="4 8" />
        <line x1="380" y1="-20" x2="380" y2="620" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" strokeDasharray="4 8" />
        <line x1="600" y1="-20" x2="600" y2="620" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" strokeDasharray="4 8" />
        <line x1="-20" y1="120" x2="820" y2="120" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" strokeDasharray="4 8" />
        <line x1="-20" y1="280" x2="820" y2="280" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" strokeDasharray="4 8" />
        <line x1="-20" y1="460" x2="820" y2="460" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" strokeDasharray="4 8" />

        {/* Street Name Texts */}
        <text x="150" y="55" fill="rgba(148, 163, 184, 0.2)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(90 150 55)">BROADWAY ST</text>
        <text x="380" y="320" fill="rgba(148, 163, 184, 0.2)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(90 380 320)">SPRUCE AVE</text>
        <text x="600" y="540" fill="rgba(148, 163, 184, 0.2)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(90 600 540)">COMMERCIAL WAY</text>
        <text x="75" y="115" fill="rgba(148, 163, 184, 0.2)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">CANAL ROAD</text>
        <text x="500" y="275" fill="rgba(148, 163, 184, 0.2)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">PARKSIDE BLVD</text>
        <text x="500" y="455" fill="rgba(148, 163, 184, 0.2)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">UNIVERSITY DR</text>

        {/* Parks */}
        <rect x="440" y="140" width="120" height="120" rx="10" fill="#065f46" opacity="0.06" stroke="#047857" strokeWidth="1" strokeDasharray="2 4" />
        <path d="M 40,80 Q 90,80 120,130 T 40,220 Z" fill="#065f46" opacity="0.05" stroke="#047857" strokeWidth="1" strokeDasharray="2 4" />

        {/* Proximity Ring around user (250m GPS Verification Zone) */}
        <circle 
          cx={userLoc.x} 
          cy={userLoc.y} 
          r="167" 
          fill="none" 
          stroke="rgba(16, 185, 129, 0.12)" 
          strokeWidth="1.2"
          strokeDasharray="4 8"
        />

        {/* Line pointing to selected venue */}
        {selectedVenue && (
          <line 
            x1={userLoc.x} 
            y1={userLoc.y} 
            x2={selectedVenue.x} 
            y2={selectedVenue.y} 
            stroke="rgba(16, 185, 129, 0.25)" 
            strokeWidth="1.2"
            strokeDasharray="3 4"
            filter="url(#glow)"
          />
        )}

        {/* VENUE PINS */}
        {computedVenues.map((venue) => {
          const isSelected = venue.id === selectedVenueId;
          const matchesFilter = venueFilters[venue.id];
          const { color } = classifyScore(venue.current_score);
          
          return (
            <g 
              key={venue.id} 
              transform={`translate(${venue.x}, ${venue.y})`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedVenueId(venue.id);
              }}
              className="cursor-pointer transition-all duration-300"
              opacity={matchesFilter ? 1.0 : 0.15}
            >
              {venue.activeReports.length > 0 && matchesFilter && (
                <circle 
                  r="24" 
                  fill="none" 
                  stroke={color} 
                  strokeWidth="1.2" 
                  className="animate-ping" 
                  opacity="0.15" 
                />
              )}

              <circle 
                r="15" 
                fill="#020617" 
                stroke={color} 
                strokeWidth={isSelected ? 3.0 : 1.6} 
                style={{ filter: isSelected ? 'url(#glow-strong)' : 'url(#glow)' }}
              />

              {/* Category Icon */}
              <g transform="translate(-7, -7) scale(0.7)" style={{ color: color }}>
                {venue.category === 'cafe' && <Coffee className="w-5 h-5" strokeWidth={2.5} />}
                {venue.category === 'gym' && <Dumbbell className="w-5 h-5" strokeWidth={2.5} />}
                {venue.category === 'park' && <Trees className="w-5 h-5" strokeWidth={2.5} />}
                {venue.category === 'restaurant' && <Utensils className="w-5 h-5" strokeWidth={2.5} />}
                {venue.category === 'nightclub' && <Music className="w-5 h-5" strokeWidth={2.5} />}
              </g>

              {/* Value Tag */}
              <g transform="translate(10, -11)">
                <rect x="0" y="0" width="18" height="12" rx="3" fill="#020617" stroke={color} strokeWidth="1" />
                <text x="9" y="9" fill="#e2e8f0" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {venue.current_score}
                </text>
              </g>

              {isSelected && (
                <g transform="translate(0, 30)">
                  <rect x="-60" y="-11" width="120" height="22" rx="5" fill="#0f172a" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="1" />
                  <text x="0" y="3" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    {venue.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* DRAGGABLE USER PIN */}
        <g transform={`translate(${userLoc.x}, ${userLoc.y})`}>
          <circle 
            r="20" 
            fill="rgba(16, 185, 129, 0.04)" 
            stroke="rgba(16, 185, 129, 0.15)" 
            strokeWidth="1"
            strokeDasharray="3 2"
          />
          <circle
            id="user-pin-target"
            r="12"
            fill="#10b981"
            className="cursor-move hover:scale-110 active:scale-95 transition-transform"
            style={{ filter: 'drop-shadow(0px 0px 6px rgba(16, 185, 129, 0.6))' }}
          />
          <circle r="3.5" fill="#ffffff" pointerEvents="none" />
          <g transform="translate(0, -20)" pointerEvents="none">
            <rect x="-30" y="-8" width="60" height="16" rx="4" fill="#10b981" />
            <text x="0" y="3" fill="#022c22" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              YOU (DRAG)
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
