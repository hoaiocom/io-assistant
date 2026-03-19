## Community UI plan: Search

### Current UI implementation (already in repo)

- **Global search page**: `src/app/community/(main)/search/page.tsx`
  - Uses `GET /api/community/search?q&per_page`
  - Displays list results with `record_type` badge and link to post when `space_id` exists
- **Header search entry**: `src/components/community/CommunityHeader.tsx`
  - redirects to `/community/search?q=...`

### Relevant Headless Member API (from swagger)

- **Basic search**
  - `GET /api/headless/v1/search`
- **Advanced search**
  - `GET /api/headless/v1/advanced_search` (**not used in UI**)
    - supports `type` filters (members/posts/comments/spaces/lessons/events/entity_list/mentions)
    - supports `mention_scope` and `filters` payloads (space/topic/tag/author/status/etc per swagger)

### Gaps (API capabilities not yet used)

- **Advanced search UI**: filters by content type + scope + space/topic/tags and mention-specific queries.
- **Search result routing**:
  - current UI links posts when `space_id` exists, but does not support:
    - comment deep links
    - member profile results
    - spaces results
    - lessons results
    - events results
- **Entity-list / mentions experiences**: the advanced search types imply specialized result sets.

### UI/UX improvements (best-practice)

- **Search as a product surface**
  - Add tabs or filter pills:
    - All
    - Posts
    - Comments
    - Members
    - Spaces
    - Lessons
    - Events
    - Mentions
  - Add filter drawer:
    - space(s), topic(s), tags, author, date range, status (as supported)
  - Preserve query + filters in URL (shareable searches).
- **Result rendering**
  - Use type-specific cards:
    - posts: show title, excerpt, space, author, date
    - comments: show snippet + link to post
    - members: show avatar + headline + message button
    - lessons: show course + section context
    - spaces: show join CTA (if eligible)

### Implementation approach

#### Server routes to add

- `GET /api/community/advanced-search` → `GET /advanced_search` (proxy query params faithfully)

#### UI work items

- Refactor `/community/search` into:
  - a shared search page with a filter state machine
  - an “advanced mode” that uses `advanced_search` when filters/types are selected
- Add deep-link helpers:
  - comment → resolve parent post + route
  - lesson → route to course space lesson view
  - space → route to `/community/spaces/[id]`
  - member → route to `/community/members/[id]`

### Acceptance checklist

- [ ] Advanced search types and filters are usable from UI.
- [ ] Result cards are type-aware and link to the correct destinations.
- [ ] Query + filters are URL-addressable and debounced.

