## Spaces sub-plan: Image spaces

### What an “image space” is

Spaces where posts are primarily images (often `space_type: "image"` or similar) and should be rendered as a gallery rather than a standard feed.

### Relevant Headless Member API (from swagger)

- Image posts
  - `GET /api/headless/v1/spaces/{space_id}/images/posts`
  - `PUT /api/headless/v1/spaces/{space_id}/images/posts/{id}`
- (Fallback) regular posts endpoint may still work:
  - `GET /api/headless/v1/spaces/{space_id}/posts`

### Current UI implementation (already in repo)

- Image spaces currently fall back to the generic post list in `spaces/[id]/page.tsx` (“basic/image/etc: shows post list”).

### Gaps / improvements

- **Gallery layout**
  - masonry/grid with responsive columns
  - lightbox viewer with keyboard navigation
- **Metadata editing**
  - when the API allows `PUT images/posts/{id}`, expose an edit modal (title/caption/tags per schema)
- **Performance**
  - infinite scroll for image pages
  - progressive image loading and blur placeholders (client-side, optional)

### Implementation approach

- Add server routes:
  - `GET /api/community/spaces/[id]/images/posts`
  - `PUT /api/community/spaces/[id]/images/posts/[imagePostId]`
- UI:
  - detect image space via `space.space_type` and/or presence of images-posts payload
  - render `ImagePostsGrid` instead of `PostCard` list

### Acceptance checklist

- [ ] Image spaces render as a gallery using the dedicated images-posts endpoints.
- [ ] Editing image post metadata is supported when policies allow.

