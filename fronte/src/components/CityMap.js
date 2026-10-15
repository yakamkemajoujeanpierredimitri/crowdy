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
  zoom = 1,
  userLoc = { x: 380, y: 280 },
  setUserLoc,
  computedVenues = [],
  venueFilters = {},
  selectedVenueId,
  setSelectedVenueId,
  activeSector = 'Central District',
  streetLabels = []
}) {
  const [isDraggingUser, setIsDraggingUser] = useState(false);

  const safeVenues = Array.isArray(computedVenues) ? computedVenues : [];
  const selectedVenue = safeVenues.find(v => v && v.id === selectedVenueId) || null;

  // Dragging user pin
  const handleMapMouseDown = (e) => {
    if (e.target && e.target.id === 'user-pin-target') {
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
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(250, 204, 21, 0.04)" strokeWidth="1" />
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
        <rect width="800" height="600" fill="#0a0a0a" />
        <rect width="800" height="600" fill="url(#grid)" />

        {/* Water canal */}
        <path 
          d="M -50,100 C 150,110 200,80 320,160 C 440,240 400,320 520,380 C 640,440 700,410 850,450" 
          fill="none" 
          stroke="#172554" 
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
        <line x1="150" y1="-20" x2="150" y2="620" stroke="#141414" strokeWidth="20" opacity="0.6" />
        <line x1="380" y1="-20" x2="380" y2="620" stroke="#141414" strokeWidth="20" opacity="0.6" />
        <line x1="600" y1="-20" x2="600" y2="620" stroke="#141414" strokeWidth="20" opacity="0.6" />
        <line x1="-20" y1="120" x2="820" y2="120" stroke="#141414" strokeWidth="20" opacity="0.6" />
        <line x1="-20" y1="280" x2="820" y2="280" stroke="#141414" strokeWidth="20" opacity="0.6" />
        <line x1="-20" y1="460" x2="820" y2="460" stroke="#141414" strokeWidth="20" opacity="0.6" />

        {/* Dash Lines for street visuals */}
        <line x1="150" y1="-20" x2="150" y2="620" stroke="rgba(250, 204, 21, 0.08)" strokeWidth="1" strokeDasharray="4 8" />
        <line x1="380" y1="-20" x2="380" y2="620" stroke="rgba(250, 204, 21, 0.08)" strokeWidth="1" strokeDasharray="4 8" />
        <line x1="600" y1="-20" x2="600" y2="620" stroke="rgba(250, 204, 21, 0.08)" strokeWidth="1" strokeDasharray="4 8" />
        <line x1="-20" y1="120" x2="820" y2="120" stroke="rgba(250, 204, 21, 0.08)" strokeWidth="1" strokeDasharray="4 8" />
        <line x1="-20" y1="280" x2="820" y2="280" stroke="rgba(250, 204, 21, 0.08)" strokeWidth="1" strokeDasharray="4 8" />
        <line x1="-20" y1="460" x2="820" y2="460" stroke="rgba(250, 204, 21, 0.08)" strokeWidth="1" strokeDasharray="4 8" />

        {/* Active Sector / City Badge */}
        <g transform="translate(680, 25)">
          <rect x="-85" y="-12" width="170" height="24" rx="6" fill="#141414" stroke="rgba(250, 204, 21, 0.35)" strokeWidth="1" />
          <text x="0" y="3" fill="#facc15" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            📍 {String(activeSector || 'Central District').slice(0, 24).toUpperCase()}
          </text>
        </g>

        {/* Dynamic Street Name Texts */}
        <text x="150" y="55" fill="rgba(250, 204, 21, 0.22)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(90 150 55)">
          {String((streetLabels && streetLabels[0]) || 'BROADWAY ST').toUpperCase()}
        </text>
        <text x="380" y="320" fill="rgba(250, 204, 21, 0.22)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(90 380 320)">
          {String((streetLabels && streetLabels[1]) || 'SPRUCE AVE').toUpperCase()}
        </text>
        <text x="600" y="540" fill="rgba(250, 204, 21, 0.22)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(90 600 540)">
          {String((streetLabels && streetLabels[2]) || 'COMMERCIAL WAY').toUpperCase()}
        </text>
        <text x="75" y="115" fill="rgba(250, 204, 21, 0.22)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
          {String((streetLabels && streetLabels[3]) || 'CANAL ROAD').toUpperCase()}
        </text>
        <text x="500" y="275" fill="rgba(250, 204, 21, 0.22)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
          {String((streetLabels && streetLabels[4]) || 'PARKSIDE BLVD').toUpperCase()}
        </text>
        <text x="500" y="455" fill="rgba(250, 204, 21, 0.22)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
          {String((streetLabels && streetLabels[5]) || 'UNIVERSITY DR').toUpperCase()}
        </text>

        {/* Parks */}
        <rect x="440" y="140" width="120" height="120" rx="10" fill="#141400" opacity="0.15" stroke="#3d3d00" strokeWidth="1" strokeDasharray="2 4" />
        <path d="M 40,80 Q 90,80 120,130 T 40,220 Z" fill="#141400" opacity="0.15" stroke="#3d3d00" strokeWidth="1" strokeDasharray="2 4" />

        {/* Proximity Ring around user (250m GPS Verification Zone) */}
        <circle 
          cx={userLoc?.x ?? 380} 
          cy={userLoc?.y ?? 280} 
          r="167" 
          fill="none" 
          stroke="rgba(250, 204, 21, 0.15)" 
          strokeWidth="1.2" 
          strokeDasharray="4 8" 
        />

        {/* Line pointing to selected venue */}
        {selectedVenue && 
         typeof selectedVenue.x === 'number' && !isNaN(selectedVenue.x) &&
         typeof selectedVenue.y === 'number' && !isNaN(selectedVenue.y) &&
         userLoc && typeof userLoc.x === 'number' && (
          <line 
            x1={userLoc.x} 
            y1={userLoc.y} 
            x2={selectedVenue.x} 
            y2={selectedVenue.y} 
            stroke="rgba(250, 204, 21, 0.3)" 
            strokeWidth="1.2" 
            strokeDasharray="3 4" 
            filter="url(#glow)" 
          />
        )}

        {/* VENUE PINS */}
        {safeVenues.map((venue) => {
          if (!venue || !venue.id) return null;
          const isSelected = venue.id === selectedVenueId;
          const matchesFilter = venueFilters ? venueFilters[venue.id] !== false : true;
          const score = typeof venue.current_score === 'number' && !isNaN(venue.current_score) ? venue.current_score : 15;
          const { color } = classifyScore(score);
          const hasReports = Array.isArray(venue.activeReports) && venue.activeReports.length > 0;
          const vx = typeof venue.x === 'number' && !isNaN(venue.x) ? venue.x : 400;
          const vy = typeof venue.y === 'number' && !isNaN(venue.y) ? venue.y : 300;
          
          return (
            <g 
              key={venue.id} 
              transform={`translate(${vx}, ${vy})`}
              onClick={(e) => {
                e.stopPropagation();
                if (setSelectedVenueId) setSelectedVenueId(venue.id);
              }}
              className="cursor-pointer transition-all duration-300"
              opacity={matchesFilter ? 1.0 : 0.15}
            >
              {hasReports && matchesFilter && (
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
                fill="#0a0a0a" 
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
                <rect x="0" y="0" width="18" height="12" rx="3" fill="#0a0a0a" stroke={color} strokeWidth="1" />
                <text x="9" y="9" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {score}
                </text>
              </g>

              {isSelected && (
                <g transform="translate(0, 30)">
                  <rect x="-60" y="-11" width="120" height="22" rx="5" fill="#141414" stroke="rgba(250, 204, 21, 0.25)" strokeWidth="1" />
                  <text x="0" y="3" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    {venue.name || 'Venue'}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* DRAGGABLE USER PIN (BRAND YELLOW & BLACK) */}
        <g transform={`translate(${userLoc?.x ?? 380}, ${userLoc?.y ?? 280})`}>
          <circle 
            r="20" 
            fill="rgba(250, 204, 21, 0.05)" 
            stroke="rgba(250, 204, 21, 0.2)" 
            strokeWidth="1"
            strokeDasharray="3 2"
          />
          <circle
            id="user-pin-target"
            r="12"
            fill="#FACC15"
            className="cursor-move hover:scale-110 active:scale-95 transition-transform"
            style={{ filter: 'drop-shadow(0px 0px 8px rgba(250, 204, 21, 0.75))' }}
          />
          <circle r="3.5" fill="#000000" pointerEvents="none" />
          <g transform="translate(0, -20)" pointerEvents="none">
            <rect x="-30" y="-8" width="60" height="16" rx="4" fill="#FACC15" />
            <text x="0" y="3" fill="#000000" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              YOU (DRAG)
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
