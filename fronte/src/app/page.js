'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Coffee, 
  Dumbbell, 
  Trees, 
  Sliders, 
  Navigation, 
  Check, 
  AlertCircle, 
  Radio,
  Play,
  Pause,
  X,
  Utensils,
  Music,
  Globe,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

// ==========================================
// CONSTANTS & INITIAL DATA
// ==========================================

const INITIAL_VENUES = [
  {
    id: 'v1',
    name: 'Velvet Roast Cafe',
    category: 'cafe',
    x: 280,
    y: 190,
    description: 'Artisanal espresso, fresh pastries, and home-roasted beans in a cozy, plant-filled space. Popular with remote workers.',
    address: '402 Spruce Ave',
    capacity: 45,
    google_place_id: 'ChIJ-velvet-roast',
    lambda: 0.05, // Fast turnover (decays quickly)
    hours: '07:00 AM - 08:00 PM',
    website: 'https://velvetroastcafe.com',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    history: [5, 5, 5, 5, 10, 25, 55, 75, 80, 70, 60, 65, 75, 70, 50, 45, 50, 40, 30, 20, 15, 10, 5, 5],
    activeReports: []
  },
  {
    id: 'v2',
    name: 'Pulse Fitness Gym',
    category: 'gym',
    x: 180,
    y: 350,
    description: 'Sleek modern gym with cardio decks, Olympic lifting platforms, and dynamic HIIT classes.',
    address: '110 Broad Street',
    capacity: 120,
    google_place_id: 'ChIJ-pulse-fitness',
    lambda: 0.012,
    hours: '05:00 AM - 11:00 PM',
    website: 'https://pulsefitness.com',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    history: [5, 5, 5, 15, 45, 75, 80, 60, 40, 30, 35, 40, 45, 40, 35, 50, 75, 85, 80, 55, 30, 15, 5, 5],
    activeReports: []
  },
  {
    id: 'v3',
    name: 'Summit Green Park',
    category: 'park',
    x: 520,
    y: 220,
    description: 'Spacious community park featuring walking trails, a dog park, and a scenic central pond.',
    address: '800 Parkside Blvd',
    capacity: 500,
    google_place_id: 'ChIJ-summit-green',
    lambda: 0.008, // Slowest turnover (decays very slowly)
    hours: '06:00 AM - 10:00 PM',
    website: 'https://cityparks.gov/summit-green',
    image: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=600&q=80',
    history: [0, 0, 0, 0, 0, 10, 20, 30, 35, 40, 45, 55, 60, 58, 50, 48, 55, 50, 35, 20, 10, 5, 0, 0],
    activeReports: []
  },
  {
    id: 'v4',
    name: 'Neon Rhythm Club',
    category: 'nightclub',
    x: 290,
    y: 420,
    description: 'Electrifying underground nightclub featuring state-of-the-art surround sound, laser shows, and guest DJs.',
    address: '205 Commercial Way',
    capacity: 250,
    google_place_id: 'ChIJ-neon-rhythm',
    lambda: 0.015,
    hours: '09:00 PM - 04:00 AM',
    website: 'https://neonrhythm.club',
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=600&q=80',
    history: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 30, 50, 75, 95, 90, 80, 50],
    activeReports: []
  },
  {
    id: 'v5',
    name: 'The Daily Grind',
    category: 'cafe',
    x: 450,
    y: 480,
    description: 'Popular student cafe with high-speed internet, study booths, and endless filter coffee refills.',
    address: '88 University Dr',
    capacity: 60,
    google_place_id: 'ChIJ-daily-grind',
    lambda: 0.05,
    hours: '06:30 AM - 11:00 PM',
    website: 'https://dailygrind.edu',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    history: [5, 5, 5, 5, 10, 15, 35, 55, 65, 75, 80, 85, 90, 85, 70, 65, 60, 50, 35, 20, 15, 10, 5, 5],
    activeReports: []
  },
  {
    id: 'v6',
    name: 'Gusto Bistro & Trattoria',
    category: 'restaurant',
    x: 620,
    y: 380,
    description: 'Charming modern Italian ristorante specializing in seasonal farm-to-table cuisine and curated wines.',
    address: '15 Design District',
    capacity: 80,
    google_place_id: 'ChIJ-gusto-bistro',
    lambda: 0.02,
    hours: '12:00 PM - 11:00 PM',
    website: 'https://gustobistro.com',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80',
    history: [0, 0, 0, 0, 0, 0, 0, 5, 15, 25, 45, 75, 80, 60, 45, 40, 55, 80, 90, 85, 60, 30, 10, 0],
    activeReports: []
  },
  {
    id: 'v7',
    name: 'Eclipse Rooftop Lounge',
    category: 'nightclub',
    x: 680,
    y: 150,
    description: 'Sleek neon rooftop lounge offering signature cocktails, deep house sets, and skyline panoramic views.',
    address: '33 Industrial Ave',
    capacity: 150,
    google_place_id: 'ChIJ-eclipse-lounge',
    lambda: 0.012,
    hours: '10:00 PM - 05:00 AM',
    website: 'https://eclipselounge.club',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    history: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 35, 55, 80, 95, 90, 85, 60],
    activeReports: []
  },
  {
    id: 'v8',
    name: 'La Bella Italia',
    category: 'restaurant',
    x: 120,
    y: 140,
    description: 'Cozy authentic family restaurant serving classic wood-fired pizzas, fresh pastas, and local gelato.',
    address: '10 Canal Road',
    capacity: 90,
    google_place_id: 'ChIJ-la-bella-italia',
    lambda: 0.02,
    hours: '11:30 AM - 10:00 PM',
    website: 'https://labellaitalia.com',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    history: [0, 0, 0, 0, 0, 0, 0, 10, 20, 30, 50, 75, 80, 65, 45, 40, 50, 75, 85, 80, 60, 35, 15, 5],
    activeReports: []
  }
];

function classifyScore(score) {
  if (score <= 20) return { label: 'Empty', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' };
  if (score <= 40) return { label: 'Quiet', color: '#34D399', bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.3)' };
  if (score <= 60) return { label: 'Moderate', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' };
  if (score <= 80) return { label: 'Busy', color: '#EF6C00', bg: 'rgba(239, 108, 0, 0.1)', border: 'rgba(239, 108, 0, 0.3)' };
  return { label: 'Packed', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' };
}

// Z-Score Anomaly check
function checkAnomaly(newScore, recentReports) {
  if (recentReports.length < 5) return { result: 'accept', zScore: 0 };
  
  const scores = recentReports.map(r => r.score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) {
    const diff = Math.abs(newScore - mean);
    if (diff > 35) return { result: 'discard', zScore: 9.9 };
    return { result: 'accept', zScore: 0 };
  }
  
  const z = Math.abs((newScore - mean) / stdDev);
  
  if (z > 3.5) return { result: 'discard', zScore: Number(z.toFixed(2)) };
  if (z > 2.5) return { result: 'flag', zScore: Number(z.toFixed(2)) };
  return { result: 'accept', zScore: Number(z.toFixed(2)) };
}

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
  
  // User Location coordinates on the SVG map (draggable pin)
  const [userLoc, setUserLoc] = useState({ x: 380, y: 280 });
  const [isDraggingUser, setIsDraggingUser] = useState(false);

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

  const getDistance = (vX, vY, uX, uY) => {
    const dx = vX - uX;
    const dy = vY - uY;
    return Math.round(Math.sqrt(dx * dx + dy * dy) * 1.5);
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
      return venues.map(v => ({
        ...v,
        distance: getDistance(v.x, v.y, userLoc.x, userLoc.y)
      }));
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
            userId: `User-Client-${Math.floor(100 + Math.random()*900)}`,
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
      reporterName: `User-${Math.floor(1000 + Math.random() * 9000)}`
    };

    setUserReports(prev => [newReport, ...prev]);
    showToast(isNearby ? 'Crowd report added! Updated map.' : 'Report submitted (remote penalty applied).');
  };

  // --- Reset All Reports ---
  const handleResetScores = async () => {
    if (isLiveBackend) {
      showToast('Flushing backend reports not enabled inside client-side.', 'error');
      return;
    }
    setUserReports([]);
    showToast('Flushed local reports.');
  };

  // Dragging user pin
  const handleMapMouseDown = (e) => {
    if (e.target.id === 'user-pin-target') {
      setIsDraggingUser(true);
    }
  };

  const handleMapMouseMove = (e) => {
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
  };

  const handleMapMouseUp = () => {
    if (isDraggingUser) {
      setIsDraggingUser(false);
    }
  };

  useEffect(() => {
    if (isDraggingUser) {
      window.addEventListener('mouseup', handleMapMouseUp);
      window.addEventListener('mousemove', handleMapMouseMove);
    }
    return () => {
      window.removeEventListener('mouseup', handleMapMouseUp);
      window.removeEventListener('mousemove', handleMapMouseMove);
    };
  }, [isDraggingUser, userLoc]);

  // Categories list
  const categories = [
    { id: 'all', label: 'All', icon: MapPin },
    { id: 'cafe', label: 'Cafes', icon: Coffee },
    { id: 'restaurant', label: 'Restaurants', icon: Utensils },
    { id: 'nightclub', label: 'Nightclubs', icon: Music },
    { id: 'gym', label: 'Gyms', icon: Dumbbell },
    { id: 'park', label: 'Parks', icon: Trees }
  ];

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'cafe': return 'Caffe';
      case 'restaurant': return 'Ristorante';
      case 'nightclub': return 'Nightclub';
      default: return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans antialiased">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] border backdrop-blur-md transition-all duration-300 ${
          toast.type === 'error' 
            ? 'bg-red-950/80 border-red-500/35 text-red-200' 
            : 'bg-slate-900/90 border-emerald-500/35 text-emerald-200'
        }`}>
          {toast.type === 'error' ? <ShieldAlert className="w-4 h-4 text-red-400" /> : <Check className="w-4 h-4 text-emerald-400" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* MAP CANVAS (FULL-SCREEN) */}
      <div className="absolute inset-0 z-0">
        <svg 
          id="city-map-svg"
          className="w-full h-full select-none"
          viewBox="0 0 800 600"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
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

      {/* FLOATING HEADER (SEARCH BOX + CATEGORIES) */}
      <div className="absolute top-6 left-6 z-10 w-96 max-w-[calc(100vw-3rem)] flex flex-col gap-3">
        <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 mb-3 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <span className="text-xs font-mono font-bold tracking-widest text-slate-300">CROWDSENSE</span>
            </div>
            
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase tracking-widest font-bold ${
              isLiveBackend 
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.25)] animate-pulse'
                : 'bg-slate-900 border border-slate-850 text-slate-500'
            }`}>
              {isLiveBackend ? 'Live Backend' : 'Sandbox Mode'}
            </span>
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

          {/* Categories select row inside */}
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

      {/* FLOATING DETAIL CARD (RIGHT SIDE OVERLAY) */}
      {selectedVenue && (
        <div className="absolute top-6 right-6 z-10 w-96 max-w-[calc(100vw-3rem)]">
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-[0_15px_30px_rgba(0,0,0,0.5)] relative">
            <button 
              onClick={() => setSelectedVenueId(null)}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-200 bg-slate-900/50 p-1.5 rounded-full border border-slate-800 z-10"
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
                    className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 transition duration-150"
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
      )}

      {/* FLOATING SIMULATION WIDGET (BOTTOM LEFT OVERLAY) */}
      <div className="absolute bottom-6 left-6 z-10 w-72 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider">
            {isLiveBackend ? 'SERVER SYNCHRONIZER' : 'DECAY SIMULATOR CLOCK'}
          </span>
          {!isLiveBackend && (
            <button 
              onClick={() => setIsPlayMode(!isPlayMode)}
              className={`p-1.5 rounded-lg border transition ${
                isPlayMode 
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isPlayMode ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          )}
        </div>

        <div className="flex justify-between items-baseline mb-2">
          <span className="text-[10px] text-slate-500 font-mono">
            {isLiveBackend ? 'Server Local Time:' : 'Current Time:'}
          </span>
          <span className="text-xs font-bold font-mono text-emerald-400">
            {isLiveBackend 
              ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
              : simTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        </div>

        {!isLiveBackend ? (
          <>
            <input
              type="range"
              min="0"
              max="23"
              step="1"
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              value={currentHour}
              onChange={(e) => {
                const newHour = parseInt(e.target.value, 10);
                const newDate = new Date(simTime);
                newDate.setHours(newHour);
                setSimTime(newDate);
              }}
            />
            <div className="flex justify-between text-[7px] text-slate-600 font-mono mt-1">
              <span>12am</span>
              <span>6am</span>
              <span>12pm</span>
              <span>6pm</span>
              <span>11pm</span>
            </div>
          </>
        ) : (
          <p className="text-[9px] text-slate-500 leading-relaxed font-mono mt-1 border-t border-slate-900 pt-2 text-center">
            Operating in live pipeline mode. Standard temporal decay calculations are processed directly on database commits.
          </p>
        )}
      </div>

      {/* Map Zoom Controls */}
      <div className="absolute bottom-6 right-6 z-10 flex bg-slate-950/80 border border-slate-800 p-1 rounded-xl backdrop-blur-md gap-0.5">
        <button 
          onClick={() => setZoom(z => Math.min(2.0, z + 0.15))} 
          className="w-7 h-7 rounded-lg hover:bg-slate-900 text-slate-300 font-bold flex items-center justify-center text-xs border border-slate-850"
        >
          +
        </button>
        <button 
          onClick={() => setZoom(z => Math.max(0.6, z - 0.15))} 
          className="w-7 h-7 rounded-lg hover:bg-slate-900 text-slate-300 font-bold flex items-center justify-center text-xs border border-slate-850"
        >
          -
        </button>
        <button 
          onClick={() => { setZoom(1); setUserLoc({ x: 380, y: 280 }); }} 
          className="w-7 h-7 rounded-lg hover:bg-slate-900 text-slate-400 font-mono flex items-center justify-center text-[8px] border border-slate-850"
          title="Reset Map"
        >
          RST
        </button>
      </div>

    </div>
  );
}
