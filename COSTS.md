# Moduflow Cost Model

Last updated: 2026-05-12

This file is the operating cost guide for the backend.

It is not a legal quote. Prices change, many are region-dependent, and some vendors price by usage rather than flat monthly spend.

All numbers below are in USD and based on official vendor pricing pages available on 2026-05-12.

## 1. Executive summary

There are three realistic ways to start:

### Option A: local-only development

- Cost: `~$0/month`
- Use case: schema work, service design, TDD, local API development
- Limitation: not suitable for stakeholder demos, webhooks, or shared QA

### Option B: cheapest hosted MVP

- Cost: `~$5 to $25/month`
- Use case: one-developer startup phase, low traffic, low operational overhead
- Tradeoff: weaker infra guarantees, lower observability depth, less production realism

### Option C: managed cloud stack aligned with the backend plan

- Cost: `~$50 to $150/month` for a serious starter environment
- Use case: realistic beta environment with managed DB, managed runtime, managed secrets, managed storage
- Tradeoff: higher fixed cost before revenue

The single biggest cost trap in the planned architecture is not the app runtime. It is `managed Redis + managed observability + managed database` before you actually need them.

## 2. Current planned stack cost drivers

### Google Cloud Run

Official pricing:

- CPU: `$0.00001800 / vCPU-second`
- Memory: `$0.00000200 / GiB-second`
- Always free:
  - first `240,000 vCPU-seconds / month`
  - first `450,000 GiB-seconds / month`

Source:
- `Cloud Run pricing`: <https://cloud.google.com/run>

Practical interpretation:

- If the service scales to zero when idle, Cloud Run can stay very cheap early on.
- If you keep one warm instance running all month, the cost becomes noticeable.
- A rough always-on example for `0.25 vCPU` and `0.5 GiB` is about:
  - CPU: `0.25 * 2,592,000 * 0.000018 = ~$11.66`
  - memory: `0.5 * 2,592,000 * 0.000002 = ~$2.59`
  - total before free tier effects: `~$14.25/month`

Recommendation:

- Start with scale-to-zero.
- Avoid minimum instances until you have a real latency reason.

### Cloud SQL for PostgreSQL

Official pricing signals:

- shared-core `db-f1-micro`: `$0.0105/hour`
- shared-core `db-g1-small`: `$0.035/hour`
- shared-core machines are **not covered by Cloud SQL SLA**

Sources:
- `Cloud SQL pricing`: <https://cloud.google.com/sql/pricing/>
- regional shared-core example with prices surfaced in official docs search results

Approximate monthly cost at `730 hours/month`:

- `db-f1-micro`: `~$7.67/month`
- `db-g1-small`: `~$25.55/month`

Important:

- storage, backups, and egress are separate
- production-grade dedicated-core or HA setups will cost materially more

Recommendation:

- Development or very early hosted MVP: `db-f1-micro` is acceptable if you accept no SLA.
- Serious beta: move to a dedicated-core or at least a stronger shared-core plan only when real usage requires it.

### Memorystore for Redis

Official pricing for `us-central1` on the pricing page:

- Basic Tier `M1 (1 to 4 GiB)`: `$0.049 / GiB-hour`
- Standard Tier `M1 (1 to 4 GiB)`: `$0.064 / GiB-hour`

Source:
- <https://cloud.google.com/memorystore/docs/redis/pricing>

Approximate monthly cost for the minimum `1 GiB` case:

- Basic Tier: `0.049 * 730 = ~$35.77/month`
- Standard Tier: `0.064 * 730 = ~$46.72/month`

This is the biggest early-stage infrastructure problem in the current plan.

Recommendation:

- Do **not** start with managed Redis unless you already need BullMQ workers in a hosted shared environment.
- Cheapest path:
  - local development: Docker Redis
  - first hosted MVP: Upstash free or pay-as-you-go, or no Redis until async jobs are truly needed

### Secret Manager

Official pricing:

- active secret versions: `$0.06 per version per location / month`
- access operations: `$0.03 per 10,000`

Source:
- <https://cloud.google.com/secret-manager/pricing>

Practical interpretation:

- negligible early cost
- `10` active secrets is about `~$0.60/month` before access charges

### Artifact Registry

Official pricing:

- first `0.5 GB`: free
- above that: `$0.10 / GB / month`

Source:
- <https://cloud.google.com/artifact-registry/pricing>

Practical interpretation:

- usually negligible at the beginning

### Cloud Storage

Official pricing examples for North America regional standard storage:

- standard storage starts at `$0.020 / GB / month`
- free tier includes `5 GiB` standard storage

Source:
- <https://cloud.google.com/storage/pricing>

Practical interpretation:

- document storage is cheap early on unless users upload large media or large document archives

## 3. SaaS service costs

### WorkOS

Official pricing:

- users: free up to `1 million users`
- SSO: `$125 per connection / month`
- Directory Sync: `$125 per connection / month`
- custom domain: `$99 / month`

Source:
- <https://workos.com/pricing>

Practical interpretation:

- WorkOS is cheap early if you only need auth and organization modeling
- it becomes expensive only when enterprise SSO or directory sync enters the picture

Recommendation:

- start with WorkOS core auth only
- do not enable enterprise SSO work until you have a customer who will pay for it

### Stripe

Official pricing:

- Stripe Billing pay-as-you-go: `0.7% of billing volume`
- Stripe Payments card processing in the US: `2.9% + 30c` per successful card charge
- ACH direct debit: `0.8%`, capped at `$5`

Sources:
- <https://stripe.com/us/billing/pricing>
- <https://stripe.com/pricing>

Practical interpretation:

- no fixed monthly fee is required to begin
- Stripe cost scales with revenue, which is usually the correct startup tradeoff

Recommendation:

- default to Stripe unless you specifically need Merchant of Record behavior

### Paddle

Paddle is a valid alternative if you need Merchant of Record handling for tax/compliance, but pricing is usually a sales conversation rather than a simple transparent starter number.

Source:
- <https://www.paddle.com/billing/subscriptions>

Recommendation:

- use Stripe first unless tax/compliance outsourcing is a hard requirement

### Resend

Official pricing:

- Free: `$0`, `3,000 emails/month`, `100/day`
- Pro: `$20/month`, `50,000 emails/month`
- Scale: `$90/month`, `100,000 emails/month`

Source:
- <https://resend.com/pricing>

Recommendation:

- start on Free
- upgrade only when invitation volume, invoice volume, or notification volume justifies it

## 4. Observability and operations costs

### Sentry

Official pricing:

- Developer: `$0`
- Team: `$26/month`
- Business: `$80/month`
- Team includes `50k` errors, `5GB` logs, `5GB` application metrics, `5M` spans

Source:
- <https://sentry.io/pricing/>

Recommendation:

- start with Sentry free or Team
- Sentry alone is enough for early error tracking and traces

### Grafana OSS stack (Grafana, Loki, Tempo, Mimir)

Licensing and practical cost model:

- Grafana, Loki, Tempo, and Mimir are open-source projects
- there is no mandatory per-seat/per-tenant software fee to run OSS locally
- cost is mostly your compute/storage footprint once self-hosted beyond local development

Sources:
- <https://grafana.com/oss/>
- <https://grafana.com/oss/loki/>
- <https://grafana.com/oss/tempo/>
- <https://grafana.com/oss/mimir/>

Recommendation:

- early phase: do not deploy full Loki/Tempo/Mimir stack
- use `Sentry + OpenTelemetry + health checks` first
- add Grafana stack later when log/trace retention and dashboarding needs justify the ops overhead

### Postman

Official pricing:

- Free: `$0`
- Solo: `$9/month` billed annually

Source:
- <https://www.postman.com/pricing/>

Recommendation:

- start on Free
- upgrade only if the collaboration and governance features become a real bottleneck

## 5. Example monthly stack budgets

These are practical planning models, not invoices.

### Model 1: `Free / almost free`

- local Docker PostgreSQL: `$0`
- local Docker Redis: `$0`
- local Docker MinIO: `$0`
- no hosted backend: `$0`
- WorkOS core auth: `$0`
- Resend Free: `$0`
- Sentry Free: `$0`
- Grafana OSS local: `$0` additional software fee
- Postman Free: `$0`

Estimated monthly total:

- `~$0`

Best for:

- planning
- schema validation
- TDD
- API design
- first internal development

### Model 2: `Cheapest hosted MVP`

Suggested stack:

- app hosting: Railway Hobby `~$5 minimum`
- database: Supabase Free or Supabase Pro `from $0 to $25`
- Redis: Upstash Free `~$0`
- auth: WorkOS core `~$0`
- email: Resend Free `~$0`
- errors: Sentry Free `~$0`
- observability: keep minimal (`Sentry + OpenTelemetry`) `~$0`
- API tooling: Postman Free `~$0`

Estimated monthly total:

- ultra-cheap route: `~$5 to $15`
- safer hosted route with Supabase Pro: `~$25 to $35`

Sources:

- Railway: <https://railway.com/pricing>
- Supabase: <https://supabase.com/pricing>
- Upstash: <https://upstash.com/pricing>

Best for:

- early demo environment
- first external testers
- pre-revenue stage

Tradeoffs:

- less control than the target cloud architecture
- not ideal for long-term production topology

### Model 3: `Managed GCP starter`

Suggested stack:

- Cloud Run: `~$0 to $15+`
- Cloud SQL `db-f1-micro`: `~$7.67+`
- Cloud Storage: `~$0`
- Secret Manager: `~$0.60+`
- Artifact Registry: `~$0`
- Redis:
  - none yet: `~$0`
  - Memorystore Basic 1 GiB: `~$35.77`
- WorkOS core: `~$0`
- Resend Free: `~$0`
- Sentry Team: `$26` or Free: `$0`
- Grafana stack: deferred (or self-hosted with infra-only cost)

Estimated monthly total:

- without managed Redis, minimal observability spend: `~$10 to $40`
- with Memorystore + Sentry Team: `~$70 to $90`
- with Memorystore + Sentry Team + hosted observability footprint: `~$95 to $120`

Best for:

- realistic beta stack
- closer production parity
- early customer pilots

### Model 4: `Production-leaning small SaaS`

Suggested stack:

- Cloud Run with warm instances or higher traffic
- dedicated-core Cloud SQL or stronger instance class
- Memorystore Standard
- Resend Pro
- Sentry Team or Business
- full observability stack operations (Grafana/Loki/Tempo/Mimir)

Estimated monthly total:

- `~$150 to $500+`

Why this jumps:

- Redis gets real
- DB gets real
- observability gets real
- email volume starts to matter

## 6. Cheapest acceptable path to start

If the goal is to start fast and keep burn low, this is the best first backend setup:

- Hosting: Railway Hobby
- Database: Supabase Free or Pro
- Redis: none at first, or Upstash Free only when queue work starts
- Object storage: local MinIO first
- Auth: WorkOS core auth only
- Billing: Stripe only when subscriptions are implemented
- Email: Resend Free
- Errors: Sentry Free
- Observability: OpenTelemetry basics, defer full Grafana stack
- Postman: Free

Expected cost:

- `~$5/month` if you stay very lean
- `~$25 to $35/month` if you want a more stable hosted DB from day one

This is the best cost/performance starting point.

## 7. What to defer to save money

Do not pay for these on day one unless the task truly requires them:

- Memorystore
- full hosted observability stack rollout
- Sentry paid plans
- WorkOS SSO connections
- WorkOS Directory Sync
- WorkOS custom domain
- Stripe custom billing domain
- Cloud Run warm instances
- Cloud SQL HA
- advanced log retention

## 8. Practical recommendation

### Phase 1: build and validate

- use local Docker for PostgreSQL, Redis, and MinIO
- use WorkOS free/core auth
- use Resend Free
- use Sentry Free
- use Postman Free
- keep cost at `~$0`

### Phase 2: first hosted beta

- deploy app on Railway Hobby
- use Supabase Free or Pro
- use Upstash Free only if queue work is needed
- keep observability minimal (`Sentry + OpenTelemetry`)
- expected cost: `~$5 to $35/month`

### Phase 3: move to target cloud architecture

- move app to Cloud Run
- move DB to Cloud SQL
- add Secret Manager, Artifact Registry, Cloud Storage
- add Redis only when worker throughput or queue guarantees justify it
- expected cost: `~$50 to $120/month` before serious traffic

## 9. Sources

- Cloud Run: <https://cloud.google.com/run>
- Cloud SQL: <https://cloud.google.com/sql/pricing/>
- Memorystore for Redis: <https://cloud.google.com/memorystore/docs/redis/pricing>
- Secret Manager: <https://cloud.google.com/secret-manager/pricing>
- Artifact Registry: <https://cloud.google.com/artifact-registry/pricing>
- Cloud Storage: <https://cloud.google.com/storage/pricing>
- WorkOS: <https://workos.com/pricing>
- Stripe Billing: <https://stripe.com/us/billing/pricing>
- Stripe Payments: <https://stripe.com/pricing>
- Resend: <https://resend.com/pricing>
- Sentry: <https://sentry.io/pricing/>
- MinIO: <https://min.io/>
- Grafana OSS: <https://grafana.com/oss/>
- Grafana Loki: <https://grafana.com/oss/loki/>
- Grafana Tempo: <https://grafana.com/oss/tempo/>
- Grafana Mimir: <https://grafana.com/oss/mimir/>
- Postman: <https://www.postman.com/pricing/>
- Supabase: <https://supabase.com/pricing>
- Upstash: <https://upstash.com/pricing>
- Railway: <https://railway.com/pricing>
