'use client';

import React from 'react';
import { 
  Search, 
  X, 
  Radio, 
  MapPin, 
  Coffee, 
  Utensils, 
  Music, 
  Dumbbell, 
  Trees,
  User
} from 'lucide-react';
import { getCategoryLabel } from '../utils/helpers';

export default function SearchHeader({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  isLiveBackend,
  setIsProfileModalOpen
}) {
  const categories = [
    { id: 'all', label: 'All', icon: MapPin },
    { id: 'cafe', label: 'Cafes', icon: Coffee },
    { id: 'restaurant', label: 'Restaurants', icon: Utensils },
    { id: 'nightclub', label: 'Nightclubs', icon: Music },
    { id: 'gym', label: 'Gyms', icon: Dumbbell },
    { id: 'park', label: 'Parks', icon: Trees }
  ];

  return (
    <div className="absolute top-6 left-6 z-10 w-96 max-w-[calc(100vw-3rem)] flex flex-col gap-3">
      <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 mb-3 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <span className="text-xs font-mono font-bold tracking-widest text-slate-300">CROWDSENSE</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase tracking-widest font-bold ${
              isLiveBackend 
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.25)] animate-pulse'
                : 'bg-slate-900 border border-slate-850 text-slate-500'
            }`}>
              {isLiveBackend ? 'Live Backend' : 'Sandbox Mode'}
            </span>
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="p-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Reporter Profile"
            >
              <User className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search place, street, caffe, club..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900/90 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories select row */}
        <div className="flex gap-1 overflow-x-auto pt-3 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition border ${
                  isActive 
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-semibold shadow-sm' 
                    : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-2.5 h-2.5" />
                {getCategoryLabel(cat.id)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
