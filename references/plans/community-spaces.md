## Community UI plan: Spaces

### Scope

Member-facing “Spaces” experiences in `/community`, including:
- Space directory + grouping
- Space detail (basic / chat / course / event space routing)
- Join/leave membership
- Space-level reading state & preferences
- Space-type-specific UX (basic vs chat vs course vs event vs image vs members)

### Current UI implementation (already in repo)

- **Space directory/navigation**: `src/components/community/CommunitySidebar.tsx` renders spaces grouped by `space_group_name` from `GET /api/community/spaces`.
- **Space detail page**: `src/app/community/(main)/spaces/[id]/page.tsx`
  - Loads space details from `GET /api/community/spaces/[id]`
  - Join space via `POST /api/community/spaces/[id]` (Headless join)
  - Routes by `space.space_type` to:
    - chat: `ChatSpaceView`
    - course: `CourseSpaceView` / `CourseLockedView`
    - event: `EventSpaceView`
    - basic/image/etc: shows post list

### Relevant Headless Member API (from swagger)

- **Spaces**
  - `GET /api/headless/v1/spaces`
  - `GET /api/headless/v1/spaces/{id}`
  - `POST /api/headless/v1/spaces/{id}/join`
  - `DELETE /api/headless/v1/spaces/{id}/leave`
  - `GET /api/headless/v1/spaces/home` (**not used in UI**)
- **Space display/layout metadata**
  - Space payload includes fields such as `display_view`, `default_tab`, `visible_tabs`, `default_sort`, `hide_sorting`, `post_type`, `space_member_id` (used for “layout”/tabs UX even when the API doesn’t have a dedicated “layout” endpoint).
- **Space topics**
  - `GET /api/headless/v1/spaces/{space_id}/topics` (**not used in UI**)
- **Space bookmarks**
  - `GET /api/headless/v1/spaces/{space_id}/bookmarks` (**not used in UI**)
- **Space-level notification details / read state**
  - `GET /api/headless/v1/space_notification_details` (**not used in UI**)
  - `POST /api/headless/v1/space_members/{id}/mark_as_read` (**not used in UI**)

### Gaps (API capabilities not yet used)

- **Spaces home**: add a “Spaces overview” page using `spaces/home` (typically returns personalized/grouped sets such as joined spaces, suggested, recent).
- **Space topics**: allow browsing topics within a space; support topic-based filtering for posts lists.
- **Space bookmarks**: show “Saved in this space” and/or “Bookmarks by space” views.
- **Read/unread mechanics**:
  - mark a space membership as read when a member visits a space
  - show “unread” indicators per space (requires tracking `space_member` IDs from space detail/home payloads)
- **Space notification details**: expose per-space notification settings summary and deep links to preferences.
- **Space types & layouts parity**:
  - “Basic” spaces can present different member-visible layouts (Feed/List/Card) that should be represented in your UI using a shared rendering system driven by the space payload (`display_view`, sorting, topics, pinned, etc.) and (where needed) additional endpoints (topics, images posts).

### UI/UX improvements (best-practice)

- **Space directory**
  - Add a dedicated `/community/spaces` page (separate from sidebar navigation) to browse all spaces with:
    - filters (type, joined vs not, public vs private, group)
    - search
    - recommended spaces (from `spaces/home` if appropriate)
  - Add “Join” CTA for non-member public spaces directly from directory.
- **Space detail**
  - Add a right rail panel (desktop) for:
    - space description + policies
    - members preview (if present in payload)
    - topics list (if enabled)
    - “saved posts” entry point (space bookmarks)
  - Add consistent empty states for:
    - private, not-a-member
    - posts disabled / cannot create post
    - no posts / no topics
- **Unread**
  - Show unread badge/dot in sidebar per space (if API supports it in `spaces/home` or via `space_notification_details`).
  - Mark as read on space view (throttle + optimistic UI).

### Implementation approach

#### Server routes to add (proxy only; keep tokens server-side)

- `GET /api/community/spaces/home` → `GET /spaces/home`
- `GET /api/community/spaces/[id]/topics` → `GET /spaces/{space_id}/topics`
- `GET /api/community/spaces/[id]/bookmarks` → `GET /spaces/{space_id}/bookmarks`
- `GET /api/community/spaces/notification-details` → `GET /space_notification_details`
- `POST /api/community/space-members/[spaceMemberId]/read` → `POST /space_members/{id}/mark_as_read`

#### Sub-plans (by space type)

For detailed UX + API coverage per type, see:
- `references/plans/spaces/basic.md`
- `references/plans/spaces/chat.md`
- `references/plans/spaces/event.md`
- `references/plans/spaces/course.md`
- `references/plans/spaces/image.md`
- `references/plans/spaces/members.md`

#### Client hooks & state

- Prefer `useSWR` with:
  - stable keys that include query params
  - `dedupingInterval` for navigation-level data (spaces list/home)
  - optimistic updates for join/leave + mark-as-read
- Normalize data shapes in API routes (like `src/app/api/community/chat/route.ts` does) so UI components have consistent fields.

#### Data model upgrades (types)

- Add typed shapes for:
  - `SpaceHomeResponse`, `SpaceTopic`, `SpaceBookmark`, `SpaceNotificationDetails`, `SpaceMember`
in `src/lib/circle/types.ts` (or a focused community types module), then refactor community UI to use them.

### Acceptance checklist

- [ ] A `/community/spaces` directory exists and is fast (cached) and filterable.
- [ ] Space topics are visible and usable for post filtering.
- [ ] Space bookmarks are accessible (list + deep-link to post).
- [ ] Visiting a space marks it read (where supported), and sidebar unread state updates.
- [ ] All new features are backed by server routes under `src/app/api/community/*` and match swagger endpoints.

### Implementation status (latest slice)

- [x] Enhance basic space **List** view to follow Circle-like post-row layout (round avatar, author + posted time line, love and comment counters on the right).  
  Implemented in: `src/app/community/(main)/spaces/[id]/page.tsx` (`SpacePostsListRows` used for both regular and course discussion list rendering).
- [x] Add Circle-like post settings menu in List view, filtered by headless post policies so members only see actions they can perform.  
  Implemented in: `src/app/community/(main)/spaces/[id]/page.tsx` (uses `post.policies.can_destroy_post`, `can_manage_post`, `can_update_post`, plus `bookmark_id` and `post_follower_id` from `GET /spaces/{space_id}/posts`).
- [x] Add member proxy delete route for post settings action.  
  Implemented in: `src/app/api/community/spaces/[id]/posts/[postId]/route.ts` (`DELETE`), backed by `src/lib/circle/headless-member.ts` (`deleteMemberPost`).
- [ ] Add dedicated `/community/spaces` directory page.  
  Pending: not part of this UI slice.
- [ ] Add space bookmarks experience (`/spaces/{id}/bookmarks`) in member UI.  
  Pending: route integration and UI are not implemented yet.
- [ ] Add space read/unread synchronization (`space_notification_details`, `mark_as_read`) with sidebar indicators.  
  Pending: requires additional proxy routes + sidebar state wiring.

