'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapProvider } from 'react-map-gl/mapbox';
import CityMap from '../components/CityMap';
import SearchHeader from '../components/SearchHeader';
import VenueDetailCard from '../components/VenueDetailCard';
import SimulationWidget from '../components/SimulationWidget';
import ZoomControls from '../components/ZoomControls';
import Toast from '../components/Toast';
import UserProfileModal from '../components/UserProfileModal';
import { INITIAL_VENUES } from '../data/venues';
import {
  checkAnomaly,
  getDistanceMeters,
  classifyScore,
  computeCrowdScore,
  validateReport,
  extractAreaDetails,
  errorMessage,
} from '../utils/helpers';
import {
  BACKEND_URL,
  DEFAULT_CENTER,
  DEFAULT_USER_LOCATION,
  NEARBY_RADIUS_M,
  ON_SITE_RADIUS_M,
} from '../utils/config';

const USER_ID_KEY = 'crowdsense_user_id';

function loadOrCreateUserId() {
  if (typeof window === 'undefined') return '';
  try {
    const saved = localStorage.getItem(USER_ID_KEY);
    if (saved) return saved;
  } catch {
    // storage blocked: fall through to a session-only id
  }
  return `User-Client-${Math.floor(100 + Math.random() * 900)}`;
}

/** Shape a venue row from the backend for the UI. */
function mapBackendVenue(v) {
  return {
    id: v.id,
    name: v.name,
    category: v.category,
    lat: typeof v.lat === 'number' ? v.lat : parseFloat(v.lat),
    lon: typeof v.lon === 'number' ? v.lon : parseFloat(v.lon),
    description: v.description,
    address: v.address || '',
    capacity: v.capacity,
    google_place_id: v.google_place_id,
    lambda: v.lambda,
    hours: v.hours,
    website: v.website,
    image: v.image,
    current_score: typeof v.current_score === 'number' ? v.current_score : null,
    source: v.source || 'Live Engine',
    history: v.history,
    activeReports: [],
  };
}

/** Merge GET /venues/:id/crowd into a venue. */
function applyCrowdDetails(venue, data) {
  return {
    ...venue,
    history: data.history,
    current_score: typeof data.current_score === 'number' ? data.current_score : venue.current_score,
    source: data.source || venue.source,
    activeReports: (data.recentReports || []).map((r) => ({
      id: r.id,
      score: r.score,
      created_at: new Date(r.created_at),
      deltaMinutes: (Date.now() - new Date(r.created_at).getTime()) / 60000,
      reputation_weight: 1.0,
      reporterName: String(r.user_id || '').slice(0, 12),
    })),
  };
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  let body = null;
  try {
    body = await res.json();
  } catch {
    // empty / non-JSON body
  }
  return { ok: res.ok, body };
}

export default function SimpleCrowdSense() {
  // --- Simulation States ---
  const [simTime, setSimTime] = useState(() => new Date('2026-07-16T12:00:00'));
  const [isPlayMode, setIsPlayMode] = useState(false);
  const currentHour = simTime.getHours();

  // --- Backend Integration States ---
  const [isLiveBackend, setIsLiveBackend] = useState(false);

  // --- Core States ---
  const [venues, setVenues] = useState(INITIAL_VENUES);
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // --- User Identity ---
  const [userId, setUserId] = useState(loadOrCreateUserId);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(USER_ID_KEY, userId);
    } catch {
      // storage blocked: id lives for this session only
    }
  }, [userId]);

  // User location (draggable "YOU" pin), real GPS coordinates
  const [userLoc, setUserLoc] = useState(DEFAULT_USER_LOCATION);

  // Sandbox reports (used when the backend is not reachable)
  const [userReports, setUserReports] = useState([
    { id: 'ur1', venueId: 'v1', score: 62, created_at: new Date('2026-07-16T11:10:00'), reputation_weight: 1.0, reporterName: 'Reporter-1804' },
    { id: 'ur2', venueId: 'v1', score: 74, created_at: new Date('2026-07-16T11:20:00'), reputation_weight: 1.0, reporterName: 'Reporter-2945' },
    { id: 'ur3', venueId: 'v1', score: 81, created_at: new Date('2026-07-16T11:30:00'), reputation_weight: 1.2, reporterName: 'Reporter-8723' },
    { id: 'ur4', venueId: 'v1', score: 68, created_at: new Date('2026-07-16T11:40:00'), reputation_weight: 0.8, reporterName: 'Reporter-4410' },
    { id: 'ur5', venueId: 'v1', score: 76, created_at: new Date('2026-07-16T11:50:00'), reputation_weight: 1.0, reporterName: 'Reporter-9021' },
  ]);

  const [toast, setToast] = useState(null);

  // --- Clock Auto Play Effect (Sandbox Mode Only) ---
  useEffect(() => {
    if (isLiveBackend || !isPlayMode) return;
    const interval = setInterval(() => {
      setSimTime((prev) => {
        const next = new Date(prev);
        next.setHours((next.getHours() + 1) % 24);
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlayMode, isLiveBackend]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // --- Connect to the backend on mount: load venues around the map centre ---
  useEffect(() => {
    let cancelled = false;
    const query = `/venues/nearby?lat=${DEFAULT_CENTER.lat}&lon=${DEFAULT_CENTER.lon}&radius=${NEARBY_RADIUS_M}`;

    const checkBackendConnection = async () => {
      try {
        let res;
        try {
          res = await fetch(`${BACKEND_URL}${query}`);
        } catch (fetchErr) {
          if (!BACKEND_URL.includes('localhost')) throw fetchErr;
          res = await fetch(`${BACKEND_URL.replace('localhost', '127.0.0.1')}${query}`);
        }
        if (cancelled || !res || !res.ok) return;
        const data = await res.json();
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setVenues(data.map(mapBackendVenue));
        setIsLiveBackend(true);
        showToast('Connected to Live NestJS Backend!', 'success');
      } catch {
        console.log('NestJS Backend not detected. Defaulting to local sandbox simulator.');
      }
    };
    checkBackendConnection();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  // --- Socket.io live score updates (Live Backend Mode Only) ---
  const venueIdsKey = useMemo(() => venues.map((v) => v.id).join(','), [venues]);

  useEffect(() => {
    if (!isLiveBackend || !venueIdsKey) return;
    const ids = venueIdsKey.split(',');
    let socket = null;
    let cancelled = false;

    // Dynamic import keeps socket.io-client out of the server render
    import('socket.io-client').then(({ io }) => {
      if (cancelled) return;
      socket = io(BACKEND_URL);
      // (Re)subscribe on every connect so reconnects keep receiving updates
      socket.on('connect', () => {
        ids.forEach((venueId) => socket.emit('subscribe', { venueId }));
      });
      socket.on('score_update', (payload) => {
        setVenues((prev) =>
          prev.map((v) =>
            v.id === payload.venueId ? { ...v, current_score: payload.score, source: payload.source } : v,
          ),
        );
      });
    });

    return () => {
      cancelled = true;
      if (socket) socket.disconnect();
    };
  }, [isLiveBackend, venueIdsKey]);

  // --- Fetch 24h history + recent reports when a venue is selected (Live Mode) ---
  useEffect(() => {
    if (!isLiveBackend || !selectedVenueId) return;
    let cancelled = false;

    fetchJson(`${BACKEND_URL}/venues/${selectedVenueId}/crowd`)
      .then(({ ok, body }) => {
        if (cancelled || !ok || !body) return;
        setVenues((prev) => prev.map((v) => (v.id === selectedVenueId ? applyCrowdDetails(v, body) : v)));
      })
      .catch((e) => console.error('Failed to fetch venue profile details:', e));

    return () => {
      cancelled = true;
    };
  }, [isLiveBackend, selectedVenueId]);

  // --- Scores, labels and distances for every venue ---
  const computedVenues = useMemo(() => {
    const withDistance = (v) => getDistanceMeters(v.lat, v.lon, userLoc.lat, userLoc.lon);

    if (isLiveBackend) {
      return venues.map((v) => {
        const classification = classifyScore(v.current_score);
        return {
          ...v,
          activeReports: v.activeReports || [],
          distance: withDistance(v),
          label: classification.label,
          color: classification.color,
          bg: classification.bg,
          border: classification.border,
        };
      });
    }

    // Sandbox: same formula as the backend, with the simulated clock
    return venues.map((venue) => {
      const googleScore =
        venue.history && venue.history[currentHour] !== undefined
          ? venue.history[currentHour]
          : typeof venue.current_score === 'number'
            ? venue.current_score
            : 35;
      const nowMs = simTime.getTime();
      const activeReports = (userReports || [])
        .filter((r) => r.venueId === venue.id)
        .map((r) => ({ ...r, deltaMinutes: (nowMs - r.created_at.getTime()) / 60000 }))
        .filter((r) => r.deltaMinutes >= 0 && r.deltaMinutes <= 240);

      const result = computeCrowdScore(
        googleScore,
        activeReports.map((r) => ({ score: r.score, createdAt: r.created_at, reputation: r.reputation_weight })),
        venue.lambda,
        simTime,
      );
      const classification = classifyScore(result.score);

      return {
        ...venue,
        googleScore,
        current_score: result.score,
        label: classification.label,
        color: classification.color,
        bg: classification.bg,
        border: classification.border,
        source: result.usedReports > 0 ? 'Verified Live' : 'Google Times',
        activeReports,
        distance: withDistance(venue),
      };
    });
  }, [venues, userReports, simTime, userLoc, currentHour, isLiveBackend]);

  const selectedVenue = useMemo(
    () => computedVenues.find((v) => v.id === selectedVenueId) || null,
    [computedVenues, selectedVenueId],
  );

  // Search filter status for each venue pin
  const venueFilters = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return computedVenues.reduce((acc, v) => {
      const matchesSearch =
        q === '' ||
        (v.name || '').toLowerCase().includes(q) ||
        (v.address || '').toLowerCase().includes(q) ||
        (v.category || '').toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || v.category === selectedCategory;
      acc[v.id] = matchesSearch && matchesCategory;
      return acc;
    }, {});
  }, [computedVenues, searchQuery, selectedCategory]);

  const areaDetails = useMemo(() => extractAreaDetails(venues), [venues]);

  // --- Select a venue from the search box ---
  // The map flies to the venue; YOUR pin stays where you are (it used to jump onto
  // the venue, which made every report count as "on-site").
  const handleSelectFromSearch = async (id, venueObj) => {
    setSelectedVenueId(id);
    if (venues.some((v) => v.id === id) || !venueObj) return;

    // Venue outside the loaded area: load the venues around it
    if (isLiveBackend && typeof venueObj.lat === 'number' && typeof venueObj.lon === 'number') {
      try {
        const { ok, body } = await fetchJson(
          `${BACKEND_URL}/venues/nearby?lat=${venueObj.lat}&lon=${venueObj.lon}&radius=${NEARBY_RADIUS_M}`,
        );
        if (ok && Array.isArray(body)) {
          const list = body.some((v) => v.id === venueObj.id) ? body : [venueObj, ...body];
          setVenues(list.map(mapBackendVenue));
          return;
        }
      } catch (err) {
        console.error('Failed to load surrounding venues for new sector:', err);
      }
    }
    setVenues((prev) => [isLiveBackend ? mapBackendVenue(venueObj) : venueObj, ...prev]);
  };

  // --- Submit Report ---
  const submitLiveReport = async (reportedScore) => {
    if (!selectedVenue) return;

    const validation = validateReport({
      venueId: selectedVenue.id,
      score: reportedScore,
      userId,
      isLiveBackend,
    });
    if (!validation.isValid) {
      showToast(validation.error, 'error');
      return;
    }

    const isNearby = typeof selectedVenue.distance === 'number' && selectedVenue.distance <= ON_SITE_RADIUS_M;

    if (isLiveBackend) {
      try {
        const { ok, body } = await fetchJson(`${BACKEND_URL}/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            venueId: selectedVenue.id,
            score: reportedScore,
            userId,
            sourceType: isNearby ? 'manual' : 'gps_warning',
          }),
        });

        if (!ok) {
          showToast(errorMessage(body, 'Submission failed.'), 'error');
          return;
        }
        if (body && body.status === 'discarded') {
          showToast(body.message, 'error');
          return;
        }
        showToast(isNearby ? 'Report submitted to live server!' : 'Remote report submitted with penalties.');

        // Refresh reports + score for this venue
        const detail = await fetchJson(`${BACKEND_URL}/venues/${selectedVenue.id}/crowd`);
        if (detail.ok && detail.body) {
          setVenues((prev) => prev.map((v) => (v.id === selectedVenue.id ? applyCrowdDetails(v, detail.body) : v)));
        }
      } catch {
        showToast('Failed to connect to backend server.', 'error');
      }
      return;
    }

    // Local Sandbox Submission fallback
    const recentVenueReports = userReports.filter((r) => r.venueId === selectedVenue.id);
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
      reporterName: userId,
    };
    setUserReports((prev) => [newReport, ...prev]);
    showToast(isNearby ? 'Crowd report added! Updated map.' : 'Report submitted (remote penalty applied).');
  };

  return (
    <MapProvider>
      <div className="relative w-screen h-screen bg-[#0a0a0a] text-neutral-100 overflow-hidden font-sans antialiased">
        <Toast toast={toast} />

        {/* MAP CANVAS (FULL-SCREEN) */}
        <CityMap
          userLoc={userLoc}
          setUserLoc={setUserLoc}
          computedVenues={computedVenues}
          venueFilters={venueFilters}
          selectedVenueId={selectedVenueId}
          setSelectedVenueId={setSelectedVenueId}
          activeSector={areaDetails.sector}
        />

        {/* FLOATING HEADER (SEARCH BOX + CATEGORIES + AUTOCOMPLETE) */}
        <SearchHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          isLiveBackend={isLiveBackend}
          setIsProfileModalOpen={setIsProfileModalOpen}
          venues={computedVenues}
          userLoc={userLoc}
          onSelectVenue={handleSelectFromSearch}
        />

        {/* FLOATING DETAIL CARD (key resets its state when the venue changes) */}
        <VenueDetailCard
          key={selectedVenueId || 'none'}
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
        <ZoomControls onReset={() => setUserLoc(DEFAULT_USER_LOCATION)} />

        {/* User Profile Modal (mounted only while open so it starts from the current id) */}
        {isProfileModalOpen && (
          <UserProfileModal
            isOpen
            onClose={() => setIsProfileModalOpen(false)}
            userId={userId}
            setUserId={setUserId}
          />
        )}
      </div>
    </MapProvider>
  );
}
