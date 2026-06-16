# Cupbop Maintenance Command Center

Preventive maintenance and work order tracking for the Cupbop restaurant chain. Replaces
the legacy Excel workbooks with a modern multi-role dashboard, location portal, technician
queue, and reporting layer.

## What it does

- **Admin dashboard** — KPIs for completed work orders & PM (week/month/year), open & urgent
  counts, overdue / due-soon previews, "Locations at a Glance" table sorted by hottest store,
  and 5 charts (work orders over time, PM over time, open by priority, by location, compliance).
- **Work orders** — create, edit, assign, comment, status pipeline (New → Assigned → Ordered →
  Scheduled → In Progress → Waiting on Vendor → Complete / Cancelled). Default **grouped by
  location**, with a flat table toggle.
- **Preventive maintenance** — recurring tasks per location/category with auto-calculated
  next service date and per-category checklist. Default **grouped by location** with a
  flat-table toggle. Each row shows **last service** and **next service** prominently.
- **Per-location pages** — `/locations/[name]` brings together open work orders, full PM
  schedule (last/next service per category), and recent completions for that store.
- **Location portal** — store managers submit work orders, view their store's PM and history.
- **Technician portal** — mobile-friendly queue of assigned work orders and upcoming PM.
  Includes a prominent **Create Work Order** button so technicians can self-log issues.
- **Reports** — week/month/year summaries, busiest locations, top categories.
- **CSV exports** — `/api/export/work-orders` and `/api/export/maintenance`.

## Tech stack

- **Next.js 15** App Router + React 19 RC
- **TypeScript**
- **Tailwind CSS** + shadcn-style components
- **Prisma 5** ORM
- **SQLite** by default (swap `DATABASE_URL` to Postgres / Neon / Supabase for production)
- **Recharts** for charts
- **lucide-react** for icons
- Server Actions for all mutations · cookie-based session auth

## Setup

```bash
# 1. install
npm install

# 2. push schema and seed the database
npm run db:reset

# 3. start the dev server
npm run dev
```

Then open <http://localhost:3000>.

## Environment variables

| Var | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | yes | `file:./dev.db` | Swap to a Postgres URL when moving off SQLite |
| `AUTH_SECRET` | yes | dev placeholder | Change for production |

A working `.env` is included for local development. `.env.example` is the template.

## Database

Tables created by the Prisma schema:

- `User`, `Location`, `Technician`, `MaintenanceCategory`, `Vendor`
- `PreventiveTask`, `PreventiveTaskCompletion`
- `WorkOrder`, `WorkOrderComment`

Seed populates **30 Cupbop locations** (Provo, Daybreak, Draper, … Huachuca Army Base),
**8 technicians/vendors**, **7 maintenance categories**, recurring PM tasks for every
location/category, **18 open + 16 historical completed work orders**, and ~250 historical
PM completions spread across the past 6 months so all dashboard date-range KPIs are populated.

## Demo accounts

No password — just sign in by email on the login screen (or click a demo card).

| Role | Email |
|---|---|
| Admin / Maintenance Manager | `admin@cupbopmaintenance.com` |
| Technician (Rodney) | `technician@cupbopmaintenance.com` |
| Location Manager (Provo) | `provo@cupbopmaintenance.com` |

Every other location also has a manager account in the form
`<locationname>@cupbopmaintenance.com` (e.g. `draper@cupbopmaintenance.com`).

## Routes

```
/                       redirect by role
/login                  sign-in
/dashboard              admin KPIs + charts
/work-orders            list + filter
/work-orders/new        create
/work-orders/[id]       detail, comments, status updates
/maintenance            list + filter
/maintenance/[id]/complete  complete a PM task
/locations              location directory
/technicians            technician directory
/reports                summaries + top locations/categories
/import                 CSV import (UI scaffolded)
/settings               categories, defaults, company profile
/technician             technician portal (mobile-friendly queue)
/location               store manager portal (submit + status)
/api/export/work-orders CSV export
/api/export/maintenance CSV export
```

## Deploying to Vercel

The repo ships with a `vercel-build` script that handles the SQLite → Postgres swap
automatically when Vercel builds the project.

1. Push the repo to GitHub (or import this one).
2. **Create a Postgres database** — easiest options:
   - Vercel Storage → Postgres (one-click, free hobby tier)
   - [Neon](https://neon.tech) free tier
   - Supabase free tier
3. In Vercel project settings → Environment Variables, add:
   - `DATABASE_URL` = your Postgres connection string
   - `AUTH_SECRET` = any long random string
4. Deploy. The `vercel-build` script:
   - swaps Prisma's datasource provider to `postgresql`
   - runs `prisma db push` to create the schema
   - runs `next build`
5. **Seed the production DB** once: from your local machine with `DATABASE_URL` pointed at
   the production Postgres, run `npm run db:seed`. This populates the 30 locations,
   technicians, and demo accounts.

## What's connected to real data

- All KPIs on `/dashboard`, `/technician`, `/location`, `/reports` are calculated from the
  database.
- Marking a PM task complete updates `lastServiceDate`, recalculates `nextServiceDate`, and
  recomputes status.
- Work order status changes flip `completedAt` accordingly.
- Role-based scoping: technicians see only their assignments; location managers see only
  their store.

## What still needs to be connected for production

- **Real file uploads** — replace the `photoUrl` URL field on work orders & PM completions
  with UploadThing or Supabase Storage.
- **Real auth** — swap the cookie-based demo login for Auth.js (credentials + magic links).
- **Email / SMS notifications** — wire SendGrid/Twilio in the `actions/` server actions
  (placeholders mentioned in `/settings`).
- **CSV import worker** — `/import` ships the validation pipeline UI; the parser/commit step
  is scaffolded but not enabled.
- **Move off SQLite** — change Prisma `provider` to `postgresql` and update `DATABASE_URL`
  to your Neon/Supabase connection string, then `npm run db:push`.
- **Vendor dispatching, QR codes, route planning, AI categorization, PDF reports** — data
  model is ready, UI hooks are noted in `/settings`.

## Common commands

```bash
npm run dev         # start dev server
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm run db:push     # apply schema changes
npm run db:seed     # rerun seed
npm run db:reset    # nuke + reseed
npm run db:studio   # Prisma Studio
```

## Repo layout

```
prisma/
  schema.prisma
  seed.ts
src/
  app/
    (app)/          authed app pages with sidebar
    actions/        server actions
    api/export/     CSV endpoints
    login/          public login
  components/
    charts/         Recharts wrappers
    layout/         sidebar, topbar
    ui/             buttons, cards, badges, empty states
  lib/
    auth.ts         session cookie + login
    db.ts           Prisma singleton
    dates.ts        next-service-date + range helpers
    metrics.ts      dashboard queries
    checklists.ts   per-category checklists
    types.ts        enum constants
```
