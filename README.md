# Nandan Volunteer Portal

A volunteer portal and admin panel for Nandan (Chittagong). Phone-number + password auth
with OTP verification, membership dues tracking, and event listings.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Postgres via Prisma, hosted on Supabase
- Custom phone/password auth: bcrypt password hashing, JWT session cookie (httpOnly, signed with `jose`)
- OTP delivery abstracted behind `sendOtp()` in [src/lib/sms.ts](src/lib/sms.ts) — logs to the console in development

## 1. Set up the database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project dashboard, go to **Settings → Database → Connection string**.
3. Copy the **Transaction pooler** connection string (port `6543`) into `DATABASE_URL`, and the
   **Session/direct** connection string (port `5432`) into `DIRECT_URL` in your `.env` file.
   (Prisma uses the pooler at runtime and the direct connection for running migrations.)
4. Generate a session secret: `openssl rand -base64 32`, and set it as `SESSION_SECRET` in `.env`.

`.env.example` shows the expected shape. `.env` is already gitignored.

## 2. Install dependencies and set up the schema

```bash
npm install
npx prisma migrate dev --name init
```

This creates the `Volunteer`, `OtpCode`, `DuePayment`, `PaymentSubmission`, and `Event` tables
(see [prisma/schema.prisma](prisma/schema.prisma)).

## 3. Create your first admin

Any volunteer can be promoted to admin from the admin panel (**Volunteers → select a
volunteer → Promote to admin**) — there's no single hardcoded admin account. But since that UI
is itself behind an admin login, the very first admin has to be set directly in the database.
After signing up normally through `/signup`, flip `isAdmin` to `true` for that one volunteer via
Supabase's table editor, or via Prisma Studio:

```bash
npx prisma studio
```

From then on, that admin can promote (or demote) any other volunteer from the admin panel. An
admin can't remove their own admin access, to avoid accidentally locking everyone out.

## 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). During signup / password reset, the OTP
code is printed to the terminal running `next dev` instead of being sent as a real SMS.

## Plugging in a real SMS gateway

Edit [src/lib/sms.ts](src/lib/sms.ts) — swap the `fetch` call for your provider's REST API
(BulkSMSBD, Alpha SMS, sms.bd, etc.), and set `SMS_API_URL` / `SMS_API_KEY` in production.

## Project structure

```
src/
  app/
    (auth)/            signup, login, forgot-password — shared centered auth shell
    dashboard/         volunteer dashboard (dues, payment claim form, upcoming events, profile)
    admin/             admin panel (volunteer management, admin promotion, pending payment
                       review, due entries, event CRUD)
  components/          shared UI (site header) and admin-only client components
  lib/
    actions/           Server Actions for auth and admin mutations
    auth/               password hashing, OTP issuance/verification, JWT session helpers
    db.ts              Prisma client singleton
    sms.ts             sendOtp() abstraction
    validation.ts       zod schemas (phone format, password strength, etc.)
  proxy.ts             route protection (Next.js 16's proxy/middleware convention)
prisma/schema.prisma   data model
```
