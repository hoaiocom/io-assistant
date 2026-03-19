## Spaces sub-plan: Members spaces

### What a “members space” is

Some Circle communities expose a members directory space (`space_type: "members"`). Even if the global Members page exists, this space type can imply different “default tabs” or presentation rules.

### Relevant Headless Member API (from swagger)

- Spaces
  - `GET /api/headless/v1/spaces/{id}`
- Members directory
  - `GET /api/headless/v1/community_members`
  - `GET /api/headless/v1/community_members/{community_member_id}/public_profile`

### Current UI implementation (already in repo)

- Members directory is a standalone page: `/community/members`
- Sidebar icons already map `space_type: "members"` → `Users` icon.

### Gaps / improvements

- **Space-type routing**
  - If a members space is selected in the sidebar, route to a dedicated view that:
    - uses the same members directory components
    - honors space-level config like `visible_tabs`/`default_tab` if present
- **Space-scoped member filters**
  - if the API supports filtering members by `space_id` (it does via query param), expose it when arriving from a members space:
    - `GET /community_members?space_id=...`

### Acceptance checklist

- [ ] Selecting a members space in the sidebar provides a first-class members experience.
- [ ] Space-scoped member filtering is supported (when arriving from that space).

