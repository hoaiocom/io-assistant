# API mapping: product features ↔ Circle swagger

This document maps IO Assistant’s **user-facing components** to the **Circle API surfaces** and the canonical **Swagger YAMLs** in `references/circle/api-docs/`.

## Swagger files (canonical contracts)

- **Admin (Admin API v2)**: `references/circle/api-docs/admin-API-swagger.yaml` (paths: `/api/admin/v2/`*)
- **Headless Auth**: `references/circle/api-docs/auth-swagger.yaml` (paths: `/api/v1/headless/`*)
- **Headless Member**: `references/circle/api-docs/headless-client-swagger.yaml` (paths: `/api/headless/v1/`*)

## Auth model (how requests get authorized)

### Admin dashboard (`/dashboard`)

- **Circle surface**: Admin API v2
- **Auth**: static admin token (server-only) via `Authorization: Bearer <CIRCLE_API_TOKEN>`
- **IO Assistant auth**: password-gated admin session (`iron-session`) protecting `/api/`* admin proxy routes

### Member community (`/community`)

- **Circle surface**: Headless Auth API + Headless Member API
- **Auth**:
  - App/community token (server-only): `Authorization: Bearer <CIRCLE_HEADLESS_AUTH_TOKEN>` for **Headless Auth**
  - Per-member JWT (server-only): `Authorization: Bearer <HEADLESS_MEMBER_ACCESS_TOKEN>` for **Headless Member**
- **IO Assistant auth**: member session (`iron-session`) stores access + refresh tokens, auto-refreshes access tokens

## Admin dashboard: UI areas → Admin API v2 (swagger)

Use `admin-API-swagger.yaml` (paths under `/api/admin/v2/`).

- **Members**
  - Typical endpoint families: `community_members`, `community_members/search`, `community_member_spaces`, `community_members/{id}/access_groups`, tagging (see swagger for tags/paths)
- **Spaces**
  - Endpoint families: `spaces`, `space_groups`, space membership endpoints
- **Posts / Comments / Topics**
  - Endpoint families: `posts`, `comments`, `topics` (plus post summary, if enabled in your Circle plan)
- **Events**
  - Endpoint families: `events`, `event_attendees`
- **Moderation**
  - Endpoint families: `flagged_contents`, `advanced_search`, `community_segments`
- **Analytics**
  - Endpoint families: `gamification/leaderboard` plus derived metrics computed from members/spaces/posts
- **Automation**
  - Endpoint families: `invitation_links`, `messages` (DMs), webhooks receiver (IO Assistant endpoint), plus any scheduled workflows
- **Settings**
  - Endpoint families: `community` (get/update), `access_groups`, `profile_fields`, `forms` (+ submissions), `course_sections`, `course_lessons`, `chat_preferences`, `live/rooms`, `live/rooms/{id}/transcripts`

## Member community: UI pages → Headless APIs (swagger)

### Login & session

Use `auth-swagger.yaml` (paths under `/api/v1/headless/`):

- `POST /api/v1/headless/auth_token`: create/get per-member access+refresh tokens (by email, SSO id, or community_member_id)
- `PATCH /api/v1/headless/access_token/refresh`: refresh member access token
- `POST /api/v1/headless/access_token/revoke`: revoke access token
- `POST /api/v1/headless/refresh_token/revoke`: revoke refresh token

### Community UX (feed, spaces, content, chat, notifications, …)

Use `headless-client-swagger.yaml` (paths under `/api/headless/v1/`). Representative feature → endpoint families:

- **Home feed**: home/feed endpoints (see swagger `paths`)
- **Spaces & joining/leaving**: spaces + membership endpoints
- **Posts & comments**: `posts/`*, `posts/{post_id}/comments/*`
- **Bookmarks**: `bookmarks/`*
- **Notifications**: notification listing + mark-read endpoints
- **Chat**: `messages/`*, chat room messages/participants, unread markers, chat threads (see swagger `paths`)
- **Events**: `community_events/`* and RSVP/attendance endpoints
- **Profile & members directory**: profile endpoints + member lookup
- **Search**: `advanced_search` and/or other search endpoints present in the swagger
- **Courses**: courses/lessons/progress endpoints (where present in the swagger)

## WebSockets (future / beta)

Circle WebSockets beta notes are in `references/circle/03-websockets-beta.md`.

- **Server**: `wss://app.circle.so/cable`
- **Auth**: `Authorization: Bearer HEADLESS_MEMBER_ACCESS_TOKEN` + a whitelisted `Origin`
- **Channels** (per notes):
  - `NotificationChannel`
  - `ChatRoomChannel`
  - `Chats::RoomChannel`
  - `Chats::CommunityMemberThreadsChannel`

## Where this is implemented in the codebase

- **Admin proxy routes**: `src/app/api/`* (server-side only)
- **Member proxy routes**: `src/app/api/community/`*
- **Circle client wrappers**: `src/lib/circle/`* (Admin, Headless Auth, Headless Member)
- **Admin UI**: `src/app/dashboard/`*
- **Member UI**: `src/app/community/`*

