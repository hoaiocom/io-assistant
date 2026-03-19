# IO Assistant

Admin management platform for the **IO Scholar** community on [Circle.so](https://circle.so). Provides a power-user interface that goes beyond Circle's native dashboard with bulk operations, content moderation, analytics, automation, and full API coverage.

## Features

- **Member Management** -- Search, filter, invite, edit, deactivate, ban, and bulk-tag members. View activity scores, spaces, and access groups per member.
- **Space & Content** -- CRUD for spaces, posts, comments, topics, and events. Includes AI-powered post summaries and space group management.
- **Content Moderation** -- Flagged content queue with approve/reject/delete actions, advanced cross-content search, and audience segments.
- **Analytics** -- Community health dashboard with member stats, space distribution, content metrics, top contributors, and gamification leaderboard.
- **Automation** -- Webhook receiver for Circle events, invitation link management, direct messaging, and a JSON-based onboarding rules engine.
- **Settings** -- Manage access groups, profile fields, forms (with submissions), and course sections/lessons from a single interface.
- **Headless API Client** -- Full Auth and Member API client libraries ready for building a custom community frontend.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 19, shadcn/ui, Tailwind CSS 4, Lucide icons |
| Data fetching | SWR (client), server-side Circle API proxy routes |
| Auth | iron-session, bcryptjs |
| Circle integration | Admin API v2, Headless Auth API, Headless Member API |
| Utilities | date-fns, Zod, Recharts, Sonner toasts |

## Prerequisites

- Node.js 20+ and npm 10+
- A Circle.so community on a **Business** plan or higher (required for Admin API v2 access)
- An Admin API v2 token from your Circle dashboard (**Settings > Developers > Tokens**)

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url> io-assistant
cd io-assistant
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the values:

| Variable | Description | Required |
|----------|-------------|----------|
| `CIRCLE_API_TOKEN` | Admin API v2 token from Circle Developers page | Yes |
| `CIRCLE_COMMUNITY_HOST` | Your community hostname, e.g. `io-scholar.circle.so` | Yes |
| `SESSION_PASSWORD` | Random string, at least 32 characters (used to encrypt session cookies) | Yes |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of your admin password (see step 3) | Yes |
| `CIRCLE_HEADLESS_AUTH_TOKEN` | Headless auth token (only needed for member-facing features) | No |

### 3. Generate your admin password

```bash
npm run hash-password -- yourSecurePassword
```

Copy the output hash and set it as `ADMIN_PASSWORD_HASH` in `.env.local`.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the password you chose in step 3.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run hash-password -- <pw>` | Generate a bcrypt hash for the admin password |

## Project Structure

```
src/
├── app/
│   ├── api/                  # 45 API routes proxying Circle APIs
│   │   ├── auth/             # Login, logout, session check
│   │   ├── members/          # CRUD, search, bulk ops, tags
│   │   ├── spaces/           # CRUD, member management
│   │   ├── posts/            # CRUD, AI summaries
│   │   ├── comments/         # List, create, delete
│   │   ├── topics/           # CRUD
│   │   ├── events/           # CRUD, attendees
│   │   ├── moderation/       # Flagged content, search, segments
│   │   ├── analytics/        # Stats, leaderboard, top contributors
│   │   ├── access-groups/    # CRUD, member assignment
│   │   ├── invitations/      # Create, list, revoke links
│   │   ├── forms/            # CRUD, submissions
│   │   ├── profile-fields/   # CRUD
│   │   ├── courses/          # Sections and lessons
│   │   ├── messages/         # Send DMs
│   │   ├── community/        # Community info
│   │   └── webhooks/circle/  # Incoming Circle webhook events
│   ├── dashboard/            # 9 admin pages
│   │   ├── page.tsx          # Overview with stats cards
│   │   ├── members/          # Member table with bulk actions
│   │   ├── spaces/           # Space grid with type filters
│   │   ├── posts/            # Post table with search & filters
│   │   ├── events/           # Event cards with attendee mgmt
│   │   ├── moderation/       # Flagged queue, search, segments
│   │   ├── analytics/        # Charts and leaderboard
│   │   ├── automation/       # Invitations, webhooks, messaging
│   │   └── settings/         # Access groups, forms, courses, etc.
│   ├── login/                # Admin login page
│   └── layout.tsx            # Root layout with Toaster
├── components/
│   ├── layout/               # Sidebar, Topbar, DashboardShell
│   └── ui/                   # 18 shadcn/ui primitives
├── data/
│   └── rules.json            # Onboarding automation rules
└── lib/
    ├── auth.ts               # iron-session helpers
    ├── utils.ts              # Tailwind cn() merge utility
    └── circle/               # Circle API client layer
        ├── client.ts          # Admin API v2 HTTP client (rate limit, retry, pagination)
        ├── types.ts           # TypeScript types for all Circle entities
        ├── community.ts       # GET/PUT /community
        ├── members.ts         # Members, tags, tagged members
        ├── spaces.ts          # Spaces, groups, space members
        ├── posts.ts           # Posts, comments, topics
        ├── events.ts          # Events, attendees
        ├── moderation.ts      # Flagged content, search, segments
        ├── analytics.ts       # Stats, leaderboard, contributors
        ├── admin-extras.ts    # Access groups, forms, courses, etc.
        ├── headless-auth.ts   # Headless Auth API (token CRUD)
        └── headless-member.ts # Headless Member API (full coverage)
```

## Architecture

All Circle API calls are made server-side through Next.js API routes. Tokens are never exposed to the browser.

```
Browser (Admin)
  │  SWR data fetching
  ▼
Next.js API Routes (/api/*)
  │  iron-session auth guard
  ▼
Circle API Client Layer (src/lib/circle/)
  │  Rate limiting (1800 req/5min buffer)
  │  Automatic retry with backoff on 429
  │  Generic pagination helper
  ▼
Circle.so Platform APIs
  ├── Admin API v2
  ├── Headless Auth API
  ├── Headless Member API
  └── WebSocket (future)
```

## Circle API Rate Limits

The built-in client respects Circle's rate limits:

- **2,000 requests per 5 minutes per IP** (client uses a 1,800 buffer)
- Automatic exponential backoff on `429 Too Many Requests`
- Monthly quotas depend on your Circle plan (Business: 5K, Enterprise: 30K, Plus Platform: 250K)

## Webhook Setup

To receive real-time events from Circle (new members, posts, etc.), configure a webhook in your Circle dashboard pointing to:

```
https://your-domain.com/api/webhooks/circle
```

The endpoint accepts POST requests and logs incoming events. Extend the handler in `src/app/api/webhooks/circle/route.ts` to trigger automation rules.

## Roadmap

See [references/ROADMAP.md](references/ROADMAP.md) for the full implementation roadmap and detailed phase breakdown.

## License

Private -- internal tooling for IO Scholar community management.
