---
name: circle-plan-implement
description: Implements a Circle headless UI plan from references/plans/* in this Next.js repo by adding proxy API routes under src/app/api/community/*, updating headless-member client wrappers, and wiring UI pages/components with SWR. Use when the user provides a plan path and asks to implement it.
---

# Circle plan implementer (Headless Member UI)

## Inputs (user-provided)

- **Plan path**: a markdown file under `references/plans/` (example: `references/plans/spaces/basic.md`)
- **References folder**: `references/` (for swagger + repo docs)

If the user paste plan text instead of a path, treat it as the plan.

## Repo constraints (must follow)

- Never expose Circle tokens to the browser.
- All Circle calls must be server-side in `src/app/api/community/*`.
- Member auth must use `requireMemberAuth()` / session utilities from `src/lib/member-auth.ts`.
- Prefer response normalization in proxy routes (keep UI simple).
- After substantive edits, run lints on edited files.

## Definition of done (must satisfy before stopping)

- The chosen slice works end-to-end (proxy route → UI) with good UX states.
- Lints pass for the edited files.
- The input plan is updated to reflect reality:
  - implemented items are checked off
  - each completed item has an inline note pointing to file paths
  - anything not completed is explicitly marked as pending with a short reason/blocker
  - if the user asked to “make the plan complete”, keep implementing slices until all items are checked or explicitly blocked

## Implementation workflow

### 0) Establish scope and slice

Read the plan and choose a **smallest shippable slice** that:
- adds one new capability end-to-end (proxy route → UI)
- is verifiable in isolation
- doesn’t require large refactors first

If the plan is broad, implement slice-by-slice and keep the rest as pending.

### 1) Validate endpoints in swagger

Use `references/circle/api-docs/headless-client-swagger.yaml` to confirm:
- endpoint exists + method
- required params
- request body schema
- pagination style and key fields the UI needs

### 2) Add/extend client wrapper (`src/lib/circle/headless-member.ts`)

Add a function per endpoint (unless it already exists). Follow existing patterns:
- `memberRequest<T>(path, token, options)`
- typed params object → `URLSearchParams`

### 3) Create proxy routes under `src/app/api/community/*`

For each new proxy route:
- call `requireMemberAuth()`
- call the wrapper function with `session.accessToken`
- pass query params/body through safely
- return `NextResponse.json(data)`
- normalize shape if Circle responses vary (chat already does this)
- return 401 on `Unauthorized` / `Session expired` messages

### 4) Wire UI with SWR + good UX

In `src/app/community/**` or `src/components/community/**`:
- use `useSWR` keys that include query params
- add `dedupingInterval` for nav-level data
- implement optimistic updates for toggles (join/leave, mark-read, follow)
- add loading skeletons, empty states, and error states
- keep components typed and small; share primitives where possible

### 5) Close the plan loop (required)

Update the input plan itself (the `references/plans/...` file path, or the pasted plan text if no path was provided) so it stays the source of truth:
- check off completed items
- add short “Implemented in:” notes with file paths for each completed item
- add “Pending:” notes for anything not done yet, including why (missing endpoint, needs product decision, depends on another slice, etc.)

### 6) Verify

- run lints for edited files only
- if a dev server is running, spot-check the page(s) affected

## Output requirements (what to tell the user)

- Which slice you implemented
- Which files changed (proxy routes + wrappers + UI)
- What remains pending from the plan

## Examples (how the user should call this)

**Example prompt**

“Use `circle-plan-implement` on `references/plans/spaces/basic.md`. Implement topic navigation (proxy route + UI chips) and topic-filtering posts in the basic space page.”

