# IO Assistant -- Roadmap & Implementation Plan

## Context

IO Assistant is an admin management tool for the **IO Scholar** community on Circle.so. It leverages the Circle Admin API v2, Headless Member API, and Auth API to provide a power-user interface that goes beyond Circle's native dashboard -- enabling bulk operations, automation, advanced analytics, and eventually a fully custom community frontend.

**Tech stack:** Next.js 15 (App Router), React 19, shadcn/ui, Tailwind CSS 4, SWR, Recharts, iron-session, Zod

## Canonical references (source of truth)

- `references/INDEX.md` (what to read / where to look)
- `references/API-MAPPING.md` (features ↔ swagger)
- Swagger contracts:
  - Admin: `references/circle/api-docs/admin-API-swagger.yaml` (paths `/api/admin/v2/*`)
  - Headless Auth: `references/circle/api-docs/auth-swagger.yaml` (paths `/api/v1/headless/*`)
  - Headless Member: `references/circle/api-docs/headless-client-swagger.yaml` (paths `/api/headless/v1/*`)

---

## Project Structure

```
io-assistant/
├── references/              # Circle API docs & this roadmap
├── scripts/                 # Utility scripts (hash-password)
├── src/
│   ├── app/
│   │   ├── api/             # 44 API routes proxying Circle APIs
│   │   │   ├── auth/        # Admin login/logout/session
│   │   │   ├── members/     # Members CRUD, search, bulk, tags
│   │   │   ├── spaces/      # Spaces CRUD, members
│   │   │   ├── posts/       # Posts CRUD, AI summary
│   │   │   ├── comments/    # Comments CRUD
│   │   │   ├── topics/      # Topics CRUD
│   │   │   ├── events/      # Events CRUD, attendees
│   │   │   ├── moderation/  # Flagged content, search, segments
│   │   │   ├── analytics/   # Stats, leaderboard, top contributors
│   │   │   ├── access-groups/  # Access groups CRUD
│   │   │   ├── invitations/ # Invitation links
│   │   │   ├── forms/       # Forms CRUD, submissions
│   │   │   ├── profile-fields/ # Profile fields CRUD
│   │   │   ├── courses/     # Course sections & lessons
│   │   │   ├── messages/    # Send DMs
│   │   │   ├── community/   # Community info
│   │   │   └── webhooks/    # Circle webhook receiver
│   │   ├── dashboard/       # 9 dashboard pages
│   │   │   ├── page.tsx     # Overview with stats
│   │   │   ├── members/     # Member management
│   │   │   ├── spaces/      # Space management
│   │   │   ├── posts/       # Post management
│   │   │   ├── events/      # Event management
│   │   │   ├── moderation/  # Content moderation
│   │   │   ├── analytics/   # Analytics dashboard
│   │   │   ├── automation/  # Invitations, webhooks, messages
│   │   │   └── settings/    # Community, access groups, forms, etc.
│   │   ├── login/           # Admin login page
│   │   └── layout.tsx       # Root layout
│   ├── components/
│   │   ├── layout/          # Sidebar, Topbar, DashboardShell
│   │   └── ui/              # 18 shadcn/ui components
│   ├── data/
│   │   └── rules.json       # Onboarding automation rules
│   └── lib/
│       ├── auth.ts          # iron-session auth
│       ├── utils.ts         # cn() utility
│       └── circle/          # Circle API client layer
│           ├── client.ts    # Admin API v2 HTTP client
│           ├── types.ts     # TypeScript types for all Circle entities
│           ├── community.ts # Community endpoints
│           ├── members.ts   # Member management endpoints
│           ├── spaces.ts    # Space management endpoints
│           ├── posts.ts     # Post & comment & topic endpoints
│           ├── events.ts    # Event management endpoints
│           ├── moderation.ts  # Flagged content & segments
│           ├── analytics.ts   # Analytics & leaderboard
│           ├── admin-extras.ts # Access groups, forms, courses, etc.
│           ├── headless-auth.ts # Headless Auth API client
│           └── headless-member.ts # Headless Member API client
└── .env.local.example       # Environment variable template
```

---

## Phase 1: Foundation & Authentication [COMPLETED]

**What was built:**
- Next.js 15 project with App Router, Tailwind CSS 4, shadcn/ui
- Circle Admin API v2 client (`src/lib/circle/client.ts`) with rate limiting, retry, pagination
- iron-session based admin authentication
- Dashboard shell with responsive sidebar navigation
- 18 shadcn/ui components

**Circle API endpoints integrated:** `GET /community`

---

## Phase 2: Member Management [COMPLETED]

**What was built:**
- Members list page with paginated table, search, status filtering
- Member CRUD: invite, view, edit, deactivate, ban, permanently delete
- Bulk operations: tag, add to space, add to access group
- Member tags management

**Circle API endpoints integrated:**
- `community_members` (list, get, create, update, delete, ban, search)
- `member_tags` (CRUD)
- `tagged_members` (list, add, remove)
- `community_member_spaces`, `community_members/{id}/access_groups`

---

## Phase 3: Space & Content Management [COMPLETED]

**What was built:**
- Spaces management with grid view, type filtering, CRUD
- Space groups management
- Space member management (add/remove)
- Posts management with filters, search, CRUD, AI summaries
- Comments management
- Topics management
- Events management with attendees

**Circle API endpoints integrated:**
- `spaces` (CRUD), `space_groups` (CRUD), `space_members`, `space_group_members`
- `posts` (CRUD), `posts/{id}/summary`
- `comments` (list, create, delete)
- `topics` (CRUD)
- `events` (CRUD), `event_attendees`

---

## Phase 4: Content Moderation [COMPLETED]

**What was built:**
- Flagged content queue with status filters and actions
- Advanced search across all content types
- Community segments management with duplicate

**Circle API endpoints integrated:**
- `flagged_contents` (list, create)
- `advanced_search`
- `community_segments` (CRUD, duplicate)

---

## Phase 5: Analytics & Insights [COMPLETED]

**What was built:**
- Community overview dashboard with stats cards
- Member analytics (active/inactive breakdown, top contributors)
- Space analytics (type distribution, post counts)
- Content analytics (published/draft)
- Gamification leaderboard

**Circle API endpoints integrated:**
- `community` (info)
- `gamification/leaderboard`
- Derived stats from members, spaces, posts endpoints

---

## Phase 6: Automation & Workflows [COMPLETED]

**What was built:**
- Circle webhook receiver endpoint
- Invitation link management (create, list, revoke)
- Direct messaging interface
- Onboarding rules engine (JSON-based, `src/data/rules.json`)

**Circle API endpoints integrated:**
- `invitation_links` (list, create, revoke)
- `messages` (create)
- Webhook receiver at `/api/webhooks/circle`

---

## Phase 7: Headless Community UI [COMPLETED]

**What was built:**
- Headless Auth API client (token create, refresh, revoke)
- Headless Member API client with full endpoint coverage:
  - Home feed, spaces, posts, comments
  - Bookmarks, notifications, profile
  - Chat rooms, messages, reactions
  - Events, courses, search
  - Likes, lesson progress

**Circle API endpoints integrated:**
- Auth: `auth_token`, `access_token/refresh`, `access_token/revoke`, `refresh_token/revoke`
- Member: `home`, `spaces`, `posts`, `comments`, `bookmarks`, `notifications`, `profile`, `messages`, `reactions`, `events`, `courses`, `search`, `user_likes`

---

## Phase 8: Advanced Features [COMPLETED]

**What was built:**
- Settings page with tabs for:
  - Community info
  - Access groups management (CRUD, archive)
  - Profile fields management (CRUD, archive)
  - Forms management (CRUD, duplicate, submissions)
  - Course sections & lessons management
- Chat preferences management
- Live rooms & transcripts API integration

**Circle API endpoints integrated:**
- `access_groups` (CRUD, members)
- `profile_fields` (CRUD, archive/unarchive)
- `forms` (CRUD, duplicate, submissions)
- `course_sections`, `course_lessons` (CRUD)
- `chat_preferences`
- `live/rooms`, `live/rooms/{id}/transcripts`

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Admin)                        │
│  Login ──► Dashboard (Members, Spaces, Posts, ...)       │
│            Uses SWR for data fetching                    │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────────┐
│              Next.js API Routes (44 routes)               │
│  /api/auth, /api/members, /api/spaces, /api/posts, ...   │
│  iron-session auth guard on all routes                    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│           Circle API Client Layer (src/lib/circle/)       │
│  Admin API v2 Client    │ Headless Auth │ Member API      │
│  Rate limiting, retry   │ Token mgmt   │ Full coverage   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│                  Circle.so Platform APIs                   │
│  Admin API v2  │  Auth API  │  Member API  │  WebSocket   │
└─────────────────────────────────────────────────────────┘
```

---

## Getting Started

1. Clone the repository
2. Copy `.env.local.example` to `.env.local` and fill in your Circle API tokens
3. Generate admin password hash: `npm run hash-password yourpassword`
4. Set `ADMIN_PASSWORD_HASH` in `.env.local`
5. Install dependencies: `npm install`
6. Start dev server: `npm run dev`
7. Navigate to `http://localhost:3000/login`

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CIRCLE_API_TOKEN` | Admin API v2 token from Circle Developers | Yes |
| `CIRCLE_COMMUNITY_HOST` | Community hostname (e.g. `io-scholar.circle.so`) | Yes |
| `SESSION_PASSWORD` | 32+ char secret for iron-session cookies | Yes |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password | Yes |
| `CIRCLE_HEADLESS_AUTH_TOKEN` | Headless auth token (for member-facing features) | No |

---

## Next enhancements (API-aligned backlog)

These are the next best improvements, scoped explicitly to the supported Circle APIs and the docs in `references/`.

### Headless real-time (WebSockets beta)

- **Goal**: replace polling for chat + notifications with real-time updates where possible.
- **Reference**: `references/circle/03-websockets-beta.md`
- **APIs**:
  - WebSocket server: `wss://app.circle.so/cable`
  - Auth: per-member Headless access token
  - Channels: `NotificationChannel`, `ChatRoomChannel`, `Chats::RoomChannel`, `Chats::CommunityMemberThreadsChannel`

### Security & admin operability

- **Multi-admin support (RBAC)**: define roles/permissions and guard dashboard routes + API routes accordingly.
- **Audit logging**: record admin actions (who did what, when, and on which entity); show an audit viewer in the dashboard.
- **Secret management**: ensure tokens are never logged; add safe logging patterns for webhook payloads and API errors.

### Automation maturity

- **Scheduled tasks**: cron-like runner for onboarding rules, digests, cleanup jobs (keep all Circle calls server-side).
- **Webhook processing**: persist incoming events, add idempotency, implement retries and dead-letter queue behavior.

### Analytics & data export

- **More analytics**: deepen health metrics and cohort views derived from Admin API v2 endpoints.
- **Export/import**: CSV export for members/spaces/posts; optional import workflows (where supported).

### Headless UX completeness

- **Edge-case handling**: token expiry and refresh hardening; improve error states and empty states.
- **Parity gaps**: systematically compare `/community` features to `headless-client-swagger.yaml` and add missing endpoints/pages.

