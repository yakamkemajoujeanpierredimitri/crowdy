"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, UploadCloud, CheckCircle, AlertCircle, Search, MapPin, X, Loader2 } from 'lucide-react';
import { INITIAL_VENUES } from '@/data/venues';
import { validateClaim, validateAddress } from '@/utils/helpers';

export default function BusinessClaimPage() {
  const { user } = useAuth();
  const [venueId, setVenueId] = useState('');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [lookupQuery, setLookupQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [documents, setDocuments] = useState('');
  const [touched, setTouched] = useState({ venue: false, documents: false });
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch venue & street address suggestions on input change
  useEffect(() => {
    const trimmed = lookupQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    let active = true;
    const fetchVenues = async () => {
      setIsSearching(true);
      const q = trimmed.toLowerCase();

      try {
        // 1. Query backend search endpoint
        const res = await fetch(`http://localhost:5000/venues/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            setSuggestions(data.slice(0, 5));
            setIsSearching(false);
            return;
          }
        }
        throw new Error('Fallback to nearby / local');
      } catch {
        // 2. Fall back to nearby endpoint
        try {
          const resNearby = await fetch('http://localhost:5000/venues/nearby');
          if (resNearby.ok) {
            const allVenues = await resNearby.json();
            if (active && Array.isArray(allVenues)) {
              const filtered = allVenues.filter((v) =>
                (v.name && v.name.toLowerCase().includes(q)) ||
                (v.address && v.address.toLowerCase().includes(q))
              ).slice(0, 5);
              setSuggestions(filtered);
              setIsSearching(false);
              return;
            }
          }
        } catch {
          // ignore
        }

        // 3. Fall back to local verified venues dataset
        if (active) {
          const filtered = INITIAL_VENUES.filter((v) =>
            (v.name && v.name.toLowerCase().includes(q)) ||
            (v.address && v.address.toLowerCase().includes(q))
          ).slice(0, 5);
          setSuggestions(filtered);
        }
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchVenues();
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [lookupQuery]);

  const handleSelectVenue = (venue) => {
    setSelectedVenue(venue);
    setVenueId(venue.id);
    setLookupQuery(venue.name);
    setIsDropdownOpen(false);
    setTouched(prev => ({ ...prev, venue: true }));
  };

  const handleClearVenue = () => {
    setSelectedVenue(null);
    setVenueId('');
    setLookupQuery('');
    setSuggestions([]);
    setIsDropdownOpen(false);
  };

  // Frontend validation
  const validation = useMemo(() => {
    return validateClaim({
      venueId,
      documents,
      userId: user?.id
    });
  }, [venueId, documents, user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ venue: true, documents: true });

    if (!validation.isValid) {
      setErrorMessage(validation.error);
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venueId,
          userId: user?.id,
          documents,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit claim');
      }

      setStatus('success');
    } catch (err) {
      setErrorMessage(err.message || 'Submission failed');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setVenueId('');
    setSelectedVenue(null);
    setLookupQuery('');
    setDocuments('');
    setErrorMessage('');
    setTouched({ venue: false, documents: false });
  };

  return (
    <div className="max-w-2xl mx-auto p-8 mt-12 bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-800 text-neutral-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Claim Your Venue</h1>
          <p className="text-xs text-neutral-400 font-mono">Verify address and business ownership</p>
        </div>
      </div>
      
      <p className="text-sm text-neutral-300 mb-8 leading-relaxed">
        Take control of your CrowdSense presence. Controlled validation ensures the address matches backend records before any verification request is processed.
      </p>

      {status === 'success' ? (
        <div className="bg-neutral-900 border border-yellow-400/30 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-yellow-400/10 border border-yellow-400/40 flex items-center justify-center text-yellow-400 mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Claim Submitted for Verification!</h2>
          <p className="text-sm text-neutral-300 max-w-md">
            Our team will review your verification documents against the verified venue address. You will be notified once approved.
          </p>
          <button 
            onClick={handleReset}
            className="mt-6 px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold font-mono rounded-lg transition cursor-pointer"
          >
            Submit Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === 'error' && (
            <div className="bg-red-950/80 text-red-200 p-4 rounded-xl flex items-center gap-2 border border-red-500/40 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Address & Venue Lookup with Autocomplete */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Search Address or Venue Name
            </label>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                <input 
                  type="text" 
                  value={lookupQuery}
                  onChange={(e) => {
                    setLookupQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (lookupQuery.trim().length >= 2 && suggestions.length > 0) {
                      setIsDropdownOpen(true);
                    }
                  }}
                  placeholder="Type street name, address, or venue (e.g. Spruce Ave, Broad St)..."
                  className="w-full pl-9 pr-9 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 text-sm"
                />
                {lookupQuery && (
                  <button
                    type="button"
                    onClick={handleClearVenue}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {isDropdownOpen && lookupQuery.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto divide-y divide-neutral-800/60">
                  {isSearching ? (
                    <div className="px-4 py-3 text-xs text-neutral-400 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-400" />
                      Searching verified addresses...
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((venue) => (
                      <button
                        key={venue.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectVenue(venue)}
                        className="w-full text-left px-4 py-2.5 hover:bg-neutral-800 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-white group-hover:text-yellow-400 truncate">
                            {venue.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                            <span className="truncate">{venue.address}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700/60 shrink-0 capitalize">
                          {venue.category || 'venue'}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-neutral-400 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-neutral-500" />
                      <span>No matching address found for &quot;{lookupQuery}&quot;.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Venue / Address Card */}
            {selectedVenue ? (
              <div className="mt-3 p-4 bg-yellow-400/5 border border-yellow-400/30 rounded-xl flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-yellow-400">
                      Verified Match:
                    </span>
                    <span className="text-sm font-bold text-white truncate">{selectedVenue.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-300 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <span>{selectedVenue.address}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-neutral-800 flex items-center gap-2 text-xs">
                    <span className="text-neutral-400 font-mono">Backend Venue ID:</span>
                    <code className="font-mono bg-neutral-900 text-yellow-400 px-2 py-0.5 rounded border border-neutral-800 text-[11px]">
                      {venueId}
                    </code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearVenue}
                  className="text-xs text-yellow-400 hover:text-yellow-300 font-medium hover:underline shrink-0 cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 mt-1.5">
                Start typing to select a venue. The address must coincide with a registered location in the database.
              </p>
            )}

            {touched.venue && !venueId && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Please select a venue with a verified address.
              </p>
            )}
          </div>

          {/* Verification Documents with validation */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Verification Documents / License Details
            </label>
            <div className="border border-dashed border-neutral-800 rounded-xl p-5 text-center hover:bg-neutral-900/50 transition-colors">
              <UploadCloud className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-xs text-neutral-300 mb-1">Utility bill, business license, or official verification URL</p>
              <p className="text-[10px] text-neutral-500 font-mono">(Must be at least 10 characters long)</p>
            </div>
            <textarea
              required
              value={documents}
              onChange={(e) => {
                setDocuments(e.target.value);
                setTouched(prev => ({ ...prev, documents: true }));
              }}
              onBlur={() => setTouched(prev => ({ ...prev, documents: true }))}
              placeholder="Paste document verification link or commercial registry certificate..."
              className={`w-full mt-2.5 px-4 py-2.5 bg-neutral-900 border rounded-xl text-white placeholder-neutral-500 focus:outline-none transition h-24 text-sm ${
                touched.documents && documents.trim().length < 10
                  ? 'border-red-500/80 focus:border-red-500'
                  : 'border-neutral-800 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30'
              }`}
            ></textarea>
            {touched.documents && documents.trim().length < 10 && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Documents description must be at least 10 characters long.
              </p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={status === 'submitting' || !venueId || documents.trim().length < 10}
            className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold font-mono rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {status === 'submitting' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                Validating with Backend...
              </>
            ) : (
              'Submit Claim'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
