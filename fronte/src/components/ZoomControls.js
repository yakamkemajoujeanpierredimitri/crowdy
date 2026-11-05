'use client';

import React from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { DEFAULT_USER_LOCATION } from '../utils/config';

// Talks to the <Map id="main"> in CityMap through react-map-gl's MapProvider.
// Sits above the simulator widget (bottom-left) so the dev role switcher can't cover it.
export default function ZoomControls({ onReset }) {
  const { main } = useMap();
  if (!main) return null;

  const btn =
    'w-7 h-7 rounded-lg hover:bg-neutral-800 hover:text-yellow-400 text-neutral-300 font-bold flex items-center justify-center text-xs border border-neutral-800 transition cursor-pointer';

  return (
    <div className="absolute bottom-48 left-6 z-10 flex bg-black/85 border border-neutral-800 p-1 rounded-xl backdrop-blur-md gap-0.5 shadow-lg">
      <button onClick={() => main.zoomIn()} className={btn} aria-label="Zoom in">
        +
      </button>
      <button onClick={() => main.zoomOut()} className={btn} aria-label="Zoom out">
        -
      </button>
      <button
        onClick={() => {
          if (onReset) onReset();
          main.flyTo({ center: [DEFAULT_USER_LOCATION.lon, DEFAULT_USER_LOCATION.lat], zoom: 15, duration: 800 });
        }}
        className={`${btn} text-neutral-400 font-mono text-[8px]`}
        title="Reset Map"
      >
        RST
      </button>
    </div>
  );
}
