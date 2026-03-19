## Community UI plan: Members & Profile

### Current UI implementation (already in repo)

- **Members directory**: `src/app/community/(main)/members/page.tsx`
  - `GET /api/community/members` (proxy to Headless `community_members`)
  - client-side sorting/search via query params
- **Public member profile**: `src/app/community/(main)/members/[id]/page.tsx` (uses `/api/community/members/[id]`)
- **Current member profile**: `src/app/community/(main)/profile/page.tsx`
  - `GET /api/community/profile` and `GET /api/community/auth` for current member id

### Relevant Headless Member API (from swagger)

- **Member directory & profiles**
  - `GET /api/headless/v1/community_members`
  - `GET /api/headless/v1/community_members/{community_member_id}/public_profile`
  - `GET /api/headless/v1/community_member` (current member)
  - `GET /api/headless/v1/profile` (current member profile)
- **Member activity surfaces**
  - `GET /api/headless/v1/community_members/{community_member_id}/posts` (**not used in UI**)
  - `GET /api/headless/v1/community_members/{community_member_id}/comments` (**not used in UI**)
  - `GET /api/headless/v1/community_members/{community_member_id}/spaces` (**not used in UI**)
- **Onboarding / profile fields**
  - `GET /api/headless/v1/page_profile_fields` (**not used in UI**)
  - `GET /api/headless/v1/signup/profile` (**not used in UI**)
- **Account lifecycle**
  - `DELETE /api/headless/v1/community_member/deactivate` (**not used in UI**)

### Gaps (API capabilities not yet used)

- **Member activity on profiles**
  - show “Posts”, “Comments”, “Spaces” tabs on public profiles
  - show “My posts/comments/spaces” on current profile
- **Profile fields / onboarding**
  - expose profile fields and allow editing where supported
  - show a “complete your profile” flow if required fields are missing
- **Deactivate account**
  - allow current member to deactivate (with confirmation + safe UX)

### UI/UX improvements (best-practice)

- **Member profile**
  - Add tabs:
    - Overview (headline/location/tags)
    - Posts (paginated)
    - Comments (paginated)
    - Spaces (joined spaces list)
  - Add “Message” CTA when allowed (already partially present in directory cards).
- **My profile**
  - Add editing for supported fields; show validation and save states.
  - Add privacy cues: which fields are public.
- **Account controls**
  - Add “Deactivate account” option with:
    - clear explanation of consequence
    - password/email confirmation step if desired
    - post-action logout and token revocation

### Implementation approach

#### Server routes to add

- Activity tabs:
  - `GET /api/community/members/[id]/posts` → `GET /community_members/{id}/posts`
  - `GET /api/community/members/[id]/comments` → `GET /community_members/{id}/comments`
  - `GET /api/community/members/[id]/spaces` → `GET /community_members/{id}/spaces`
- Profile fields / onboarding:
  - `GET /api/community/page-profile-fields` → `GET /page_profile_fields`
  - `GET /api/community/signup/profile` → `GET /signup/profile`
- Deactivation:
  - `DELETE /api/community/account/deactivate` → `DELETE /community_member/deactivate`

#### UI work items

- Member profile page:
  - add tabs and use SWR for each surface with paging
- Profile edit:
  - add a settings/profile editor driven by `page_profile_fields` schemas
  - persist changes via whatever update endpoints exist (if not present in swagger, keep as “read-only plan”)

### Acceptance checklist

- [ ] Member profiles show activity (posts/comments/spaces) with pagination.
- [ ] Current profile supports field editing where allowed and has a “complete profile” experience.
- [ ] Deactivate account flow exists and is safe (confirmation + logout).

