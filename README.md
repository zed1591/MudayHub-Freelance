# MudayHub

An Ethiopia-focused marketplace for digital services and project work. The product includes service listings, project briefs, proposals, contract workspaces, messaging, and dispute records.

## Stack

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Supabase Auth and Postgres with row-level security
- Local file-backed walkthrough mode for development only
- Payment gateway interfaces for demo payments and Chapa payment verification

## Local development

```bash
npm install
cp .env.example .env.local
```

Set the Supabase URL, anon key, and service-role key in `.env.local`. Keep both demo flags disabled. Set a unique `ESCROW_WEBHOOK_SECRET` (for example, generate one with `openssl rand -hex 32`) and start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

For an isolated local walkthrough only, set both `DEMO_MODE=true` and `NEXT_PUBLIC_DEMO_MODE=true`. Demo accounts then use password `demo1234`:

| Email | Role |
| --- | --- |
| `client@mudayhub.et` | Client |
| `freelancer@mudayhub.et` | Freelancer |
| `designer@mudayhub.et` | Freelancer |
| `admin@mudayhub.et` | Admin |

Demo mode uses a local file store and simulated payment events. It is for walkthroughs only and must never be deployed with real users or money.

## Production setup

1. Create a Supabase project and apply every migration in `supabase/migrations/` in numeric order.
2. Set `DEMO_MODE=false` and `NEXT_PUBLIC_DEMO_MODE=false`.
3. Configure the Supabase URL, anon key, and service role key. Keep the service role key private.
4. Set `NEXT_PUBLIC_APP_URL` to the public URL of this deployment. In Supabase Auth → URL Configuration, set the Site URL to that same origin and allow `https://your-domain/reset-password` as a redirect URL (plus the local URL for development).
5. Keep the Supabase Reset Password email template on `{{ .ConfirmationURL }}` or ensure a customized template uses `{{ .RedirectTo }}`. Remove any hard-coded link or old Site URL from the previous deployment.
6. Review authentication email, cookie, origin, logging, backups, and incident-response settings.
7. Complete a security review of every API route and database policy before launch.

### Security launch checklist

- Keep `DEMO_MODE` and `NEXT_PUBLIC_DEMO_MODE` set to `false`; demo accounts and mock payments are never production-safe.
- Store service-role and payment secrets only in the deployment secret manager. Rotate webhook secrets and revoke old keys after any suspected exposure.
- Put the app behind a CDN/WAF and a shared rate limiter. The built-in API limiter is per instance and is only a first layer of defense.
- Apply migration `006_security_audit.sql`, send structured application logs to a protected log sink, and alert on repeated 401/403/429 responses, admin actions, and payment-webhook failures.
- Configure Supabase Auth email confirmation, breached-password protection, MFA for administrators, and a restrictive allow-list of redirect URLs.
- Run dependency scanning, secret scanning, database-backup restore tests, and an independent penetration test before accepting real customer funds.

### Payment launch gate

Production deposits, payouts, and refunds are **disabled**. The Chapa adapter can initialize and verify incoming payments, but it does not implement beneficiary payouts or customer refunds, and no regulated escrow custody arrangement is represented by this application. Checkout returns `503` unless both payout and refund operations are supported by the selected provider.

Before accepting real deposits, implement and reconcile provider-backed payouts and refunds, confirm the legal/provider arrangement for holding customer funds, publish fees and dispute terms, and complete operational and security reviews. Do not remove the checkout gate to launch sooner.

## Docker deployment

Docker builds a small Next.js standalone image and runs it as an unprivileged user. For a production-style Docker run, configure `.env.docker` from the example and set the deployed app URL and Supabase credentials:

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f app
```

`NEXT_PUBLIC_*` values are included in the browser bundle at image build time, so rebuild after changing them.

For local walkthroughs only, explicitly use the demo environment file:

```bash
APP_ENV_FILE=.env.local docker compose --env-file .env.local up --build -d
```

The app listens on port 3000 by default. Set `APP_PORT` in the selected environment file to publish another host port. Stop a production container with `docker compose --env-file .env.docker down`. For a demo container, use `APP_ENV_FILE=.env.local docker compose --env-file .env.local down`.

The image defaults to production mode with demo behavior disabled. Do not set either demo flag to `true` for a deployment with real users.

## Migrations

- `001_initial_schema.sql` creates the core schema and row-level security policies.
- `002_production_hardening.sql` prevents user role escalation and creates contracts atomically when a proposal is accepted.
- `003_profile_privacy.sql` prevents public exposure of phone and payout details.
- `004_marketplace_integrity.sql`, `005_payment_operations.sql`, and `006_security_audit.sql` add marketplace/payment integrity controls and an append-only security audit store.

Apply migrations in order. Review policies and functions against the deployment’s Supabase configuration before applying them to production.
