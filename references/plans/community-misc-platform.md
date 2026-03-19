## Community UI plan: Misc platform features (headless)

### Purpose

This plan collects Headless Member API capabilities that don’t map cleanly to a single UI page today but are present in `headless-client-swagger.yaml` and are currently unused.

### Relevant Headless Member API (from swagger)

- **Community links**
  - `GET /api/headless/v1/community_links` (**not used in UI**)
- **Invitation join**
  - `POST /api/headless/v1/invitation_links/{token}/join` (**not used in UI**)
- **Cookies**
  - `POST /api/headless/v1/cookies` (**not used in UI**)
- **Flagged content**
  - `GET /api/headless/v1/flagged_contents` (**not used in UI**)
- **Signup/profile**
  - `GET /api/headless/v1/signup/profile` (**covered in members/profile plan**)

### Gaps (API capabilities not yet used)

- **Community links**
  - expose a “Links” page (resources, quick links) in header or sidebar
- **Invite join**
  - support joining the community (or a space) via invitation token deep links
- **Cookies**
  - if required by Circle for certain flows, call cookie endpoint server-side as part of auth/session bootstrap
- **Flagged content (member-facing)**
  - potentially add “Report” flows and/or a lightweight “my reports” area if Circle supports it headlessly

### UI/UX improvements (best-practice)

- **Community links**
  - Add `/community/links` page
  - Render link groups with icons, descriptions, and external link safety (open in new tab)
- **Invitation token entry**
  - Add route `/community/invite/[token]`:
    - auto-attempt join on load (if logged in)
    - if not logged in, redirect to login then continue
    - show friendly error states for invalid/expired tokens
- **Reporting**
  - If swagger supports reporting actions via posts/comments payload policies, add “Report” action and a confirmation modal.

### Implementation approach

#### Server routes to add

- `GET /api/community/links` → `GET /community_links`
- `POST /api/community/invitations/[token]/join` → `POST /invitation_links/{token}/join`
- `POST /api/community/cookies` → `POST /cookies` (only if needed; document why when implementing)
- `GET /api/community/flagged-contents` → `GET /flagged_contents` (if you want a moderation surface for members/mods)

### Acceptance checklist

- [ ] Community links page exists and matches `community_links` output.
- [ ] Invitation token join flow works (logged in + not logged in).
- [ ] Any cookie bootstrap needs are documented and implemented safely.
- [ ] Flagged content/reporting is either implemented or explicitly deferred with rationale.

