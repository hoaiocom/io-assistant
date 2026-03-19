# References index (source of truth)

This folder is the canonical place to understand **what IO Assistant is**, **which Circle APIs it relies on**, and **where to find the OpenAPI/Swagger contracts**.

## What this project is

- **Admin dashboard**: internal power-user tooling for community admins and moderators (bulk operations, moderation, analytics, automation).
- **Member community (headless)**: a member-facing UI built on Circle’s Headless APIs (feed, spaces, posts, chat, notifications, events, courses, etc.).

## Canonical API contracts (Swagger / OpenAPI)

These YAMLs are the authoritative API contracts we build against:

- **Admin API (Circle Admin API v2)**: `references/circle/api-docs/admin-API-swagger.yaml`
  - **Base URL**: `https://app.circle.so`
  - **Paths**: `/api/admin/v2/*`
  - **Auth**: `Authorization: Bearer <CIRCLE_API_TOKEN>`
- **Headless Auth API**: `references/circle/api-docs/auth-swagger.yaml`
  - **Base URL**: `https://app.circle.so`
  - **Paths**: `/api/v1/headless/*`
  - **Auth**: `Authorization: Bearer <CIRCLE_HEADLESS_AUTH_TOKEN>` (app/community token)
- **Headless Member API**: `references/circle/api-docs/headless-client-swagger.yaml`
  - **Base URL**: `https://app.circle.so`
  - **Paths**: `/api/headless/v1/*`
  - **Auth**: `Authorization: Bearer <HEADLESS_MEMBER_ACCESS_TOKEN>` (per-member JWT from the Auth API)

## Key “how it works” docs in this repo

- **Roadmap / implementation plan**: `references/ROADMAP.md`
- **Headless UI coverage plans (component checklists)**: `references/plans/HEADLESS-UI-COVERAGE-PLANS.md`
- **Project overview (Circle docs excerpt)**: `references/circle/01-overview.md`
- **Admin API notes (Circle docs excerpt)**: `references/circle/04-admin-api.md`
- **Headless overview & security (Circle docs excerpt)**: `references/circle/05-headless.md`
- **WebSockets beta notes (Circle docs excerpt)**: `references/circle/03-websockets-beta.md`

## Working agreements (for developers)

- **Never expose Circle tokens to the browser**. All Circle calls go through server routes.
- **Admin vs Member auth are separate sessions**:
  - Admin: password → server session (`iron-session`)
  - Member: email → Headless Auth API → per-member JWT stored server-side (`iron-session`)
- **When adding a feature**: first identify the Circle endpoint(s) in the swagger YAMLs above, then add/extend:
  1. the server route under `src/app/api/*`
  2. the Circle client wrapper under `src/lib/circle/*` (if needed)
  3. the UI page/component under `src/app/dashboard/*` or `src/app/community/*`

