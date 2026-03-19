## Community UI plan: Notifications

### Current UI implementation (already in repo)

- **Notification list**: `src/app/community/(main)/notifications/page.tsx`
  - `GET /api/community/notifications?page&per_page`
  - mark single as read: `POST /api/community/notifications/[id]/read`
  - mark all as read: `POST /api/community/notifications`
- **Header unread badge**: `src/components/community/CommunityHeader.tsx`
  - uses `GET /api/community/notifications?count=true` to fetch `new_notifications_count`

### Relevant Headless Member API (from swagger)

- **Notifications**
  - `GET /api/headless/v1/notifications`
  - `POST /api/headless/v1/notifications/mark_all_as_read`
  - `POST /api/headless/v1/notifications/{id}/mark_as_read`
  - `GET /api/headless/v1/notifications/new_notifications_count`
  - `POST /api/headless/v1/notifications/reset_new_notifications_count` (**not used in UI**)
  - `POST /api/headless/v1/notifications/{id}/archive` (**not used in UI**)
  - `GET /api/headless/v1/notifications/{id}` (**not used in UI**)
  - `DELETE /api/headless/v1/notifications/{id}` (**not used in UI**, if supported)
- **Notification preferences**
  - `GET/PUT /api/headless/v1/notification_preferences/{medium}` (**not used in UI**)
  - `GET/PUT /api/headless/v1/notification_preferences/{notification_preference_medium}/spaces` (**not used in UI**)
  - `GET/PUT /api/headless/v1/notification_preferences/{notification_preference_medium}/spaces/{id}` (**not used in UI**)
  - `PUT /api/headless/v1/notification_preferences/space_members/{id}` (**not used in UI**)

### Gaps (API capabilities not yet used)

- **Archive notifications**: allow users to archive/clean up notifications.
- **Reset new notifications count**: useful after loading notifications or for “mark all seen” semantics.
- **Preferences UI**:
  - global preferences per medium (email/push/in-app)
  - per-space preferences and per-space-member settings (where Circle supports it)
- **Notification detail view**: useful for richer rendering and deep links.

### UI/UX improvements (best-practice)

- **Notification rendering**
  - Turn each notification into a proper deep link:
    - route internally when possible (space/post/event)
    - fall back to opening `action_web_url` in a new tab when the target can’t be represented headlessly
  - Improve grouping:
    - group by day (“Today”, “Yesterday”, “Earlier”)
    - compact repeated actions
- **Actions**
  - Add swipe/overflow menu actions (mobile + desktop):
    - mark as read/unread (if supported)
    - archive
  - Add “Mark all read” + “Archive read” (if feasible)
- **Preferences**
  - Add `/community/settings/notifications` page for notification settings and per-space overrides.

### Implementation approach

#### Server routes to add

- `POST /api/community/notifications/reset-count` → `POST /notifications/reset_new_notifications_count`
- `POST /api/community/notifications/[id]/archive` → `POST /notifications/{id}/archive`
- Preferences:
  - `GET/PUT /api/community/notification-preferences/[medium]`
  - `GET/PUT /api/community/notification-preferences/[medium]/spaces`
  - `GET/PUT /api/community/notification-preferences/[medium]/spaces/[id]`
  - `PUT /api/community/notification-preferences/space-members/[spaceMemberId]`

#### Client behavior

- Badge count:
  - continue polling count in header, but also reset/refresh after viewing notifications
- Use optimistic updates for archive/mark-as-read to keep list responsive.

### Acceptance checklist

- [ ] Notification archive is supported (API + UI).
- [ ] “Reset new notifications count” is called at appropriate times to keep badge accurate.
- [ ] Notification preferences UI exists and persists changes.
- [ ] Links behave correctly (internal when possible, external fallback).

