'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useCallback, useEffect, useRef } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import { Coffee, Dumbbell, Trees, Utensils, Music, MapPinOff } from 'lucide-react';
import { classifyScore } from '../utils/helpers';
import { MAPBOX_TOKEN } from '../utils/config';

function hasCoords(v) {
  return v && Number.isFinite(v.lat) && Number.isFinite(v.lon);
}

function CategoryIcon({ category, color, size = 14 }) {
  const style = { color, width: size, height: size, strokeWidth: 2.5, flexShrink: 0 };
  if (category === 'cafe') return <Coffee style={style} />;
  if (category === 'gym') return <Dumbbell style={style} />;
  if (category === 'park') return <Trees style={style} />;
  if (category === 'restaurant') return <Utensils style={style} />;
  if (category === 'nightclub') return <Music style={style} />;
  return null;
}

function MissingTokenNotice() {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#0a0a0a]">
      <div className="max-w-sm text-center border border-neutral-800 bg-neutral-950 rounded-2xl p-6">
        <MapPinOff className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
        <p className="text-sm font-bold text-white font-mono mb-1">Map unavailable</p>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Add <code className="text-yellow-400">NEXT_PUBLIC_MAPBOX_TOKEN=pk.…</code> to <code>fronte/.env.local</code>{' '}
          (and to Vercel&apos;s environment variables), then restart the dev server.
        </p>
      </div>
    </div>
  );
}

export default function CityMap({
  userLoc,
  setUserLoc,
  computedVenues = [],
  venueFilters = {},
  selectedVenueId,
  setSelectedVenueId,
  activeSector = 'Central District',
}) {
  const mapRef = useRef(null);
  const safeVenues = Array.isArray(computedVenues) ? computedVenues : [];

  // Fly to the selected venue (search result or marker click)
  const selected = safeVenues.find((v) => v.id === selectedVenueId);
  const selectedLat = selected?.lat;
  const selectedLon = selected?.lon;
  useEffect(() => {
    if (!mapRef.current || !Number.isFinite(selectedLat) || !Number.isFinite(selectedLon)) return;
    mapRef.current.flyTo({
      center: [selectedLon, selectedLat],
      zoom: Math.max(mapRef.current.getZoom(), 15),
      duration: 800,
    });
  }, [selectedVenueId, selectedLat, selectedLon]);

  const handleUserDragEnd = useCallback(
    (event) => {
      if (!setUserLoc) return;
      const { lngLat } = event;
      setUserLoc({ lat: lngLat.lat, lon: lngLat.lng });
    },
    [setUserLoc],
  );

  if (!MAPBOX_TOKEN) return <MissingTokenNotice />;

  return (
    <div className="absolute inset-0 z-0">
      <Map
        id="main"
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: userLoc.lon, latitude: userLoc.lat, zoom: 15, pitch: 0, bearing: 0 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/navigation-night-v1"
        reuseMaps
      >
        {safeVenues.map((venue) => {
          if (!venue || !venue.id || !hasCoords(venue)) return null;
          const isSelected = venue.id === selectedVenueId;
          const matchesFilter = venueFilters ? venueFilters[venue.id] !== false : true;
          const score =
            typeof venue.current_score === 'number' && Number.isFinite(venue.current_score) ? venue.current_score : null;
          const { color } = classifyScore(score);
          const hasReports = Array.isArray(venue.activeReports) && venue.activeReports.length > 0;

          return (
            <Marker
              key={venue.id}
              longitude={venue.lon}
              latitude={venue.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (setSelectedVenueId) setSelectedVenueId(venue.id);
              }}
            >
              <div className="relative flex flex-col items-center cursor-pointer" style={{ opacity: matchesFilter ? 1 : 0.2 }}>
                {hasReports && matchesFilter && (
                  <span
                    className="absolute rounded-full animate-ping"
                    style={{
                      width: 48,
                      height: 48,
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      border: `1.5px solid ${color}`,
                      opacity: 0.35,
                      pointerEvents: 'none',
                    }}
                  />
                )}
                <div
                  style={{
                    width: isSelected ? 42 : 34,
                    height: isSelected ? 42 : 34,
                    borderRadius: '50%',
                    backgroundColor: '#0a0a0a',
                    border: `${isSelected ? 3 : 1.6}px solid ${color}`,
                    boxShadow: isSelected ? `0 0 14px 4px ${color}55` : `0 0 7px 2px ${color}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <CategoryIcon category={venue.category} color={color} size={isSelected ? 13 : 11} />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    backgroundColor: '#0a0a0a',
                    border: `1px solid ${color}`,
                    borderRadius: 4,
                    padding: '1px 3px',
                    fontSize: 8,
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    color: '#ffffff',
                    lineHeight: 1,
                    pointerEvents: 'none',
                  }}
                >
                  {score ?? '–'}
                </div>
                {isSelected && (
                  <div
                    style={{
                      marginTop: 4,
                      backgroundColor: '#141414',
                      border: '1px solid rgba(250,204,21,0.25)',
                      borderRadius: 5,
                      padding: '2px 8px',
                      fontSize: 9,
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}
                  >
                    {venue.name || 'Venue'}
                  </div>
                )}
              </div>
            </Marker>
          );
        })}

        {hasCoords(userLoc) && (
          <Marker longitude={userLoc.lon} latitude={userLoc.lat} anchor="center" draggable onDragEnd={handleUserDragEnd}>
            <div className="relative flex flex-col items-center cursor-move" style={{ userSelect: 'none' }}>
              <span
                style={{
                  position: 'absolute',
                  width: 52,
                  height: 52,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  border: '1.2px dashed rgba(250,204,21,0.3)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: -20,
                  backgroundColor: '#FACC15',
                  color: '#000000',
                  fontSize: 7,
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  borderRadius: 4,
                  padding: '1px 5px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                YOU (DRAG)
              </div>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: '#FACC15',
                  boxShadow: '0 0 12px 4px rgba(250,204,21,0.65)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#000000' }} />
              </div>
            </div>
          </Marker>
        )}
      </Map>

      {/* Active Sector Badge */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          backgroundColor: '#141414',
          border: '1px solid rgba(250,204,21,0.35)',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 8,
          fontWeight: 'bold',
          fontFamily: 'monospace',
          color: '#facc15',
          letterSpacing: '0.05em',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        📍 {String(activeSector || 'Central District').slice(0, 24).toUpperCase()}
      </div>
    </div>
  );
}
