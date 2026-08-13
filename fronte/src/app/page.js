'use client';

import React, { useState, useEffect, useMemo } from 'react';
import CityMap from '../components/CityMap';
import SearchHeader from '../components/SearchHeader';
import VenueDetailCard from '../components/VenueDetailCard';
import SimulationWidget from '../components/SimulationWidget';
import ZoomControls from '../components/ZoomControls';
import Toast from '../components/Toast';
import UserProfileModal from '../components/UserProfileModal';
import { INITIAL_VENUES } from '../data/venues';
import { checkAnomaly, getDistance, classifyScore } from '../utils/helpers';

export default function SimpleCrowdSense() {
  // --- Simulation States ---
  const [simTime, setSimTime] = useState(new Date('2026-07-16T12:00:00'));
  const [isPlayMode, setIsPlayMode] = useState(false);
  const currentHour = simTime.getHours();

  // --- Backend Integration States ---
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const BACKEND_URL = 'http://localhost:5000';

  // --- Core States ---
  const [venues, setVenues] = useState(INITIAL_VENUES);
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // --- User Identity ---
  const [userId, setUserId] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem('crowdsense_user_id');
    if (savedId) {
      setUserId(savedId);
    } else {
      const newId = `User-Client-${Math.floor(100 + Math.random()*900)}`;
      setUserId(newId);
      localStorage.setItem('crowdsense_user_id', newId);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      localStorage.setItem('crowdsense_user_id', userId);
    }
  }, [userId]);
  
  // User Location coordinates on the SVG map (draggable pin)
  const [userLoc, setUserLoc] = useState({ x: 380, y: 280 });

  // Active User Reports (Used in Sandbox fallback Mode)
  const [userReports, setUserReports] = useState([
    { id: 'ur1', venueId: 'v1', score: 76, created_at: new Date('2026-07-16T11:10:00'), reputation_weight: 1.0, reporterName: 'Reporter-1804' },
    { id: 'ur2', venueId: 'v1', score: 78, created_at: new Date('2026-07-16T11:20:00'), reputation_weight: 1.0, reporterName: 'Reporter-2945' },
    { id: 'ur3', venueId: 'v1', score: 79, created_at: new Date('2026-07-16T11:30:00'), reputation_weight: 1.2, reporterName: 'Reporter-8723' },
    { id: 'ur4', venueId: 'v1', score: 75, created_at: new Date('2026-07-16T11:40:00'), reputation_weight: 0.8, reporterName: 'Reporter-4410' },
    { id: 'ur5', venueId: 'v1', score: 77, created_at: new Date('2026-07-16T11:50:00'), reputation_weight: 1.0, reporterName: 'Reporter-9021' },
  ]);

  const [toast, setToast] = useState(null);
  const [zoom, setZoom] = useState(1);

  // --- Clock Auto Play Effect (Sandbox Mode Only) ---
  useEffect(() => {
    if (isLiveBackend) return;
    let interval = null;
    if (isPlayMode) {
      interval = setInterval(() => {
        setSimTime(prev => {
          const next = new Date(prev);
          next.setHours((next.getHours() + 1) % 24);
          return next;
        });
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isPlayMode, isLiveBackend]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Live Backend Connectivity Ping on Mount ---
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/venues/nearby`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            // Coordinate mapping (from GPS coordinates back to local SVG 800x600 grid pixels)
            const mapped = data.map(v => ({
              id: v.id,
              name: v.name,
              category: v.category,
              x: Math.round((v.lon - (-74.0060)) / 0.000017828),
              y: Math.round((40.7128 - v.lat) / 0.000013513),
              description: v.description,
              address: v.address,
              capacity: v.capacity,
              google_place_id: v.google_place_id,
              lambda: v.lambda,
              hours: v.hours,
              website: v.website,
              image: v.image,
              current_score: v.current_score,
              label: v.label,
              source: v.source || 'Google Times',
              distance: v.distance,
              activeReports: [] 
            }));
            
            setVenues(mapped);
            setIsLiveBackend(true);
            showToast('Connected to Live NestJS Backend!', 'success');
          }
        }
      } catch (err) {
        console.log('NestJS Backend not detected. Defaulting to local sandbox simulator.');
      }
    };
    checkBackendConnection();
  }, []);

  // --- Socket.io Client listener for live scores (Live Backend Mode Only) ---
  useEffect(() => {
    if (!isLiveBackend || venues.length === 0) return;

    // Dynamically import socket.io-client to avoid server rendering crashes in Next.js
    import('socket.io-client').then(({ io }) => {
      const socket = io(BACKEND_URL);

      // Join rooms for all venues
      venues.forEach(v => {
        socket.emit('subscribe', { venueId: v.id });
      });

      socket.on('score_update', (payload) => {
        setVenues(prev => prev.map(v => {
          if (v.id === payload.venueId) {
            return {
              ...v,
              current_score: payload.score,
              label: payload.label,
              color: payload.color,
              source: payload.source
            };
          }
          return v;
        }));
      });

      return () => {
        socket.disconnect();
      };
    });
  }, [isLiveBackend, venues.length]);

  // --- Fetch detailed active reports and 24h history on place select (Live Mode) ---
  useEffect(() => {
    if (!isLiveBackend || !selectedVenueId) return;

    const fetchVenueDetails = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/venues/${selectedVenueId}/crowd`);
        if (res.ok) {
          const data = await res.json();
          setVenues(prev => prev.map(v => {
            if (v.id === selectedVenueId) {
              return {
                ...v,
                history: data.history,
                activeReports: data.recentReports.map(r => ({
                  id: r.id,
                  score: r.score,
                  created_at: new Date(r.created_at),
                  deltaMinutes: (new Date().getTime() - new Date(r.created_at).getTime()) / 60000,
                  decayedScore: r.score, 
                  reputation_weight: 1.0,
                  reporterName: r.user_id.slice(0, 12)
                }))
              };
            }
            return v;
          }));
        }
      } catch (e) {
        console.error('Failed to fetch venue profile details:', e);
      }
    };
    fetchVenueDetails();
  }, [isLiveBackend, selectedVenueId]);

  // --- Recalculate Live Scores (Client-Side Simulator Sandbox Mode Only) ---
  const computedVenues = useMemo(() => {
    if (isLiveBackend) {
      // In Live Mode, distances are recalculated based on user coordinates on drag
      return venues.map(v => {
        const distance = getDistance(v.x, v.y, userLoc.x, userLoc.y);
        const classification = classifyScore(v.current_score);
        return {
          ...v,
          distance,
          label: classification.label,
          color: classification.color,
          bg: classification.bg,
          border: classification.border
        };
      });
    }

    return venues.map(venue => {
      const googleScore = venue.history[currentHour];
      const reports = userReports.filter(r => r.venueId === venue.id);

      const lambda = venue.lambda;
      const nowMs = simTime.getTime();

      const activeDecayedReports = [];
      const reportsInLastHour = [];

      reports.forEach(report => {
        const deltaMs = nowMs - report.created_at.getTime();
        const deltaMinutes = deltaMs / 60000;

        if (deltaMinutes < 0) return;
        if (deltaMinutes > 240) return;

        const decayedScore = report.score * Math.exp(-lambda * deltaMinutes);
        const repWeight = report.reputation_weight;
        const weightedDecayedScore = decayedScore * repWeight;

        activeDecayedReports.push({
          ...report,
          decayedScore,
          weightedDecayedScore,
          deltaMinutes
        });

        if (deltaMinutes <= 60) {
          reportsInLastHour.push(report);
        }
      });

      const recentCount = reportsInLastHour.length;
      const w2 = recentCount >= 3 ? 0.65 : 0.45;
      const w1 = 1 - w2;

      let finalScore;
      let scoreSource = 'Google Times';

      if (activeDecayedReports.length > 0) {
        const sumWeights = activeDecayedReports.length;
        const sumWeightedDecayed = activeDecayedReports.reduce((sum, r) => sum + r.weightedDecayedScore, 0);
        const userScoreAvg = sumWeightedDecayed / sumWeights;
        
        const raw = (w1 * googleScore) + (w2 * userScoreAvg);
        finalScore = Math.round(Math.min(100, Math.max(0, raw)));
        scoreSource = `Verified Live`;
      } else {
        finalScore = googleScore;
      }

      const classification = classifyScore(finalScore);
      const distance = getDistance(venue.x, venue.y, userLoc.x, userLoc.y);

      return {
        ...venue,
        googleScore,
        current_score: finalScore,
        label: classification.label,
        color: classification.color,
        bg: classification.bg,
        border: classification.border,
        source: scoreSource,
        activeReports: activeDecayedReports,
        distance
      };
    });
  }, [venues, userReports, simTime, userLoc, currentHour, isLiveBackend]);

  // Selected venue details
  const selectedVenue = useMemo(() => {
    return computedVenues.find(v => v.id === selectedVenueId) || null;
  }, [computedVenues, selectedVenueId]);

  // Search filter status for each venue pin
  const venueFilters = useMemo(() => {
    return computedVenues.reduce((acc, v) => {
      const matchesSearch = searchQuery === '' || 
                            v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            v.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            v.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || v.category === selectedCategory;
      
      acc[v.id] = matchesSearch && matchesCategory;
      return acc;
    }, {});
  }, [computedVenues, searchQuery, selectedCategory]);

  // --- Submit Report ---
  const submitLiveReport = async (reportedScore) => {
    if (!selectedVenue) return;
    const isNearby = selectedVenue.distance <= 250;

    if (isLiveBackend) {
      try {
        const res = await fetch(`${BACKEND_URL}/reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            venueId: selectedVenue.id,
            score: reportedScore,
            userId: userId,
            sourceType: isNearby ? 'manual' : 'gps_warning'
          })
        });

        if (res.ok) {
          const result = await res.json();
          if (result.status === 'discarded') {
            showToast(result.message, 'error');
          } else {
            showToast(isNearby ? 'Report submitted to live server!' : 'Remote report submitted with penalties.');
            // Refetch active reports for current venue immediately
            const detailRes = await fetch(`${BACKEND_URL}/venues/${selectedVenue.id}/crowd`);
            if (detailRes.ok) {
              const data = await detailRes.json();
              setVenues(prev => prev.map(v => {
                if (v.id === selectedVenue.id) {
                  return {
                    ...v,
                    history: data.history,
                    activeReports: data.recentReports.map(r => ({
                      id: r.id,
                      score: r.score,
                      created_at: new Date(r.created_at),
                      deltaMinutes: (new Date().getTime() - new Date(r.created_at).getTime()) / 60000,
                      decayedScore: r.score, 
                      reputation_weight: 1.0,
                      reporterName: r.user_id.slice(0, 12)
                    }))
                  };
                }
                return v;
              }));
            }
          }
        } else {
          const errData = await res.json();
          showToast(errData.message || 'Submission failed.', 'error');
        }
      } catch (e) {
        showToast('Failed to connect to backend server.', 'error');
      }
      return;
    }
    
    // Local Sandbox Submission fallback
    const recentVenueReports = userReports.filter(r => r.venueId === selectedVenue.id);
    const anomalyCheck = checkAnomaly(reportedScore, recentVenueReports);
    
    if (anomalyCheck.result === 'discard') {
      showToast('Report blocked by anomaly shield (out of normal range).', 'error');
      return;
    }

    const newReport = {
      id: `ur-${Date.now()}`,
      venueId: selectedVenue.id,
      score: reportedScore,
      created_at: new Date(simTime.getTime()),
      reputation_weight: isNearby ? 1.0 : 0.5,
      reporterName: userId
    };

    setUserReports(prev => [newReport, ...prev]);
    showToast(isNearby ? 'Crowd report added! Updated map.' : 'Report submitted (remote penalty applied).');
  };

  return (
    <div className="relative w-screen h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans antialiased">
      
      {/* Toast Notification */}
      <Toast toast={toast} />

      {/* MAP CANVAS (FULL-SCREEN) */}
      <CityMap
        zoom={zoom}
        userLoc={userLoc}
        setUserLoc={setUserLoc}
        computedVenues={computedVenues}
        venueFilters={venueFilters}
        selectedVenueId={selectedVenueId}
        setSelectedVenueId={setSelectedVenueId}
      />

      {/* FLOATING HEADER (SEARCH BOX + CATEGORIES) */}
      <SearchHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        isLiveBackend={isLiveBackend}
        setIsProfileModalOpen={setIsProfileModalOpen}
      />

      {/* FLOATING DETAIL CARD (RIGHT SIDE OVERLAY) */}
      <VenueDetailCard
        selectedVenue={selectedVenue}
        setSelectedVenueId={setSelectedVenueId}
        isLiveBackend={isLiveBackend}
        submitLiveReport={submitLiveReport}
        currentHour={currentHour}
        simTime={simTime}
        setSimTime={setSimTime}
        showToast={showToast}
      />

      {/* FLOATING SIMULATION WIDGET (BOTTOM LEFT OVERLAY) */}
      <SimulationWidget
        isLiveBackend={isLiveBackend}
        isPlayMode={isPlayMode}
        setIsPlayMode={setIsPlayMode}
        simTime={simTime}
        setSimTime={setSimTime}
        currentHour={currentHour}
      />

      {/* Map Zoom Controls */}
      <ZoomControls
        setZoom={setZoom}
        setUserLoc={setUserLoc}
      />

      {/* User Profile Modal */}
      <UserProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={userId}
        setUserId={setUserId}
      />

    </div>
  );
}
