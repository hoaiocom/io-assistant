## Community UI plan: Chat (DMs, group chats, threads, reactions)

### Current UI implementation (already in repo)

- **Chat list + chat layout**: under `src/app/community/(main)/chat/*`
  - Room list is rendered in `src/app/community/(main)/chat/layout.tsx` (sidebar) and chat page content in `chat/page.tsx` + `chat/[uuid]/page.tsx`.
- **Polling “real-time”**:
  - `chat/[uuid]/page.tsx` polls messages every 5s.
- **API routes in repo**
  - Rooms: `GET/POST /api/community/chat`
  - Room detail: `GET /api/community/chat/[uuid]`
  - Messages: `GET/POST /api/community/chat/[uuid]/messages`
  - Message detail: `GET /api/community/chat/[uuid]/messages/[id]`
  - Mark room read: `POST /api/community/chat/[uuid]/read`
  - Participants: `GET /api/community/chat/[uuid]/participants`
  - Threads: `GET /api/community/chat-threads/[id]`
  - Reactions: `POST/DELETE /api/community/reactions`

### Relevant Headless Member API (from swagger)

- **Chat rooms**
  - `GET/POST /api/headless/v1/messages`
  - `GET /api/headless/v1/messages/{uuid}`
  - `POST /api/headless/v1/messages/{uuid}/mark_all_as_read`
  - `GET /api/headless/v1/messages/unread_chat_rooms`
- **Chat messages**
  - `GET/POST /api/headless/v1/messages/{chat_room_uuid}/chat_room_messages`
  - `GET/DELETE /api/headless/v1/messages/{chat_room_uuid}/chat_room_messages/{id}`
- **Participants**
  - `GET /api/headless/v1/messages/{chat_room_uuid}/chat_room_participants`
  - `GET /api/headless/v1/messages/{chat_room_uuid}/chat_room_participants/{id}`
- **Threads**
  - `GET /api/headless/v1/chat_threads`
  - `GET /api/headless/v1/chat_threads/{id}`
  - `GET /api/headless/v1/chat_threads/unread_chat_threads`
- **Reactions**
  - `POST/DELETE /api/headless/v1/reactions`
- **Member search for chat**
  - `POST /api/headless/v1/search/community_members`

### Gaps (API capabilities not yet used / incomplete in UI)

- **Unread threads UI**: API exists (`unread_chat_threads`) but no dedicated “Threads inbox” view.
- **Unread rooms UI**: API exists (`unread_chat_rooms`) but room list appears to rely on room payload; add explicit unread endpoint usage for accuracy.
- **Message deletion**: API exists (`DELETE chat_room_messages/{id}`) and client wrapper exists (`deleteChatMessage`), but UI doesn’t expose deletion controls.
- **Thread list page**: API exists (`GET /chat_threads`) but UI only fetches a thread by id as a fallback.
- **Participant profile drill-in**
  - participants endpoint exists; add a full participants drawer with search/filter and “start DM” actions.
- **Attachments** (future-ready)
  - UI shows an attach icon but does not upload/send attachments (ties to `direct_uploads` in `community-uploads-media.md`).

### UI/UX improvements (best-practice)

- **Chat list**
  - Add “New message” flow: member search → create room → jump into room.
  - Show robust previews (last message, sender, timestamp, unread pill).
  - Add archived / muted states if supported later.
- **Conversation**
  - Improve incremental loading:
    - support “load older messages” via pagination (page/per_page) or message cursor if available
    - preserve scroll position when prepending history
  - Add message menu:
    - delete (policy/permission gated)
    - copy text
    - reply in thread
  - Add participant list drawer (for group chats).
- **Threads**
  - Add a Threads view (like “Replies” inbox) powered by `/chat_threads` and `/unread_chat_threads`.

### Implementation approach

#### Server routes to add/extend

- `GET /api/community/chat-threads` → list threads
- `GET /api/community/chat-threads/unread` → unread threads
- `GET /api/community/chat/unread` already exists; ensure UI uses it for badges
- `DELETE /api/community/chat/[uuid]/messages/[id]` already exists in routes; expose it in UI with a policy gate

#### Data normalization

Keep chat payload normalization at the API layer (similar to `src/app/api/community/chat/route.ts`) so UI doesn’t have to handle multiple Circle shapes (`chat_room`, `participants_preview`, etc.).

#### Real-time (later phase)

When you’re ready to reduce polling:
- Use Circle WebSockets beta notes: `references/circle/03-websockets-beta.md`
- Start with notifications + chat room channels, and keep polling as a fallback.

### Acceptance checklist

- [ ] Member search → create room → navigate works end-to-end.
- [ ] Unread room count and unread thread count are accurate and update quickly.
- [ ] Message deletion works (policy gated) with optimistic UI.
- [ ] Threads list view exists (unread + all).
- [ ] Attachments are scoped as “planned” and will integrate via `direct_uploads` later.

