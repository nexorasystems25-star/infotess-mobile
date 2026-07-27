# Hosting Research: INFOTESS SDMS Backend

> Node.js/Express REST API + SQLite file storage (may migrate to PostgreSQL)
> Expo/React Native mobile app (Expo EAS handles mobile builds)

---

## 1. Northflank

| Criteria | Details |
|---|---|
| **Free Tier** | Yes — Developer Sandbox: 2 always-on services, 1 database, 2 cron jobs |
| **Node.js Support** | Yes (Docker/Nixpacks) |
| **SQLite/PostgreSQL** | PostgreSQL addon available; SQLite works if mounted as volume |
| **Auto-deploy from GitHub** | Yes |
| **Custom Domain** | Yes |
| **Cold Starts** | No — always-on compute on free tier (no sleeping) |
| **Best For** | Prototype/demo and small production |
| **Pricing** | Free sandbox; pay-as-you-go from ~$2.70/mo per service ($0.01667/vCPU/hr) |
| **Ease of Setup** | 3/5 — CLI + dashboard, assumes some Docker familiarity |

**Notes:** Requires credit card to activate sandbox. Per-second billing. Always-on free compute is a major plus — no cold starts. Good Kubernetes-backed platform with BYOC option.

---

## 2. Railway

| Criteria | Details |
|---|---|
| **Free Tier** | Trial: one-time $5 credit (30 days, no card required). Free plan: $1/mo ongoing credits |
| **Node.js Support** | Yes (auto-detect, Nixpacks, or Dockerfile) |
| **SQLite/PostgreSQL** | PostgreSQL native (one-click). SQLite works via volume |
| **Auto-deploy from GitHub** | Yes |
| **Custom Domain** | Yes |
| **Cold Starts** | Scales to zero when credits exhausted; otherwise stays up |
| **Best For** | Quick demo, prototype, small production |
| **Pricing** | Free trial ($5 one-time); Free plan ($1/mo credits); Hobby $5/mo ($5 credits included) |
| **Ease of Setup** | 5/5 — push to GitHub, auto-detect, deploy. Extremely fast |

**Notes:** The $5 trial gives enough to run a Node.js API + small Postgres for weeks. After trial, the $1/mo free plan can barely run one minimal service. Hobby at $5/mo covers a typical Node.js app + small database. **Simplest DX of all platforms.**

---

## 3. Fly.io

| Criteria | Details |
|---|---|
| **Free Tier** | Trial: 2 VM hours or 7 days (whichever first). After trial: 3 shared-CPU VMs (256MB each), 3GB storage, 160GB egress |
| **Node.js Support** | Yes (Dockerfile or built-in builders) |
| **SQLite/PostgreSQL** | PostgreSQL via `fly postgres` (~$14/mo always-on). SQLite via volumes |
| **Auto-deploy from GitHub** | Yes (via GitHub Actions or `fly deploy`) |
| **Custom Domain** | Yes |
| **Cold Starts** | Scale-to-zero supported; cold starts on wake |
| **Best For** | Multi-region apps, latency-sensitive workloads |
| **Pricing** | Free trial very limited; real apps $15-25/mo (compute + IPv4 + storage) |
| **Ease of Setup** | 3/5 — CLI-heavy, requires `fly.toml` config, more ops involved |

**Notes:** Free trial is extremely limited (2 hours total!). Postgres is expensive (~$14/mo always-on). IPv4 costs $2-3.60/mo extra. Realistic monthly cost for a Node.js app + Postgres: $15-25/mo. Great for edge/multi-region but overkill for a demo.

---

## 4. Coolify

| Criteria | Details |
|---|---|
| **Free Tier** | Software is free (open-source, Apache 2.0). You pay for the server |
| **Node.js Support** | Yes (Docker/Nixpacks, 280+ one-click services) |
| **SQLite/PostgreSQL** | PostgreSQL one-click deploy; SQLite works in containers |
| **Auto-deploy from GitHub** | Yes (GitHub, GitLab, Bitbucket, Gitea) |
| **Custom Domain** | Yes (auto-SSL via Let's Encrypt) |
| **Cold Starts** | No — always-on on your own server |
| **Best For** | Developers with DevOps experience who want full control |
| **Pricing** | Free software + VPS cost (~$6-25/mo from Hetzner/DO). Cloud option $5/mo for managed dashboard |
| **Ease of Setup** | 2/5 — requires SSH, Linux VPS, Docker knowledge. Steeper learning curve |

**Notes:** Self-hosted PaaS. You need your own VPS (Hetzner ~€6/mo). Maximum control and no vendor lock-in. But requires DevOps capability — not ideal for quick demos. Great long-term if you plan to host multiple apps.

---

## 5. DigitalOcean App Platform

| Criteria | Details |
|---|---|
| **Free Tier** | Yes — but ONLY for static sites (3 apps, 1 GiB transfer each) |
| **Node.js Support** | Yes (web services from $5/mo) |
| **SQLite/PostgreSQL** | Managed databases from $15/mo; SQLite via volumes |
| **Auto-deploy from GitHub** | Yes |
| **Custom Domain** | Yes |
| **Cold Starts** | Always-on for paid tiers |
| **Best For** | Teams already using DigitalOcean ecosystem |
| **Pricing** | Free tier (static only); web services from $5/mo; managed DB from $15/mo |
| **Ease of Setup** | 4/5 — clean dashboard, good documentation |

**Notes:** Free tier is static-sites only — no free compute for Node.js backends. Cheapest dynamic app: $5/mo (512MB, shared CPU). Managed PostgreSQL is $15/mo extra. Total for API + DB: $20+/mo. $200 free credit for new accounts (60 days).

---

## 6. Vercel

| Criteria | Details |
|---|---|
| **Free Tier** | Hobby plan: free, generous for frontend/Next.js |
| **Node.js Support** | Serverless functions only (not long-running processes) |
| **SQLite/PostgreSQL** | No native DB support; external databases only |
| **Auto-deploy from GitHub** | Yes |
| **Custom Domain** | Yes |
| **Cold Starts** | Yes — serverless functions have cold starts |
| **Best For** | Frontend/Next.js apps, not backend APIs |
| **Pricing** | Hobby: free (non-commercial, personal only); Pro: $20/seat/mo |
| **Ease of Setup** | 5/5 for Next.js; 2/5 for Express backends |

**Notes:** **NOT suitable for this use case.** Vercel is designed for frontend/static sites and Next.js. It runs serverless functions, not persistent Node.js/Express servers. No WebSocket support, no persistent storage, 10s function timeout on free tier, no commercial use allowed on Hobby. Express API would need complete restructuring.

---

## 7. Heroku

| Criteria | Details |
|---|---|
| **Free Tier** | None — removed November 2022 |
| **Node.js Support** | Yes (first-class, auto-detected buildpack) |
| **SQLite/PostgreSQL** | Heroku Postgres from $5/mo (Mini plan) |
| **Auto-deploy from GitHub** | Yes (Heroku Git or GitHub integration) |
| **Custom Domain** | Yes |
| **Cold Starts** | Eco dynos sleep after 30 min; Basic and up always-on |
| **Best For** | Enterprise teams with budget, legacy Heroku users |
| **Pricing** | Eco: $5/mo (sleeps, 1000 shared hours); Basic: $7/mo; Standard: $25/mo |
| **Ease of Setup** | 4/5 — mature platform, good docs, `git push heroku` |

**Notes:** No free tier at all. Cheapest option: Eco at $5/mo (but sleeps after 30 min — cold starts). Basic at $7/mo for always-on. Postgres starts at $5/mo extra. Total minimum: $10-12/mo. Historically great DX but expensive for what you get in 2026.

---

## Quick Comparison Matrix

| Platform | Free Tier (Backend) | Min Cost (API + DB) | Cold Starts | Setup Speed | SQLite Support |
|---|---|---|---|---|---|
| **Northflank** | 2 services + 1 DB | ~$2.70/mo | No (always-on) | Medium | Via volume |
| **Railway** | $5 trial → $1/mo credits | ~$5-8/mo (Hobby) | No (if paid) | Very fast | Via volume |
| **Fly.io** | Very limited trial | ~$15-25/mo | Yes (scale-to-zero) | Medium-slow | Via volume |
| **Coolify** | Free software (need VPS) | ~$6-25/mo (VPS) | No | Slow (ops-heavy) | Via container |
| **DO App Platform** | Static only | ~$20/mo | No | Fast | Via volume |
| **Vercel** | Functions only | N/A (not for Express) | Yes | Fast (wrong stack) | No |
| **Heroku** | None | ~$10-12/mo | Yes (Eco) | Fast | Via addon |

---

## Recommendation: Top 2 Platforms

### #1: Railway (Best for Quick Demo)

**Why:**
- Fastest deployment experience — push to GitHub, auto-detect Node.js, deploy in under 2 minutes
- $5 free trial (no credit card) runs a Node.js API + Postgres for weeks
- Native PostgreSQL support (no addon hunting)
- Usage-based billing means you only pay for what you use
- Custom domains included free
- Perfect for demoing to stakeholders or clients

**Setup time:** Under 5 minutes
**Cost for demo:** $0 (trial credits cover it)
**Cost for ongoing:** $5/mo (Hobby plan)

### #2: Northflank (Best Balance of Free + Production-Ready)

**Why:**
- Free tier has **always-on compute** (no cold starts, no sleeping)
- 2 services + 1 database on free sandbox — enough for API + Postgres
- Per-second billing is fair and transparent
- Better long-term value than Railway for sustained workloads
- Kubernetes-backed (can scale if the project grows)

**Setup time:** ~10-15 minutes
**Cost for demo:** $0 (free sandbox, credit card required)
**Cost for ongoing:** $2.70+/mo (pay-as-you-go)

### Why Not the Others?

| Platform | Reason |
|---|---|
| **Vercel** | Wrong architecture — serverless functions, not persistent Express servers |
| **Heroku** | No free tier, expensive for what it offers, cold starts on cheapest plan |
| **Fly.io** | Overcomplicated for a demo, expensive Postgres, limited free trial |
| **DigitalOcean** | Free tier is static-only, $20+/mo minimum for API + DB |
| **Coolify** | Requires DevOps skills and a VPS — too much setup for a quick demo |

---

*Research compiled July 2026. Pricing may change — always verify on official pricing pages.*
