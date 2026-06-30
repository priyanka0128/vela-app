# Vela — ALS Communication Platform

Multimodal AAC web app for ALS/MND patients with voice preservation and a consolidated caregiver/clinical report.

**Live:** `vela-app-theta.vercel.app`
**Repo:** `github.com/priyanka0128/vela-app`

---

## Pages

| Page | Purpose | Audience |
|------|---------|----------|
| `landing.html` | Public marketing landing | Judges, investors, hospital prospects |
| `index.html` | GDPR consent gate | First-time visitors |
| `setup.html` | 4-step profile creation | Patient/family setup |
| `home.html` | App hub | Patient |
| `communicate.html` | Voice / Type / Pictograms + 8 emotions | Patient |
| `voicebank.html` | Voice cloning + management | Patient/family |
| `listen.html` | AI conversation partner (Listen Mode) | Patient |
| `eyetrack.html` | WebGazer eye tracking | Late-stage patient |
| `caregiver.html` | PIN-protected portal | Caregiver |
| **`patient-report.html`** | **Consolidated patient report — NEW** | **Caregiver / clinician** |
| `settings.html` | Profile, data export, danger zone | Patient/family |

---

## Design system v3 — Soft pastel palette

The app uses a calm, healthcare-focused color palette designed for accessibility:

| Token | Hex | Use |
|-------|-----|-----|
| `--bg` | `#edf0eb` | Page background (lightest green/cream) |
| `--surface` | `#ffffff` | Cards |
| `--ink` | `#1a2e2a` | Primary text |
| `--accent` | `#cedc80` | Primary CTA (yellowish green) |
| `--accent-strong` | `#9eb04d` | Active state, link color |
| `--green` | `#c7dccd` | Secondary accent, success states |
| `--blue` | `#acb4c6` | Clinical/caregiver features |
| `--gray` | `#d1d3d1` | Borders |

The brand mark is the **vela** wordmark + three nested curved arcs (representing sound waves / voice / preservation), embedded as inline SVG on every page.

---

## What's new in this version

### Consolidated patient report (`patient-report.html`)

Accessible from the caregiver portal after PIN unlock. Sections:

1. **Patient meta** — name, stage, region, language, days on Vela
2. **Communication activity** — total messages, daily average, peak hour, quiet days, 14-day bar chart, trend vs previous period
3. **Emotional patterns** — donut chart of 8 emotions with percentages
4. **Voice health** — sample count, active voice, days since last sample, sample timeline
5. **Most-spoken phrases** — top 8 with counts
6. **Risk & wellbeing indicators** — distress phrase rate, night activity, negative tone frequency, communication trend (color-coded: green / amber / red)
7. **Q3 roadmap note** — acoustic biomarkers, respiratory risk, caregiver burden index

Features:
- Time range selector (7d / 30d / 90d / 1y / all time)
- Print to PDF (browser print dialog with optimized print CSS)
- Export CSV (full multi-section export)
- PIN-gated access via caregiver portal

### Design overhaul

- Removed dark teal + lime + glass-morphism
- New soft pastel palette: cream backgrounds, white cards, yellowish-green accents, muted blue for clinical features
- More accessible for elderly users and high-contrast lighting
- Better WCAG color contrast ratios than the previous dark theme

### New logo

The brand mark is now the "vela" wordmark with three nested curved arcs to the right (suggesting sound waves / voice preservation). Embedded as inline SVG on every page — single source of truth, no image files needed.

---

## Setup

```powershell
npm install
copy .env.local.example .env.local
notepad .env.local
node server.js
```

Open `http://localhost:3000` → lands on landing page.

If port 3000 is busy:
```powershell
Get-Process -Name node | Stop-Process -Force
node server.js
```

### Environment variables

- `GROQ_API_KEY` — https://console.groq.com/keys
- `ELEVENLABS_API_KEY` — https://elevenlabs.io/app/settings/api-keys

---

## Deploy

```powershell
git add .
git commit -m "v3 — pastel palette + patient report"
git push
```

Vercel auto-deploys from `main`. Environment variables must be set in Vercel dashboard (Project Settings → Environment Variables).

---

## Eye tracking on localhost

WebGazer requires HTTPS for camera access. Use one of:

**A. Test on Vercel:** `https://vela-app-theta.vercel.app/eyetrack.html`

**B. Local SSL proxy:**
```powershell
npm install -g local-ssl-proxy
local-ssl-proxy --source 3001 --target 3000
```
Then Chrome → `https://localhost:3001/eyetrack.html` → Advanced → Proceed.

---

## Navigation flow

```
landing.html (public)
    ↓ Get Started
index.html (consent)
    ↓ Accept
setup.html (if new user)  OR  home.html (if returning)
    ↓
home.html (hub)
    ├→ communicate.html
    ├→ listen.html
    ├→ voicebank.html
    ├→ eyetrack.html
    ├→ caregiver.html (PIN gate)
    │      ↓ Unlock
    │      ├→ patient-report.html (NEW)
    │      ├→ voices list
    │      ├→ phrases manager
    │      └→ PIN change
    └→ settings.html

Every app page: floating "vela" home button (bottom-left) returns to landing.
```

---

## API endpoints (unchanged)

| Endpoint | Use |
|----------|-----|
| `/api/rewrite` | Groq personality + emotion framing |
| `/api/clone-voice` | ElevenLabs voice cloning |
| `/api/speak-cloned` | ElevenLabs TTS with 8 emotions |
| `/api/suggest-responses` | Listen Mode suggestions |

---

## What's not built yet (roadmap)

Hospital section on landing page lists these as Q3/Q4 features. The patient report scaffolds the UI for them — when biomarker pipelines are built, results plug in as new sections.

- Acoustic voice biomarkers (jitter, shimmer, HNR, speech rate, MPT)
- Respiratory early warning
- Caregiver burden index calculation
- Auto-generated PDF reports for monthly neurology appointments
- Multi-patient cohort dashboard for clinicians
- Longitudinal patient timeline

---

## License

Proprietary — Priyanka Chavan, 2026
