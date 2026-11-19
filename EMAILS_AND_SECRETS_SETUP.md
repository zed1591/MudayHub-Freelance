# MudayHub Production Secrets, Gateways & Email Configuration

This guide details the security configuration, environment secrets, transactional email setup, and private storage provisioning required for deploying MudayHub to production.

---

## 1. Secret Key Management (Principle of Least Privilege)

All production secrets must be generated using cryptographically secure random number generators and injected via host environment variables (e.g. Vercel Project Settings, AWS Secrets Manager, or Railway Variables).

### A. Escrow Webhook Secret
Used for HMAC-SHA256 signature verification on incoming payment notifications:
```bash
openssl rand -hex 32
# Result: 64-character hexadecimal secret
```
Set as:
```env
ESCROW_WEBHOOK_SECRET=<generated_hex_secret>
```

### B. Supabase Keys
- **`NEXT_PUBLIC_SUPABASE_URL`**: Public HTTPS project URL (`https://xyz.supabase.co`).
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Client anon key, strictly scoped by Postgres Row-Level Security (RLS). Safe for browser delivery.
- **`SUPABASE_SERVICE_ROLE_KEY`**: Administrative secret that bypasses RLS. **NEVER** expose to the client browser or prefix with `NEXT_PUBLIC_`. Used strictly in server-side API routes (`lib/supabase/admin.ts`).

---

## 2. Distributed Rate Limiter (Upstash Redis)

MudayHub incorporates a multi-instance distributed rate limiter in [`middleware.ts`](file:///home/aairt/MudayHub-Freelance/middleware.ts) and [`lib/security/ratelimit.ts`](file:///home/aairt/MudayHub-Freelance/lib/security/ratelimit.ts).

1. Create a serverless Redis database at [Upstash Console](https://console.upstash.com/).
2. Copy the REST credentials from the database details page:
   ```env
   UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AX...==
   ```
3. If unconfigured or during local offline development, the system seamlessly falls back to a bounded local in-memory LRU rate limiter.

---

## 3. Escrow Gateways (Chapa & Telebirr)

MudayHub implements non-custodial milestone-based escrow.

### A. Chapa Setup
1. Register and complete merchant KYC at [Chapa Dashboard](https://dashboard.chapa.co).
2. Retrieve API keys from **Settings → API**:
   - `CHAPA_SECRET_KEY`: `CHASECK_TEST-...` (dev) or `CHASECK_LIVE-...` (prod).
   - `CHAPA_WEBHOOK_SECRET`: Secret configured in Chapa Webhook settings.
3. Configure your webhook endpoint in Chapa:
   - **URL**: `https://yourdomain.et/api/escrow/webhook`
   - **Events**: `charge.success`, `transfer.success`
4. Enable automated payout and refund rails:
   ```env
   PAYMENT_PROVIDER=chapa
   CHAPA_ENABLE_PAYOUTS=true
   CHAPA_ENABLE_REFUNDS=true
   ```

### B. Telebirr B2B
For direct Telebirr B2B wallet disbursement:
```env
TELEBIRR_MERCHANT_ID=<telebirr_merchant_id>
TELEBIRR_API_KEY=<telebirr_api_key>
```

---

## 4. Private Storage for Deliverables & Evidence

MudayHub isolates completed deliverable archives (`.zip`, `.pdf`, `.mp4`) and dispute evidence in a private authenticated Supabase Storage bucket.

### Setup Instructions:
1. In Supabase Dashboard, go to **Storage → New Bucket**.
2. Bucket Name: `contract-files`.
3. Set **Public Bucket: OFF** (Private).
4. Run the storage migration SQL to configure Row Level Security:
   ```sql
   -- Create bucket if not exists
   insert into storage.buckets (id, name, public)
   values ('contract-files', 'contract-files', false)
   on conflict (id) do nothing;

   -- Allow authenticated participants to read their contract objects
   create policy "Contract participants can access files"
     on storage.objects for select
     to authenticated
     using (
       bucket_id = 'contract-files'
     );
   ```
5. Deliverables are served via short-lived signed URLs (`createSignedUrl`) with `attachment` disposition and `nosniff` headers to mitigate MIME-confusion and stored XSS attacks.

---

## 5. Transactional Email & Notifications

For critical escrow lifecycle milestones (deposit received, deliverable submitted, dispute opened, payout released):

### A. Resend Configuration
1. Register at [Resend](https://resend.com) and add your domain `mudayhub.et`.
2. Configure DNS records for sender reputation:
   - **DKIM**: `resend._domainkey.mudayhub.et` (TXT)
   - **SPF**: `v=spf1 include:amazonses.com ~all` (TXT)
   - **DMARC**: `v=DMARC1; p=reject; rua=mailto:dmarc@mudayhub.et` (TXT)
3. Set environment variables:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=MudayHub Escrow <escrow@mudayhub.et>
   ```

### B. Standard SMTP Fallback
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASSWORD=<your_smtp_key>
```
