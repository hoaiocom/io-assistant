## Spaces sub-plan: Chat spaces

### What a “chat space” is

In Circle, some spaces are of `space_type: "chat"` and have an embedded chat room. In your repo today, chat spaces are rendered via `ChatSpaceView` from the space detail route.

### Relevant Headless Member API (from swagger)

- Space data
  - `GET /api/headless/v1/spaces/{id}` (used to resolve embedded room uuid in your client wrapper)
- Chat room messages/participants (room-scoped)
  - `GET/POST /api/headless/v1/messages/{chat_room_uuid}/chat_room_messages`
  - `GET /api/headless/v1/messages/{chat_room_uuid}/chat_room_participants`
  - `GET /api/headless/v1/messages/{chat_room_uuid}/chat_room_participants/{id}`

### Current UI implementation (already in repo)

- `src/components/community/ChatSpaceView.tsx` (space chat UI)
- API routes:
  - `GET /api/community/spaces/[id]/chat-messages`
  - `GET /api/community/spaces/[id]/chat-participants`

### Gaps / improvements

- **Performance & scrolling**
  - implement “load older” via `id`, `previous_per_page`, `next_per_page` query params (your client wrapper already supports this pattern for space chat)
  - preserve scroll position when prepending older messages
- **Reactions / threads parity**
  - if the room messages include thread/reaction metadata, reuse the DM thread/reaction components where possible
- **Member profiles**
  - consistent hover card / profile dialog on avatars (match DM chat)

### Acceptance checklist

- [ ] Chat space supports pagination/cursor navigation smoothly.
- [ ] Participants list exists (drawer) and links to member profiles.
- [ ] Reactions and threads are consistent with DM chat behavior (where supported).

