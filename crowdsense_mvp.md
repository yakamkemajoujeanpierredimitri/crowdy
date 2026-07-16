# CrowdSense — MVP Build Guide

> **Goal:** Ship a working crowd-level platform in 16 weeks. Users open the app, search a place, and instantly see if it's empty, quiet, moderate, busy, or packed — no guessing required.

---

## Table of Contents

1. [MVP Scope](#1-mvp-scope)
2. [Tech Stack](#2-tech-stack)
3. [Phase 1 — Data Strategy (Weeks 1–2)](#3-phase-1--data-strategy-weeks-12)
4. [Phase 2 — Database & Core Algorithms (Weeks 3–4)](#4-phase-2--database--core-algorithms-weeks-34)
5. [Phase 3 — Backend API (Weeks 5–6)](#5-phase-3--backend-api-weeks-56)
6. [Phase 4 — Frontend (Weeks 7–10)](#6-phase-4--frontend-weeks-710)
7. [Phase 5 — QA & Beta (Weeks 11–14)](#7-phase-5--qa--beta-weeks-1114)
8. [Phase 6 — Launch (Weeks 15–16)](#8-phase-6--launch-weeks-1516)
9. [Algorithm Reference](#9-algorithm-reference)
10. [MVP Checklist](#10-mvp-checklist)

---

## 1. MVP Scope

Keep the scope razor-thin. The MVP must do exactly three things well:

- **Show** a crowd score for any venue on a map
- **Accept** manual crowd reports from users
- **Update** the score in real-time when reports come in

### Venue types to support at launch

| Type | Reason to include |
|---|---|
| Restaurants & cafes | High daily turnover, clear user need |
| Retail stores | Predictable peak hours (weekends) |
| Public parks | No access restrictions, easy to seed data |
| Gyms | Strong user motivation to check before going |

> **Cut from MVP:** transit stations, computer vision integration, ML forecasting, social media signals. These are Phase 2+.

---

## 2. Tech Stack

| Layer | MVP Choice | Why |
|---|---|---|
| Mobile | React Native (Expo) | Single codebase for iOS + Android |
| Web | React + Vite | Reuse components from mobile |
| Backend | Node.js + Express | Fast to build, huge ecosystem |
| Database | PostgreSQL + PostGIS | Geo-queries, relational integrity |
| Cache | Redis | Real-time score reads without DB hits |
| Auth | Firebase Auth | Free, handles OAuth + JWT out of the box |
| Maps | Google Maps SDK | Required anyway for Places API |
| Hosting | Railway or Render (MVP) → AWS/GCP (scale) | Low ops overhead at launch |
| Real-time | Socket.io (WebSocket wrapper) | Simpler than raw WS for MVP |

---

## 3. Phase 1 — Data Strategy (Weeks 1–2)

### ⚠️ Most critical phase. Do not skip.

Your data strategy determines everything. The MVP uses **two sources only**:

| Source | Role | Cost |
|---|---|---|
| **Google Places API — Popular Times** | Historical baseline (hourly busyness per venue) | Free tier (limited) |
| **User manual reports** | Live updates submitted in-app | Free |

**Why only two?** GPS dwell-time and Wi-Fi sensors require user volume or hardware partnerships you don't have yet. Get traction first.

### Action items

- [ ] Create a Google Cloud project and enable the **Places API**
- [ ] Test `GET /place/details` with `fields=popular_times` on 10 real venues
- [ ] Document the baseline busyness scale (Google returns 0–100)
- [ ] Design the report flow: how does a user submit "it's busy here"?
- [ ] Decide on score normalisation: both sources must output values on the same **0–100 scale**

---

## 4. Phase 2 — Database & Core Algorithms (Weeks 3–4)

### 4.1 Database Schema

Run this in order. **Install the PostGIS extension first.**

```sql
-- Enable geo support
CREATE EXTENSION IF NOT EXISTS postgis;

-- Venues
CREATE TABLE venues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,                         -- 'restaurant','park','gym',...
  location        GEOGRAPHY(POINT, 4326) NOT NULL,       -- PostGIS geo point
  capacity        INT,
  google_place_id TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Spatial index — required for fast geo-queries
CREATE INDEX idx_venues_location ON venues USING GIST(location);

-- User-submitted reports
CREATE TABLE crowd_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id    UUID REFERENCES venues(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  score       INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  source_type TEXT NOT NULL DEFAULT 'manual',            -- 'manual','gps','sensor'
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Live crowd scores (one row per venue, updated on every report)
CREATE TABLE crowd_scores (
  venue_id      UUID PRIMARY KEY REFERENCES venues(id) ON DELETE CASCADE,
  current_score INT NOT NULL DEFAULT 0,
  label         TEXT NOT NULL DEFAULT 'Unknown',
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Users
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id          TEXT UNIQUE NOT NULL,                 -- Firebase UID
  reputation_score FLOAT NOT NULL DEFAULT 0.5,          -- 0.1 → 2.0
  report_count     INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Historical patterns (seeded from Google Popular Times)
CREATE TABLE historical_patterns (
  venue_id    UUID REFERENCES venues(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Mon
  hour        INT NOT NULL CHECK (hour BETWEEN 0 AND 23),
  avg_score   INT NOT NULL,
  PRIMARY KEY (venue_id, day_of_week, hour)
);
```

> **⚠️ Critical:** The `GEOGRAPHY(POINT, 4326)` + `GIST` index is what makes "find venues near me" fast. Without it, every nearby-search does a full table scan. Never store lat/lon as plain `FLOAT` columns.

---

### 4.2 Algorithm — Weighted Crowd Score

This is the core formula. Every venue's crowd score is computed by this function on every incoming report.

```
CrowdScore = w1 * GoogleBusyness + w2 * UserReportScore

MVP weights:
  w1 = 0.55   (Google Popular Times — historical, reliable)
  w2 = 0.45   (User reports — live, but noisy)

Constraints:
  - w1 + w2 = 1.0
  - All inputs normalised to [0, 100]
  - Increase w2 dynamically when ≥ 3 recent user reports exist
```

**Implementation (Node.js):**

```js
function computeCrowdScore({ googleScore, userReports, venueCategory }) {
  const now = Date.now();

  // Apply temporal decay to each user report before averaging
  const decayedReports = userReports.map(r => {
    const deltaMinutes = (now - new Date(r.created_at).getTime()) / 60000;
    const lambda = getLambda(venueCategory);
    const decayed = r.score * Math.exp(-lambda * deltaMinutes);
    return decayed * r.reputation_weight;  // weight by reporter reputation
  });

  const recentCount = userReports.filter(r => {
    return (now - new Date(r.created_at).getTime()) < 60 * 60 * 1000; // last hour
  }).length;

  // Boost user-report weight when fresh reports exist
  const w2 = recentCount >= 3 ? 0.65 : 0.45;
  const w1 = 1 - w2;

  const userScore = decayedReports.length > 0
    ? decayedReports.reduce((a, b) => a + b, 0) / decayedReports.length
    : googleScore;  // fallback to Google if no user reports

  const raw = (w1 * googleScore) + (w2 * userScore);
  return Math.round(Math.min(100, Math.max(0, raw)));
}
```

---

### 4.3 Algorithm — Temporal Decay

Old reports must lose influence over time. Use exponential decay.

```
DecayedScore(t) = Score × e^(−λ × Δt)

Where:
  Δt = minutes elapsed since the report was submitted
  λ  = decay constant, tuned by venue type
```

```js
function getLambda(category) {
  const lambdaMap = {
    'cafe':        0.05,   // fast turnover — decays quickly
    'fast_food':   0.05,
    'restaurant':  0.02,   // medium turnover
    'retail':      0.015,
    'gym':         0.012,
    'park':        0.008,  // slow turnover — score stays relevant longer
    'museum':      0.008,
  };
  return lambdaMap[category] ?? 0.02;  // default: restaurant-like decay
}
```

> **Why this matters:** A "very busy" report from 4 hours ago at a fast-food spot is worthless. The same report from a park is still somewhat relevant. Decay constants encode this domain knowledge.

---

### 4.4 Algorithm — Anomaly Detection (Z-Score Filter)

Filter spam and bad-faith reports before they pollute the score.

```
z = (incoming_score − mean_of_recent_scores) / std_dev

  |z| > 2.5  → FLAG for review
  |z| > 3.5  → AUTO-DISCARD
```

```js
function isAnomaly(newScore, recentScores) {
  if (recentScores.length < 5) return false;  // not enough data to judge

  const mean = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const variance = recentScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / recentScores.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return false;

  const z = Math.abs((newScore - mean) / stdDev);

  if (z > 3.5) return 'discard';
  if (z > 2.5) return 'flag';
  return false;
}
```

**Additional safeguards (enforce at API layer):**

- Max 3 reports per user per venue per hour
- New users get a `reputation_weight` of `0.5` (half influence)
- Any report deviating >40 points from the Google baseline triggers manual review

---

### 4.5 Crowd Label Classification

Map the numeric score to a human-readable label and colour.

```js
function classifyScore(score) {
  if (score <= 20) return { label: 'Empty',    color: '#22C55E' };  // green
  if (score <= 40) return { label: 'Quiet',    color: '#86EFAC' };  // light green
  if (score <= 60) return { label: 'Moderate', color: '#FACC15' };  // yellow
  if (score <= 80) return { label: 'Busy',     color: '#F97316' };  // orange
  return             { label: 'Packed',   color: '#EF4444' };  // red
}
```

> **UX note:** Always display the colour band alongside the label. Users process colour ~60ms faster than reading text.

---

## 5. Phase 3 — Backend API (Weeks 5–6)

### 5.1 Core Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/venues/nearby` | Venues within `radius` metres of `lat,lon`. Returns score + label. |
| `GET` | `/venues/:id/crowd` | Full crowd data for one venue (score, label, recent reports, historical pattern). |
| `POST` | `/reports` | Submit a crowd report. Triggers score recalculation pipeline. |
| `GET` | `/venues/search` | Full-text search by name or address. |
| `WS` | `/venues/:id/live` | WebSocket — push score updates to subscribed clients. |

### 5.2 Nearby Venues Query (PostGIS)

```sql
SELECT
  v.id,
  v.name,
  v.category,
  ST_Distance(v.location, ST_MakePoint($lon, $lat)::geography) AS distance_m,
  cs.current_score,
  cs.label
FROM venues v
LEFT JOIN crowd_scores cs ON cs.venue_id = v.id
WHERE ST_DWithin(
  v.location,
  ST_MakePoint($lon, $lat)::geography,
  $radius_metres
)
ORDER BY distance_m ASC
LIMIT 50;
```

### 5.3 Real-Time Report Pipeline

When `POST /reports` is called, this pipeline must complete in **under 200ms**:

```
1. Validate request (auth token, score range, rate limit)
2. Run Z-score anomaly check against last 20 reports for this venue
3. If 'discard' → return 200 but do not process
4. Fetch current Google baseline from historical_patterns
5. Fetch last 10 user reports for this venue from Redis cache
6. Apply temporal decay to all cached reports
7. Compute new CrowdScore (weighted formula)
8. Classify score → label + color
9. UPDATE crowd_scores SET current_score, label, updated_at WHERE venue_id = ?
10. UPDATE Redis cache (key: score:{venue_id}, TTL: 60s)
11. Emit score update to all Socket.io subscribers for this venue
```

> **⚠️ Performance rule:** Steps 4–6 must read from **Redis**, not PostgreSQL. Write to PostgreSQL (step 9) for persistence only. Redis TTL of 60 seconds means clients always get a fresh score with zero DB pressure.

### 5.4 Redis Cache Keys

```
score:{venue_id}          → { current_score, label, updated_at }  TTL: 60s
reports:{venue_id}        → [last 10 reports with timestamps]      TTL: 10min
history:{venue_id}:{dow}  → [24 hourly avg scores from Google]     TTL: 24h
```

---

## 6. Phase 4 — Frontend (Weeks 7–10)

### 6.1 Screens to Build

| Screen | Priority | Notes |
|---|---|---|
| **Map View** | P0 | Full-screen map, colour-coded pins, tap to expand. Use Google Maps SDK. |
| **Venue Detail** | P0 | Current score + gauge, label, 24h history bar chart, submit report CTA. |
| **Report Screen** | P0 | 5-button row (Empty → Packed). One tap submits. No friction. |
| **Search** | P1 | Autocomplete via Google Places Autocomplete API. Filter by category. |
| **Notifications** | P2 | Alert when a saved venue drops below "Busy". Push via Firebase FCM. |

### 6.2 Real-Time Score Updates

```js
// Connect to venue WebSocket on mount
useEffect(() => {
  const socket = io(API_URL);
  socket.emit('subscribe', { venueId });

  socket.on('score_update', ({ score, label, color }) => {
    // Animate, do not flash
    setScore(score);
    setLabel(label);
    setColor(color);
  });

  return () => socket.disconnect();
}, [venueId]);
```

> Animate the score gauge smoothly on update. A jarring number flash makes the data feel unreliable even when it isn't.

### 6.3 Report Submission UX

```
[  Empty  ] [  Quiet  ] [ Moderate ] [  Busy  ] [  Packed  ]
     ○            ○           ○            ●           ○

                      [ Submit Report ]
```

- One screen, one action, zero text input required for MVP
- Report is sent with the user's current GPS coordinates as verification
- Show a success toast: *"Thanks! Score updated."*

---

## 7. Phase 5 — QA & Beta (Weeks 11–14)

### Week 11–12: QA Focus Areas

- [ ] Anomaly detection: submit 10 extreme reports and verify they are discarded
- [ ] Temporal decay: verify scores drop passively over time with no new reports
- [ ] Geo-query accuracy: confirm "nearby" returns correct venues sorted by distance
- [ ] Redis TTL: confirm score reads never hit PostgreSQL directly
- [ ] WebSocket: confirm all connected clients receive updates within 500ms of a report
- [ ] Rate limiting: verify a single user cannot submit more than 3 reports/hour/venue

### Week 13–14: Closed Beta

- Recruit **100–200 users** in a single neighbourhood (not city-wide)
- Pre-seed all venues in that area with Google Popular Times data
- Goal: collect at least **500 real reports** before public launch
- Monitor: average score accuracy vs. ground truth (visit venues and verify)

---

## 8. Phase 6 — Launch (Weeks 15–16)

### Solve the Cold Start Problem First

The platform is useless without data. Before any public announcement:

- [ ] **80% of venues** in the launch area must have a non-null `current_score`
- [ ] All scores have been seeded from Google Popular Times historical data
- [ ] At least 2 venue partnerships secured for live Wi-Fi sensor data (optional but powerful)

### Launch checklist

- [ ] Privacy policy published (especially covering GPS data usage)
- [ ] App Store + Play Store listings submitted (allow 1–2 weeks for review)
- [ ] Error monitoring set up (Sentry or similar)
- [ ] Database backups configured
- [ ] Rate limiting on all public API endpoints
- [ ] Score pipeline load-tested at 500 concurrent reports/min

---

## 9. Algorithm Reference

Quick reference for all core algorithms implemented in the MVP.

### Weighted Crowd Score

```
CrowdScore = w1 × GoogleBusyness + w2 × DecayedUserScore

Default: w1 = 0.55, w2 = 0.45
Boost:   w1 = 0.35, w2 = 0.65  (when ≥ 3 fresh reports in last hour)
```

### Exponential Temporal Decay

```
DecayedScore(t) = Score × e^(−λ × Δt)

λ by category:
  cafe / fast food : 0.05
  restaurant       : 0.02
  retail / gym     : 0.015
  park / museum    : 0.008
```

### Z-Score Anomaly Filter

```
z = |incoming_score − mean| / std_dev

z > 2.5 → flag
z > 3.5 → discard
```

### Crowd Label Map

```
0–20   : Empty    #22C55E
21–40  : Quiet    #86EFAC
41–60  : Moderate #FACC15
61–80  : Busy     #F97316
81–100 : Packed   #EF4444
```

### User Reputation Score

```
Initial value: 0.5 (new users carry half weight)
Range:         0.1 → 2.0

After ground truth check:
  error < 15pts → reputation += 0.02
  error > 35pts → reputation -= 0.05
```

---

## 10. MVP Checklist

These are the non-negotiable items. Do not launch without them.

- [ ] Google Places API key configured and tested
- [ ] PostgreSQL with PostGIS extension installed
- [ ] Spatial index (`GIST`) on `venues.location`
- [ ] Redis running and all score reads cached
- [ ] Weighted Crowd Score formula implemented and tested
- [ ] Temporal decay applied to all user reports
- [ ] Z-score anomaly filter rejecting bad reports
- [ ] Rate limiting: 3 reports/hour/user/venue
- [ ] WebSocket delivering score updates in < 500ms
- [ ] New users start with reputation weight of 0.5
- [ ] All venues in launch area pre-seeded with Google Popular Times
- [ ] Privacy policy live before any user GPS data is collected
- [ ] Load test passed at expected beta traffic

---

*CrowdSense MVP Build Guide — based on the CrowdSense Platform Roadmap (April 2026)*
