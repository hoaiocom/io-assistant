## Community UI plan: Uploads & Media

### Why this plan exists

Several headless features (chat attachments, image posts updates, lesson resources) rely on upload/media endpoints that are present in the swagger but not yet wired into the UI.

### Relevant Headless Member API (from swagger)

- **Direct uploads**
  - `POST /api/headless/v1/direct_uploads` (**not used in UI**)
- **Image posts (image spaces)**
  - `GET /api/headless/v1/spaces/{space_id}/images/posts` (**not used in UI**)
  - `PUT /api/headless/v1/spaces/{space_id}/images/posts/{id}` (**not used in UI**)
- **Course lesson files**
  - `GET /api/headless/v1/courses/{course_id}/lessons/{lesson_id}/files` (**planned in `community-courses.md`**)

### Current UI implementation (already in repo)

- Community UI shows media in:
  - posts: cover images are rendered as `<img>` directly
  - courses: featured media in lessons supports video/audio/image
  - chat: attachment icon exists in UI but does nothing yet
- Image proxy exists:
  - `GET /api/community/image-proxy?url=...` for CORS/referrer issues

### Gaps (API capabilities not yet used)

- **Attachment upload** (chat + posts + comments if supported)
- **Image space content parity** (gallery feed + updates)
- **Secure handling of external media URLs**:
  - consistent proxying for referrer/CORS edge cases
  - avoid leaking signed URLs to third parties where possible

### UI/UX improvements (best-practice)

- **Chat attachments**
  - Add attachment picker with:
    - file type restrictions and size limits
    - upload progress + retry
    - inline previews for images
  - Send message with `rich_text_body.attachments` (as supported by swagger schema).
- **Post composer attachments**
  - Extend the post/comment composer to support attachments once the upload pipeline is in place.
- **Image spaces**
  - Render image feed using images posts endpoints:
    - masonry/grid layout
    - lightbox viewer
    - update metadata via `PUT` where allowed

### Implementation approach

#### Server routes to add

- `POST /api/community/direct-uploads` → `POST /direct_uploads`
  - keep the upload handshake server-side
  - return only what the browser needs to upload (signed URL + fields), per Circle’s contract
- Image posts:
  - `GET /api/community/spaces/[id]/images/posts`
  - `PUT /api/community/spaces/[id]/images/posts/[imagePostId]`

#### Client implementation notes

- Use a two-step upload pattern (typical direct upload flows):
  - request upload config from server route
  - upload to the returned storage URL from browser
  - then reference uploaded asset in the message/post payload as required
- Add strong guardrails:
  - validate content-type and size on the client
  - ensure server route does not accept arbitrary URLs (only calls Circle)

### Acceptance checklist

- [ ] Direct upload flow works for at least chat attachments (upload + send).
- [ ] Image spaces render as first-class gallery experiences.
- [ ] Upload errors are recoverable (retry) and do not break chat/send flows.

