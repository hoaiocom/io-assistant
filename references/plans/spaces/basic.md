## Spaces sub-plan: Basic spaces (layouts: Feed / List / Card)

### What “basic space layout” means (in practice)

Circle’s headless API does not expose a dedicated “set layout” endpoint. Instead, the **space payload** includes layout-related fields such as:
- `display_view` (e.g. posts)
- `default_sort` + `hide_sorting`
- `default_tab` + `visible_tabs`
- `topics_count`, `require_topic_selection`
- `is_post_disabled`, `policies.can_create_post`

Your UI should treat “Feed / List / Card” as **presentation modes** over the same underlying data (space posts + topics + policies), while honoring the layout hints in the space payload.

### Relevant Headless Member API (from swagger)

- Space data
  - `GET /api/headless/v1/spaces`
  - `GET /api/headless/v1/spaces/{id}`
  - `GET /api/headless/v1/spaces/home` (returns a “Home” space object with the same schema)
- Posts (basic spaces)
  - `GET /api/headless/v1/spaces/{space_id}/posts` (supports paging + sort + topics params)
  - `POST /api/headless/v1/spaces/{space_id}/posts` (supports `topics` and `tiptap_body`)
- Topics (for topic navigation bar)
  - `GET /api/headless/v1/spaces/{space_id}/topics`
- Bookmarks (space-scoped)
  - `GET /api/headless/v1/spaces/{space_id}/bookmarks`

### Layout plan: implement 3 views on one data model

#### A) Feed layout (default; high-parity with your current UI)

- **Intent**: chronological “conversation stream” with rich PostCards. By default, basic spaces should load the **space’s default view** (from `space.display_view`) and show **all posts** for that space.
- **UI elements**
  - Sort dropdown (hide when `hide_sorting === true`)
  - Topic navigation bar when `topics_count > 0`:
    - horizontal scroll chips
    - optionally enforce selection when `require_topic_selection === true`
  - Pinned posts section (already implemented)
  - “New post” CTA gated by `policies.can_create_post` and `is_post_disabled`
- **API usage**
  - `GET spaces/{space_id}/posts?page&per_page&sort&topics=...`
  - `GET spaces/{space_id}/topics` for the nav bar
- **Edge cases**
  - private space + not member: show join prompt (already implemented)
  - posts disabled: show “Posting disabled” banner; hide composer

#### B) List layout (dense + scan-friendly)

- **Intent**: optimize for “find a thread fast”.
- **UI elements**
  - Table/row list:
    - title
    - author + date
    - likes/comments counts
    - unread/updated indicator (if you implement read-state)
  - Optional: quick actions on hover (like/bookmark)
- **API usage**
  - same `GET spaces/{space_id}/posts` endpoint; just render differently
- **Best practice**
  - support infinite scroll / “Load more” with stable paging
  - preserve scroll position when switching sort/topics

#### C) Card layout (visual + discoverability)

- **Intent**: highlight cover images, featured media, and event-ish posts in a space.
- **UI elements**
  - responsive grid of cards
  - strong empty states and skeletons
- **API usage**
  - same `GET spaces/{space_id}/posts`
  - optionally complement with `GET spaces/{space_id}/bookmarks` for “Saved” segment
- **When to prefer**
  - spaces where posts often have `cover_image`/`cardview_image`/rich media

### Topic navigation (ties to your screenshot)

Implement a consistent topic navigation bar for basic spaces:
- **Data**: `GET /spaces/{space_id}/topics`
- **Filtering**: pass `topics` query param to `GET /spaces/{space_id}/posts`
- **Rules**
  - always include an `All` topic chip that shows all posts when selected
  - if `require_topic_selection` is true: block list rendering until a topic is chosen
  - hide admin-only topics from the bar unless the member is admin/mod (if that role data is in payloads)

### Implementation approach (repo-specific)

#### Server routes to add

- `GET /api/community/spaces/[id]/topics`
- `GET /api/community/spaces/[id]/bookmarks`

#### UI refactor suggestion (to support 3 layouts cleanly)

- Create a `SpacePostsView` component with:
  - `layout: "feed" | "list" | "card"`
  - `space` (includes layout hints)
  - `postsData`
  - `onLike`, `onBookmark`, `onOpenPost`
- In `spaces/[id]/page.tsx`, select default layout based on:
  - `space.display_view` / other hints
  - user override stored in local storage (optional)

### Acceptance checklist

- [x] Basic space supports Feed/List/Card layouts (UI parity) without changing the API. (See `src/app/community/(main)/spaces/[id]/page.tsx` — tabs + 3 renderers over the same posts data)
- [x] Topic navigation is implemented and matches `require_topic_selection`. (See `src/app/api/community/spaces/[id]/topics/route.ts`, and topic chips + gating in `src/app/community/(main)/spaces/[id]/page.tsx`)
- [x] Sorting respects `hide_sorting` and uses API-supported sort values. (See `src/app/community/(main)/spaces/[id]/page.tsx` — hides sort dropdown when `space.hide_sorting` and uses swagger enum values; “Latest” omits the param)
- [x] Default load state shows **All posts** in the space with the `All` topic chip selected and uses the space’s `display_view` value as the initial layout (Feed/List/Card).
- [x] All routes go through `/api/community/*` proxies; no direct Circle calls in browser. (Posts/topics proxies under `src/app/api/community/spaces/[id]/*`)

