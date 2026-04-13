# Header Auditor — HTTP Security Scanner

**Scan any URL and get an AI-powered security header audit with Cloudflare-specific remediation steps.**

Header Auditor fetches a target URL's HTTP response headers, runs a programmatic security analysis against industry best practices, then uses Workers AI to generate a prioritized, plain-English report with actionable Cloudflare dashboard paths for each fix.

## Live Demo

> **[https://header-auditor.kaichew.workers.dev](https://header-auditor.kaichew.workers.dev)** — protected by Cloudflare Access (`@cloudflare.com` + authorized emails only).

## How It Works

```
User enters URL
      │
      ▼
┌─────────────────────────┐
│  Cloudflare Worker       │
│                          │
│  1. Fetch URL headers    │
│  2. Programmatic scan    │──▶ KV Cache (1hr TTL)
│  3. Workers AI analysis  │
│  4. Return scored report │
└─────────────────────────┘
      │
      ▼
Scored report with:
  • Security score (0-100) + letter grade
  • Per-header findings with severity
  • Cloudflare-specific fixes
  • AI-generated prioritized action plan
```

## Cloudflare Products Used

| Product | Purpose |
|---------|---------|
| **Workers** | Core runtime — fetches headers, orchestrates analysis, serves the frontend |
| **Workers AI** | LLM analysis (Llama 3.1 8B) generates prioritized, context-aware recommendations |
| **KV** | Caches scan results by URL for 1 hour — avoids redundant AI calls, reduces latency |
| **Access** | Restricts the deployed Worker to `@cloudflare.com` emails + authorized users |

## Run Locally

### Prerequisites

- Node.js ≥ 18
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- Wrangler CLI (`npm install -g wrangler` or use the project-local copy)

### Setup

```bash
# Clone the repository
git clone https://github.com/kaichew/header-auditor.git
cd header-auditor

# Install dependencies
npm install

# Authenticate with Cloudflare (required for Workers AI)
npx wrangler login

# Create a KV namespace for caching (or skip — the Worker handles KV failures gracefully)
npx wrangler kv namespace create CACHE
# Copy the output ID into wrangler.jsonc → kv_namespaces[0].id

# Start the dev server
npm run dev
```

Then open **http://localhost:8787** and scan any URL.

### Environment Notes

- **Workers AI** requires authentication even in local dev (`wrangler login`).
- **KV** works locally via Wrangler's built-in local storage — no real namespace needed for dev.
- If KV is unavailable, the Worker continues without caching (graceful degradation).

## Deploy

```bash
# Create the KV namespace (if not done already)
npx wrangler kv namespace create CACHE
# Update the ID in wrangler.jsonc

# Deploy
npm run deploy
```

### Protect with Cloudflare Access

1. Go to **Cloudflare Zero Trust Dashboard** → **Access** → **Applications**
2. Add a **Self-Hosted Application** with the Worker's URL
3. Create a policy:
   - **Allow** → Emails ending in `@cloudflare.com`
   - **Allow** → Your personal email
4. Save — all requests to the Worker now require authentication

## Project Structure

```
src/
  index.ts      Entry point — routing, caching, orchestration
  fetcher.ts    Safe URL fetching with SSRF protection + timeout handling
  scanner.ts    Programmatic header analysis — 8 security headers + cookie audit
  ai.ts         Workers AI prompt engineering + structured JSON parsing + fallback
  types.ts      Shared TypeScript interfaces
  ui.ts         Frontend HTML/CSS/JS — dark theme, responsive, zero dependencies
```

## Design Decisions

### Why a hybrid approach (programmatic + AI)?

Pure LLM analysis of headers is unreliable — models hallucinate missing headers or invent values. The programmatic scanner provides deterministic, verifiable results. The AI layer adds value through natural-language summarization, priority ranking, and contextual Cloudflare recommendations that would be impractical to hardcode.

### Why cache in KV?

Scanning the same URL twice in an hour will produce identical results. KV caching eliminates redundant AI inference calls (the most expensive operation), reduces latency to <50ms for cached results, and demonstrates cost-aware engineering.

### Why SSRF protection?

The Worker fetches arbitrary user-provided URLs. Without validation, an attacker could scan internal network addresses. The fetcher blocks private IP ranges (RFC 1918), localhost, and link-local addresses.

## Assumptions

- The target URL is publicly reachable from Cloudflare's network — the Worker cannot scan sites behind firewalls or VPNs.
- HTTP response headers from a single GET request are representative of the site's security posture. In practice, different endpoints may return different headers.
- The Llama 3.1 8B model's security knowledge is sufficient for general-purpose header analysis. It is not a substitute for a dedicated security audit tool like Mozilla Observatory.
- Reviewers have a Cloudflare account (free tier) and Node.js ≥ 18 installed to run locally.

## Trade-offs

- **Single-page frontend served from the Worker** vs. a separate Cloudflare Pages deployment. Chose the former for self-containment — a reviewer can `wrangler dev` and see everything. In production, I'd split these.
- **Llama 3.1 8B** vs. a larger model. The 8B model is faster and free-tier friendly. For a production tool, the 70B variant would produce higher-quality analysis.
- **1-hour cache TTL** is a balance between freshness and cost. A site's headers rarely change minute-to-minute, but a deploy could alter them.
- **Programmatic + AI hybrid** vs. pure AI analysis. A pure LLM approach would be simpler but unreliable — models can hallucinate header values. The hybrid ensures deterministic findings with AI adding natural-language context on top.

## One Thing I'd Improve

**Historical scan tracking with D1.** I'd store every scan in a D1 database keyed by URL + timestamp, then expose a `/api/history/:url` endpoint and a trend view in the UI. This would let users:

1. Track how a site's security posture changes over time
2. Diff two scans to catch regressions after deployments
3. Set up scheduled scans via Cron Triggers to monitor continuously

This transforms the tool from a one-shot auditor into a continuous security monitoring system — which is closer to what Solutions Engineers actually need when onboarding customers.

## Why This Problem?

Solutions Engineers spend significant time auditing customer origins for misconfigured security headers. This is a manual, repetitive diagnostic step that delays the conversation from reaching remediation. Header Auditor automates the discovery phase so the conversation can start at "here's exactly what to fix in the Cloudflare dashboard" instead of "let me check what headers you're missing."
