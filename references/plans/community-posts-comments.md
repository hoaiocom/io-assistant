## Community UI plan: Posts & Comments

### Scope

Feed, space post lists, post detail pages, bookmarking, likes, and comment threads.

### Current UI implementation (already in repo)

- **Home feed**: `src/app/community/(main)/page.tsx`
  - `GET /api/community/feed` (Headless `GET /home`)
  - Sort UI (latest/popular/likes/etc) and paging
  - Like: `POST/DELETE /api/community/posts/[postId]/like`
  - Bookmark create: `POST /api/community/bookmarks`
- **Space posts**: `src/app/community/(main)/spaces/[id]/page.tsx`
  - `GET /api/community/spaces/[id]/posts` (paging, sort)
  - Create post: `POST /api/community/spaces/[id]/posts`
  - Pinned posts presentation
- **Post detail**: `src/app/community/(main)/spaces/[id]/posts/[postId]/page.tsx`
  - `GET /api/community/spaces/[id]/posts/[postId]`
  - `GET/POST /api/community/posts/[postId]/comments`
  - Threaded replies: `POST /api/community/comments/[commentId]/replies`
  - Comment likes: `POST/DELETE /api/community/comments/[commentId]/like`
- **Bookmarks page**: `src/app/community/(main)/bookmarks/page.tsx`
  - `GET /api/community/bookmarks`
  - Delete bookmark: `DELETE /api/community/bookmarks/[id]`

### Relevant Headless Member API (from swagger)

- **Home**
  - `GET /api/headless/v1/home`
- **Posts in space**
  - `GET /api/headless/v1/spaces/{space_id}/posts`
  - `POST /api/headless/v1/spaces/{space_id}/posts` (create)
  - `GET /api/headless/v1/spaces/{space_id}/posts/{id}`
- **Likes**
  - `POST/DELETE /api/headless/v1/posts/{post_id}/user_likes`
  - `POST/DELETE /api/headless/v1/comments/{comment_id}/user_likes`
- **Comments**
  - `GET /api/headless/v1/posts/{post_id}/comments`
  - `POST /api/headless/v1/posts/{post_id}/comments`
  - `DELETE /api/headless/v1/posts/{post_id}/comments/{id}`
  - `POST /api/headless/v1/comments/{comment_id}/replies`
  - `DELETE /api/headless/v1/comments/{comment_id}/replies/{id}`
- **Bookmarks**
  - `GET/POST /api/headless/v1/bookmarks`
  - `DELETE /api/headless/v1/bookmarks/{id}`
  - `GET /api/headless/v1/spaces/{space_id}/bookmarks` (**not used in UI**)
- **Post followers (subscriptions)**
  - `GET /api/headless/v1/posts/{post_id}/post_followers` (**not used in UI**)
  - `POST /api/headless/v1/posts/{post_id}/post_followers` (**not used in UI**)
  - `DELETE /api/headless/v1/posts/{post_id}/post_followers/{id}` (**not used in UI**)
- **Images posts (media posts)**
  - `GET /api/headless/v1/spaces/{space_id}/images/posts` (**not used in UI**)
  - `PUT /api/headless/v1/spaces/{space_id}/images/posts/{id}` (**not used in UI**)

### Gaps (API capabilities not yet used)

- **Follow/Unfollow posts** (post notifications / subscriptions) via `post_followers`.
- **Space bookmarks view** (see `community-spaces.md`).
- **Image posts management** (for image-based spaces), including updating image post metadata via `PUT`.
- **Comment and reply deletion UI**:
  - APIs exist and wrappers exist (`deleteComment`, `deleteReply` in `src/lib/circle/headless-member.ts`), but the current UI does not expose deletion controls even when policies allow it.

### UI/UX improvements (best-practice)

- **Post actions parity**
  - Add “Follow” toggle (and show state) on post detail.
  - Add “Copy link”, “Share”, and “Report” entry points (where supported by policies).
- **Rich composer**
  - Upgrade post composer beyond plaintext textarea:
    - use TipTap payload (`tiptap_body`) consistently for posts and comments where accepted
    - support mentions and attachments over time (ties to `direct_uploads` plan)
- **Comments**
  - Support sorting (oldest/latest/likes/latest_updated) if swagger supports.
  - Add “Load more” and “Collapse long comment” behavior (partially implemented).
  - Add delete/edit actions gated by `policies` fields when present.
- **Media posts**
  - Add gallery layout for image spaces; support infinite scroll and lightbox viewing.

### Implementation approach

#### Server routes to add

- [x] `GET /api/community/posts/[postId]/followers`  
  Implemented in: `src/app/api/community/posts/[postId]/followers/route.ts` and `src/lib/circle/headless-member.ts` (`getPostFollowers`).
- [x] `POST /api/community/posts/[postId]/followers`  
  Implemented in: `src/app/api/community/posts/[postId]/followers/route.ts` and `src/lib/circle/headless-member.ts` (`followPost`).
- [x] `DELETE /api/community/posts/[postId]/followers/[followerId]`  
  Implemented in: `src/app/api/community/posts/[postId]/followers/[followerId]/route.ts` and `src/lib/circle/headless-member.ts` (`unfollowPostByFollowerId`).
- [ ] `GET /api/community/spaces/[id]/images/posts`  
  Pending: not implemented in this slice; image-space feed was deferred to keep this change shippable and focused on post followers + comment/reply deletion.
- [ ] `PUT /api/community/spaces/[id]/images/posts/[imagePostId]`  
  Pending: depends on image-space UI flow and edit affordances that are not part of this slice.

#### UI work items

- Post detail:
  - [x] add follow/unfollow toggle and show follower count  
    Implemented in: `src/app/community/(main)/spaces/[id]/posts/[postId]/page.tsx` (optimistic toggle + follower count on post detail).
  - [x] wire comment/reply deletion UI (policy-gated)  
    Implemented in: `src/app/community/(main)/spaces/[id]/posts/[postId]/page.tsx`, `src/app/api/community/posts/[postId]/comments/[id]/route.ts`, and `src/app/api/community/comments/[commentId]/replies/[id]/route.ts`.
- Space detail:
  - [ ] if `space_type === "image"` (or payload indicates image space), render image feed using images posts endpoints  
    Pending: separate slice needed (new proxy routes + image feed rendering strategy in space page).

### Acceptance checklist

- [x] Post follow/unfollow supported (API + UI + optimistic updates).  
  Implemented in: `src/lib/circle/headless-member.ts`, `src/app/api/community/posts/[postId]/followers/route.ts`, `src/app/api/community/posts/[postId]/followers/[followerId]/route.ts`, `src/app/community/(main)/spaces/[id]/posts/[postId]/page.tsx`.
- [x] Comment/reply deletion supported (policy-gated).  
  Implemented in: `src/lib/circle/headless-member.ts`, `src/app/api/community/posts/[postId]/comments/[id]/route.ts`, `src/app/api/community/comments/[commentId]/replies/[id]/route.ts`, `src/app/community/(main)/spaces/[id]/posts/[postId]/page.tsx`.
- [ ] Image spaces render using images-posts endpoints and feel native.  
  Pending: not included in this implementation slice.
- [x] All new features go through server proxy routes; no tokens in client.  
  Implemented in: new `/api/community/**` routes above; UI calls only internal API endpoints.

