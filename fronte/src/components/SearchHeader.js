'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Navigation
} from 'lucide-react';
import { getCategoryLabel, validateAddress } from '../utils/helpers';

export default function SearchHeader({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  isLiveBackend,
  setIsProfileModalOpen,
  venues = [],
  onSelectVenue
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [liveSuggestions, setLiveSuggestions] = useState([]);
  const [isSearchingBackend, setIsSearchingBackend] = useState(false);
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  const categories = [
    { id: 'all', label: 'All', icon: MapPin },
    { id: 'cafe', label: 'Cafes', icon: Coffee },
    { id: 'restaurant', label: 'Restaurants', icon: Utensils },
    { id: 'nightclub', label: 'Nightclubs', icon: Music },
    { id: 'gym', label: 'Gyms', icon: Dumbbell },
    { id: 'park', label: 'Parks', icon: Trees }
  ];

  // Address/street validation check before passing to backend
  const validation = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length === 0) return null;
    const trimmed = searchQuery.trim();
    // Check if input has valid alphanumeric content
    if (!/[a-zA-Z0-9]/.test(trimmed)) {
      return { isValid: false, message: 'Address must contain letters or numbers' };
    }
    // Check against excessive length
    if (trimmed.length > 100) {
      return { isValid: false, message: 'Search query is too long' };
    }
    return { isValid: true };
  }, [searchQuery]);

  // Live Backend Search with debounce & frontend input control
  useEffect(() => {
    const trimmed = searchQuery ? searchQuery.trim() : '';
    
    // Only query if valid and length >= 2
    if (!trimmed || trimmed.length < 2 || (validation && !validation.isValid)) {
      setLiveSuggestions([]);
      setIsSearchingBackend(false);
      return;
    }

    if (!isLiveBackend) {
      // In sandbox mode, filter client-side venues
      const q = trimmed.toLowerCase();
      const localMatches = venues.filter((v) => {
        const name = v.name ? v.name.toLowerCase() : '';
        const address = v.address ? v.address.toLowerCase() : '';
        const category = v.category ? v.category.toLowerCase() : '';
        return name.includes(q) || address.includes(q) || category.includes(q);
      }).slice(0, 5);
      setLiveSuggestions(localMatches);
      return;
    }

    // When Live Backend is connected, query backend search endpoint
    let isCancelled = false;
    setIsSearchingBackend(true);

    const debounceTimer = setTimeout(async () => {
      try {
        const sanitized = encodeURIComponent(trimmed);
        const res = await fetch(`http://localhost:5000/venues/search?q=${sanitized}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && Array.isArray(data)) {
            setLiveSuggestions(data.slice(0, 5));
          }
        } else {
          throw new Error('Fallback to local');
        }
      } catch (e) {
        // Fallback to local venues if backend search fails
        if (!isCancelled) {
          const q = trimmed.toLowerCase();
          const fallback = (venues || []).filter((v) => {
            const name = v && v.name ? v.name.toLowerCase() : '';
            const address = v && v.address ? v.address.toLowerCase() : '';
            return name.includes(q) || address.includes(q);
          }).slice(0, 5);
          setLiveSuggestions(fallback);
        }
      } finally {
        if (!isCancelled) {
          setIsSearchingBackend(false);
        }
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, isLiveBackend, venues, validation]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveSuggestionIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectVenue = useCallback((venue) => {
    setSearchQuery(venue.name);
    if (onSelectVenue) {
      onSelectVenue(venue.id, venue);
    }
    setIsOpen(false);
    setActiveSuggestionIndex(-1);
  }, [onSelectVenue, setSearchQuery]);

  // Keyboard navigation for address suggestions
  const handleKeyDown = (e) => {
    if (!isOpen || liveSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => 
        prev < liveSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => 
        prev > 0 ? prev - 1 : liveSuggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < liveSuggestions.length) {
        handleSelectVenue(liveSuggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setIsOpen(false);
    setActiveSuggestionIndex(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleFocus = () => {
    if (searchQuery && searchQuery.trim().length >= 2) {
      setIsOpen(true);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setActiveSuggestionIndex(-1);
    if (val.trim().length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const showDropdown = isOpen && searchQuery && searchQuery.trim().length >= 2;

  return (
    <div className="absolute top-6 left-6 z-20 w-96 max-w-[calc(100vw-3rem)] flex flex-col gap-3">
      <div className="bg-black/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.85)]">
        {/* Brand Header Bar */}
        <div className="flex items-center gap-2 mb-3 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-yellow-400/10 border border-yellow-400/35 flex items-center justify-center text-yellow-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <span className="text-xs font-mono font-bold tracking-widest text-white">
              CROWD<span className="text-yellow-400">SENSE</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase tracking-widest font-bold ${
              isLiveBackend 
                ? 'bg-yellow-950/80 text-yellow-400 border border-yellow-500/30 shadow-[0_0_10px_rgba(250,204,21,0.25)] animate-pulse'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
            }`}>
              {isLiveBackend ? 'Live Backend' : 'Sandbox Mode'}
            </span>
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="p-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-yellow-400 hover:border-neutral-700 transition cursor-pointer"
              title="Reporter Profile"
            >
              <User className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Address & Street Input with Controlled Validation & Autocomplete */}
        <div className="relative" ref={searchContainerRef}>
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type address, street name, cafe, gym..."
            className={`w-full pl-9 pr-8 py-2 text-xs bg-neutral-900/90 border rounded-xl text-white placeholder-neutral-500 focus:outline-none transition ${
              validation && !validation.isValid
                ? 'border-red-500/80 focus:border-red-500'
                : 'border-neutral-800 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30'
            }`}
            value={searchQuery}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
          />
          {searchQuery && (
            <button 
              onClick={handleClear}
              className="absolute right-3 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Inline Validation Feedback */}
          {validation && !validation.isValid && (
            <div className="flex items-center gap-1 text-[10px] text-red-400 mt-1 pl-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{validation.message}</span>
            </div>
          )}

          {/* Autocomplete Suggestions Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl overflow-hidden py-1 divide-y divide-neutral-900">
              <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider text-yellow-400 font-semibold bg-neutral-900/70 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  Address & Street Suggestions
                </span>
                {isSearchingBackend ? (
                  <span className="flex items-center gap-1 text-neutral-400">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Checking DB...
                  </span>
                ) : (
                  <span className="text-neutral-400 font-normal">{(Array.isArray(liveSuggestions) ? liveSuggestions : []).length} verified</span>
                )}
              </div>
              
              {Array.isArray(liveSuggestions) && liveSuggestions.length > 0 ? (
                liveSuggestions.map((venue, index) => {
                  if (!venue) return null;
                  const queryLower = searchQuery.toLowerCase().trim();
                  const addressMatches = venue.address && venue.address.toLowerCase().includes(queryLower);
                  const isHighlighted = index === activeSuggestionIndex;

                  return (
                    <button
                      key={venue.id || index}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectVenue(venue)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer group ${
                        isHighlighted 
                          ? 'bg-neutral-800/90 text-white' 
                          : 'hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-white group-hover:text-yellow-400 transition-colors truncate">
                            {venue.name}
                          </span>
                          <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 shrink-0 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2 h-2" />
                            Verified
                          </span>
                        </div>
                        
                        {/* Address row with street highlight */}
                        <div className="flex items-center gap-1 text-[11px] text-neutral-400 truncate mt-0.5">
                          <MapPin className={`w-3 h-3 shrink-0 ${addressMatches ? 'text-yellow-400' : 'text-neutral-500'}`} />
                          <span className={`truncate ${addressMatches ? 'text-yellow-300 font-medium' : ''}`}>
                            {venue.address}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800 capitalize">
                          {getCategoryLabel(venue.category)}
                        </span>
                        {venue.current_score !== undefined && (
                          <span className="text-[8px] font-mono text-neutral-400">
                            {venue.current_score}% busy
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-3 text-xs text-neutral-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-neutral-500" />
                  <span>No registered address or venue matches &quot;{searchQuery}&quot;.</span>
                </div>
              )}
            </div>
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition border cursor-pointer ${
                  isActive 
                    ? 'bg-yellow-400 text-black border-yellow-300 font-bold shadow-sm' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
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
