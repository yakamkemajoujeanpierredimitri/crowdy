Every venue must be assigned a normalised Crowd Score from 0 (empty) to 100 (packed). This score is what the user sees.
⚙ ALGORITHM: Weighted Crowd Score
CrowdScore = w1 * GoogleBusyness
           + w2 * UserReportScore
           + w3 * DwellTimeScore
           + w4 * SocialSignalScore

Where:
 w1 = 0.40  (Google Popular Times)
 w2 = 0.35  (Manual user reports)
 w3 = 0.20  (GPS dwell time)
 w4 = 0.05  (Social media)

Weights must sum to 1.0
Each sub-score is normalised to [0, 100]
Weights are tuned per venue category


⚙ ALGORITHM: Exponential Decay Model
DecayedScore(t) = Score * e^(-lambda * delta_t)

Where:
 delta_t = time elapsed since report (minutes)
 lambda  = decay constant (tuned per venue type)

Recommended lambda values:
  Fast-turnover (cafe, fast food) : lambda = 0.05
  Medium-turnover (restaurant)    : lambda = 0.02
  Slow-turnover (park, museum)    : lambda = 0.008

A report older than ln(20)/lambda minutes contributes less than 5% to the final score.

⚙ ALGORITHM: Z-Score Anomaly Filter
For each incoming report:
  z = (report_score - mean_score) / std_dev
  IF abs(z) > 2.5 -> FLAG as suspicious, down-weighted, queued for review
  IF abs(z) > 3.5 -> DISCARD automatically, never scored

Note: z-score alone misses coordinated manipulation — a group of bad-faith
reports shifts the venue's own recent mean/std_dev, so nothing looks
anomalous relative to itself. The independent baseline check below exists
specifically to catch this.

Additional filters:
  - Reputation weight per user (new users: 0.5x, up to 2.0x for proven-accurate users)
  - Rate limit: max 3 reports/hour per user per venue (account-level)
  - Device-level rate limit: cap reports per physical device per venue per
    hour, independent of account count (blocks multi-account abuse)
  - GPS proximity requirement: only accept a report if the device is
    verified near the venue at submission time
  - Cross-check against an INDEPENDENT baseline (>40pt delta = flag),
    not the venue's own recent reports. Revision note: the original plan
    assumed a free Google Popular Times baseline, which is not officially
    available (see Step 1.2). Use accumulated internal historical report
    data once sufficient volume exists, or verified partner sensor data,
    as the independent baseline instead.

⚙ ALGORITHM: Reputation Update Rule
After ground truth is established (e.g., verified sensor data or reconciled reports):
  error = abs(user_report_score - ground_truth)
  IF error < 15:  reputation += 0.02  (reward)
  IF error > 35:  reputation -= 0.05  (penalise)
  reputation = clamp(reputation, 0.1, 2.0)

High-reputation users' reports carry up to 2x weight.
New users start at 0.5 to limit manipulation.

⚙ ALGORITHM: Time-Series Forecasting (LSTM / Prophet)
Input features:
  - Day of week (one-hot encoded)
  - Hour of day
  - Weather (temperature, rain probability)
  - Local events (concerts, sports, holidays)
  - Historical avg score for this slot
  - Rolling 7-day average

Model: Facebook Prophet (interpretable baseline)
       -> Upgrade to LSTM after 3 months of data
Retrain: Weekly batch job using last 90 days
Serve:
  FastAPI /forecast endpoint, cached 15min
