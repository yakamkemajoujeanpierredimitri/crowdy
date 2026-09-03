# CrowdSense Platform - MVP Build Requirements

## 1. Executive Scope & Value Proposition
- **Goal:** Real-time crowd detection allowing users to instantly see if venues are empty, moderate, or packed.
- **MVP Target Venues:** Restaurants & cafes, retail stores/malls, public parks/beaches, transit stations, gyms.

## 2. Data Strategy & Sources
*Crucial: Avoid ToS violations and fragile architectures by not relying on scraped Google Popular Times.*
- **Primary Live Signal:** Manual user check-ins and reports.
- **Contextual Signal:** Official Google Places API (category, hours, business status).
- **Supplementary/Alternative Signals:** GPS dwell-time data (pulled forward into MVP) and Wi-Fi/Bluetooth probes (via venue partnerships).
- **Social Media:** Excluded from core MVP due to restrictive APIs and high costs.

## 3. Core Algorithms
- **Weighted Crowd Score (0-100):** Combines user reports, GPS dwell time, and contextual data. Weights adjust dynamically based on data availability (e.g., higher weight on user reports).
- **Temporal Decay:** Applies exponential decay (`e^(-lambda * delta_t)`) to older reports. Example lambdas: 0.05 for fast-turnover, 0.008 for slow-turnover.
- **Anomaly Detection (Anti-Spam):**
  - Z-Score filter to flag (z > 2.5) or discard (z > 3.5) anomalous reports.
  - Device-level and account-level rate limiting (max 3 reports/hour).
  - GPS proximity verification for report submission.
  - Independent baseline cross-checks to prevent coordinated manipulation.
- **Classification:** Score mapped to color-coded labels for fast UI processing:
  - 0-20: Empty
  - 21-40: Quiet
  - 41-60: Moderate
  - 61-80: Busy
  - 81-100: Packed

## 4. Backend & Architecture Layer
- **Database:** PostgreSQL for relational data, crucially using the **PostGIS** extension for high-performance geographic point queries (e.g., radius searches).
- **Real-Time Cache:** Redis (60-second TTL) to serve WebSocket pings quickly without overloading PostgreSQL.
- **Real-Time Pipeline:** Sub-200ms execution from report submission (`POST /reports`) to validation, calculation, and WebSocket broadcast.
- **Core Endpoints Needed:** `GET /venues/nearby`, `POST /reports`, `WS /venues/:id/live`.

## 5. Frontend UI (iOS/Android/Web)
- **Map View:** Interactive map with color-coded venue pins.
- **Venue Detail:** Current score, recent reports, and basic historical patterns.
- **Report Screen:** Quick submission (slider/button) + optional photo.
- **WebSocket Updates:** Smooth animations for live score updates without startling the user.

# Phase 7 — Monetization & Economic Model

CrowdSense monetizes as a two-sided platform: consumers pay (optionally) for richer discovery, and businesses pay for visibility, content tools, and data. The golden rule underneath every tier: **the Crowd Score is never for sale. Only visibility and content are.**

## Step 7.1 — Consumer Access Tiers

Four tiers, structured so the core value proposition — the live crowd score — is available to everyone, and only the content layer on top of it is gated.

| Tier | Access |
|---|---|
| **1 — Anonymous (no account)** | Search venues, view the live Crowd Score and label for any venue. Cannot view business-uploaded Highlights (photos/reels). |
| **2 — Free account** | Everything in Tier 1, plus a limited number of Highlights views per day. Registration unlocks personalization data (saved venues, notifications). |
| **3 — Premium (paid subscription)** | Unlimited Highlights, personalized venue suggestions (a discovery feed), 12-hour forecast, and saved-venue alerts. |
| **4 — Business / API** | Venues and companies pay for API access, aggregated data, sponsored placement, and business content tools (see Step 7.4). |

> **⚠️ TRUST REQUIREMENT**
> The Crowd Score must never be influenced by payment, tier, or sponsorship — at any level. Businesses can pay for visibility (ranking, boosted Highlights) but never for a better score.
> Label Highlights clearly as "From the Venue" so users read them as the business's own curated content, distinct from CrowdSense's algorithmic, real-time score.

## Step 7.2 — What "Highlights" Are, and Why Gating Them Works

Highlights are short photos and videos (reels) of a venue — not the crowd score itself. Gating this content layer, rather than the score, avoids hiding the app's core utility from first-time or anonymous users, which matters directly for the cold-start problem in Step 6.1: an anonymous visitor still sees whether a place is busy, so the app is useful on day one even before they create an account.

> **🔑 KEY INSIGHT**
> Visual content is a stronger upgrade trigger than a data point. A reel of a lively venue creates desire in a way a number cannot — so the account wall and the premium wall should sit on Highlights and personalization, never on the score.

## Step 7.3 — Highlights Content Source: Business-Uploaded

Highlights are sourced from businesses, not scraped from social platforms or crowdsourced from users. This avoids copyright/rights issues with rehosting third-party content, and turns content supply into a business-onboarding problem rather than a user-growth problem.

- Venues claim their listing (ownership verification), then upload photos and short videos directly.
- A free claimed profile includes a capped number of Highlights (e.g., 3-5 images) at standard resolution.
- A paid Business subscription ("Business Plus") unlocks unlimited Highlights, video/reels, a featured carousel, and an analytics dashboard (views, saves, click-to-directions).
- Content freshness is enforced: Highlights are timestamped and algorithmically deprioritized after a set window to prevent stale, misleading media (e.g., an empty-looking cafe photo used long after a renovation).

> **⚠️ CRUCIAL STEP**
> Extend the Step 6.1 cold-start partnerships to include a content commitment, not just Wi-Fi sensors: the first 5-10 partner businesses should receive a free professional photo/video session as an onboarding incentive. This seeds high-quality Highlights before public launch and offsets the resource gap between small independent venues and larger chains.

> **💡 UX TIP**
> Tie profile richness to a small organic ranking boost in search/discovery (independent of paid placement). This gives every business, including ones that never pay, a reason to upload — and gives free users a natural on-ramp into the paid Business tier once they see their own engagement analytics.

## Step 7.4 — Business & B2B Revenue Lines

Tier 4 is not one product — it bundles four distinct revenue lines with different buyers and different pricing logic. Treat each as its own product and pricing page rather than a single flat "business tier."

| Revenue Line | Buyer / Pricing Model |
|---|---|
| **API Access** | Developers / partner apps. Usage-based or metered monthly tiers, self-serve (comparable to the Google Places API model). |
| **Aggregated Data Licensing** | Urban planners, real estate analysts, market researchers. Enterprise contracts, higher ticket, sales-led — the buyer wants footfall patterns and trends, not individual venue data. |
| **Sponsored Placement** | Local businesses. Auction-based (CPC or pay-per-boost) visibility in search and discovery — affects ranking only, never the Crowd Score. |
| **Business Content Subscription ("Business Plus")** | Venue owners. Recurring SaaS fee for unlimited Highlights/video, a featured carousel, and an analytics dashboard on content engagement. |

> **💰 PRICING BENCHMARK**
> Consumer subscriptions on discovery apps are typically a secondary revenue line, not the primary one — comparable local/outdoor-discovery apps price consumer premium around $3-8/month, while the majority of revenue in this category historically comes from local-business advertising and data licensing rather than consumer subscriptions.
> Business content + analytics subscriptions (the closest analogue: hotel/restaurant "business advantage"-style products on review platforms) are typically priced per-property based on traffic or size, and bundle a media/photo-video suite with a competitor-benchmarking analytics suite — a useful template for the Business Plus tier above.

## Step 7.5 — Metering & Conversion Triggers

Define every "limited" tier precisely rather than leaving it vague — vague limits cause silent churn instead of conversion.

- Tier 2 (free account): define an exact daily Highlights-view cap (e.g., 10/day) rather than a soft "limited" label.
- Tier 3 (premium): bundle unlimited Highlights with the 12-hour forecast and saved-venue alerts so the upgrade reason isn't volume alone.
- Business free tier: cap Highlights count and withhold analytics — analytics access is a strong, low-cost upgrade lever once a business can see real view/engagement numbers.
- A/B test all caps post-launch; media (photo/video) is materially more expensive to serve than score data, so free-tier limits double as cost control, not just a sales lever.

---

### Related checklist additions

If your `.md` file also tracks the critical-steps checklist, these two items belong with it:

- [x] **Crowd Score / payment firewall** — no tier, subscription, or sponsorship may ever influence the score, only visibility and content
- [x] **Unbundled B2B pricing** for API access, data licensing, sponsored placement, and the Business content subscription

