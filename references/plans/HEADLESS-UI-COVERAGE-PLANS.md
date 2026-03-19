## Headless community UI coverage plans (Circle Member API)

This folder contains **implementation-ready plans** to evolve the member-facing UI (`/community`) until it fully covers the Circle **Headless Member API** surface in `references/circle/api-docs/headless-client-swagger.yaml`.

### How to use these plans

- **Start with the component plan** matching the UI area you’re improving (Spaces, Courses, Chat, …).
- Each plan lists:
  - **Current UI coverage** (what’s already implemented in this repo)
  - **API capabilities not yet used** (endpoints present in swagger, missing in UI)
  - **UI/UX improvements** (best-practice interactions, states, and edge cases)
  - **Implementation approach** (recommended server routes, client hooks, types, and page structure)
  - **Acceptance checklist** (what “done” means)
- **Never call Circle APIs from the browser**. Add/extend server routes under `src/app/api/community/*` and call them from the UI with SWR.

### Plans

- `community-spaces.md`
- Spaces sub-plans (by type):
  - `plans/spaces/basic.md`
  - `plans/spaces/chat.md`
  - `plans/spaces/event.md`
  - `plans/spaces/course.md`
  - `plans/spaces/image.md`
  - `plans/spaces/members.md`
- `community-posts-comments.md`
- `community-chat.md`
- `community-notifications.md`
- `community-events.md`
- `community-courses.md`
- `community-search.md`
- `community-members-profile.md`
- `community-uploads-media.md`
- `community-misc-platform.md`

