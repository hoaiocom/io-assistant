# IO Assistant

Admin management platform and member community portal for the **IO Scholar** community on [Circle.so](https://circle.so). Includes a power-user admin dashboard with bulk operations, content moderation, analytics, and automation -- plus a complete member-facing community UI built on Circle's Headless API.

## Features

### Admin Dashboard (`/dashboard`)

- **Member Management** -- Search, filter, invite, edit, deactivate, ban, and bulk-tag members. View activity scores, spaces, and access groups per member.
- **Space & Content** -- CRUD for spaces, posts, comments, topics, and events. Includes AI-powered post summaries and space group management.
- **Content Moderation** -- Flagged content queue with approve/reject/delete actions, advanced cross-content search, and audience segments.
- **Analytics** -- Community health dashboard with member stats, space distribution, content metrics, top contributors, and gamification leaderboard.
- **Automation** -- Webhook receiver for Circle events, invitation link management, direct messaging, and a JSON-based onboarding rules engine.
- **Settings** -- Manage access groups, profile fields, forms (with submissions), and course sections/lessons from a single interface.

### Member Community (`/community`)

- **Home Feed** -- Personalized post feed from joined spaces with like, comment, and bookmark actions.
- **Spaces** -- Browse all community spaces grouped by category, view posts within each space, create new posts.
- **Post Detail** -- Full post view with rich content, comments thread, like/bookmark.
- **Events** -- Upcoming and past events with RSVP support.
- **Members** -- Search-based member directory with public profiles, gamification stats, and messaging.
- **Notifications** -- Real-time notification feed with unread indicators and mark-all-read.
- **Chat** -- Direct message conversations with real-time message polling.
- **Courses** -- Course catalog with enrollment status.
- **Leaderboard** -- Gamification rankings.
- **Search** -- Global search across posts, comments, and members.
- **Bookmarks** -- Saved posts for later.

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
| `CIRCLE_HEADLESS_AUTH_TOKEN` | Headless Auth token (required for member community UI) | For `/community` |

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

### 5. (Optional) Enable the member community UI

The member-facing community interface at `/community` requires a **Headless Auth** token from Circle.

1. Go to your Circle dashboard: **Settings > Developers > Tokens**
2. Create a new token with type **Headless Auth**
3. Set `CIRCLE_HEADLESS_AUTH_TOKEN` in `.env.local` to this token value

Once configured, community members can sign in at [http://localhost:3000/community/login](http://localhost:3000/community/login) using their Circle member email. The Headless Auth API generates a JWT access token for each member, which is stored server-side in an encrypted session cookie -- no Circle tokens are ever exposed to the browser.

## Key references (read these first when developing)

- **References index (source of truth)**: `references/INDEX.md`
- **API mapping (features ↔ swagger)**: `references/API-MAPPING.md`
- **Roadmap / plan**: `references/ROADMAP.md`
- **Circle swagger contracts**:
  - Admin: `references/circle/api-docs/admin-API-swagger.yaml` (`/api/admin/v2/*`)
  - Headless Auth: `references/circle/api-docs/auth-swagger.yaml` (`/api/v1/headless/*`)
  - Headless Member: `references/circle/api-docs/headless-client-swagger.yaml` (`/api/headless/v1/*`)

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
│   ├── api/                  # ~63 API routes
│   │   ├── auth/             # Admin login, logout, session check
│   │   ├── community/        # Member API proxy routes (18 routes)
│   │   │   ├── auth/         #   Member login/logout/session
│   │   │   ├── feed/         #   Home feed
│   │   │   ├── spaces/       #   Spaces, posts, join/leave
│   │   │   ├── posts/        #   Comments, likes
│   │   │   ├── notifications/#   List, mark read
│   │   │   ├── bookmarks/    #   CRUD
│   │   │   ├── chat/         #   Rooms, messages
│   │   │   ├── events/       #   RSVP, attendees
│   │   │   ├── search/       #   Global search
│   │   │   ├── profile/      #   Current member profile
│   │   │   ├── members/      #   Public profiles
│   │   │   └── courses/      #   Course sections
│   │   ├── members/          # Admin: CRUD, search, bulk ops, tags
│   │   ├── spaces/           # Admin: CRUD, member management
│   │   ├── posts/            # Admin: CRUD, AI summaries
│   │   ├── comments/         # Admin: list, create, delete
│   │   ├── topics/           # Admin: CRUD
│   │   ├── events/           # Admin: CRUD, attendees
│   │   ├── moderation/       # Admin: flagged content, search, segments
│   │   ├── analytics/        # Admin: stats, leaderboard
│   │   ├── access-groups/    # Admin: CRUD, member assignment
│   │   ├── invitations/      # Admin: create, list, revoke links
│   │   ├── forms/            # Admin: CRUD, submissions
│   │   ├── profile-fields/   # Admin: CRUD
│   │   ├── courses/          # Admin: sections and lessons
│   │   ├── messages/         # Admin: send DMs
│   │   └── webhooks/circle/  # Incoming Circle webhook events
│   ├── community/            # 14 member-facing pages
│   │   ├── login/            # Member email login
│   │   ├── page.tsx          # Home feed
│   │   ├── spaces/[id]/      # Space detail + post list
│   │   ├── spaces/[id]/posts/[postId]/ # Post detail + comments
│   │   ├── events/           # Events with RSVP
│   │   ├── members/          # Member search directory
│   │   ├── members/[id]/     # Public member profile
│   │   ├── notifications/    # Notification feed
│   │   ├── chat/             # Chat room list
│   │   ├── chat/[uuid]/      # Chat conversation
│   │   ├── courses/          # Course catalog
│   │   ├── leaderboard/      # Gamification rankings
│   │   ├── search/           # Global search
│   │   ├── bookmarks/        # Saved posts
│   │   └── profile/          # My profile
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
│   ├── community/            # Member UI components
│   │   ├── CommunityShell.tsx  # Layout shell (header + sidebar + content)
│   │   ├── CommunityHeader.tsx # Top nav, search, notifications, profile
│   │   ├── CommunitySidebar.tsx# Space navigation grouped by category
│   │   └── PostCard.tsx        # Reusable post card with actions
│   ├── layout/               # Admin layout: Sidebar, Topbar, DashboardShell
│   └── ui/                   # 18 shadcn/ui primitives
├── data/
│   └── rules.json            # Onboarding automation rules
└── lib/
    ├── auth.ts               # Admin iron-session helpers
    ├── member-auth.ts        # Member session (headless JWT, auto-refresh)
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

All Circle API calls are made server-side through Next.js API routes. Tokens are never exposed to the browser. The admin dashboard and member community use separate authentication sessions.

```
Browser (Admin)                        Browser (Member)
  │  SWR data fetching                   │  SWR data fetching
  ▼                                      ▼
/api/* routes                          /api/community/* routes
  │  iron-session (admin)                │  iron-session (member JWT)
  │  password-based auth                 │  email-based headless auth
  ▼                                      │  auto token refresh
Circle Admin API v2 client               ▼
  │  Rate limiting, retry              Headless Member API client
  │  In-memory cache                     │  Per-member JWT tokens
  ▼                                      ▼
Circle.so Platform APIs
  ├── Admin API v2         (admin dashboard)
  ├── Headless Auth API    (member login/token management)
  ├── Headless Member API  (member community features)
  └── WebSocket            (future)
```

### Member authentication flow

1. Member visits `/community/login` and enters their Circle member email
2. Server calls Circle Headless Auth API to generate a JWT access token + refresh token
3. Tokens are stored in an encrypted `iron-session` cookie (`io-community-member-session`)
4. On each API request, middleware checks the access token expiry and auto-refreshes via the Headless Auth API if needed
5. On logout, the access token is revoked server-side

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

## Member Community Pages

| Route | Description |
|-------|-------------|
| `/community/login` | Member sign-in with Circle email |
| `/community` | Home feed -- posts from joined spaces |
| `/community/spaces/[id]` | Space detail -- post list, sorting, new post |
| `/community/spaces/[id]/posts/[postId]` | Post detail -- comments, like, bookmark |
| `/community/events` | Upcoming and past events with RSVP |
| `/community/members` | Member search directory |
| `/community/members/[id]` | Public profile with stats and gamification |
| `/community/notifications` | Notification feed with read/unread state |
| `/community/chat` | Chat room list with unread counts |
| `/community/chat/[uuid]` | Real-time chat conversation |
| `/community/courses` | Course catalog |
| `/community/leaderboard` | Gamification leaderboard |
| `/community/search` | Global search |
| `/community/bookmarks` | Saved posts |
| `/community/profile` | Current member's profile |

## Roadmap

See [references/ROADMAP.md](references/ROADMAP.md) for the full implementation roadmap and detailed phase breakdown.

## License

Private -- internal tooling for IO Scholar community management.
