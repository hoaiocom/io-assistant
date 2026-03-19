## Spaces sub-plan: Course spaces

### What a “course space” is

Spaces with `space_type: "course"` act as a container for course sections/lessons and progress tracking.

### Relevant Headless Member API (from swagger)

- Space data
  - `GET /api/headless/v1/spaces/{id}`
- Course content
  - `GET /api/headless/v1/courses/{course_id}/sections`
  - `GET /api/headless/v1/courses/{course_id}/lessons/{id}`
  - `PATCH /api/headless/v1/courses/{course_id}/lessons/{lesson_id}/progress`
- Extras (not yet used in UI)
  - `GET /api/headless/v1/courses/{course_id}/lessons/{lesson_id}/files`
  - quizzes + attempts endpoints
  - `GET /api/headless/v1/course_topics`

### Current UI implementation (already in repo)

- Course spaces are rendered in `CourseSpaceView` and support:
  - section list, lesson view, progress toggling, locked lessons

### Gaps / improvements (space-specific)

- **Space-level navigation**
  - add “About / Overview” tab if the space has rich description metadata
  - add “Discussion” tab if the course space also supports posts (depends on `visible_tabs`)
- **Completion UX**
  - completion certificate CTA (if you later add a non-API feature)
  - progress summaries that match Circle UI patterns

### Acceptance checklist

- [x] Course spaces honor `visible_tabs` and match course + discussion expectations. *(Implemented in: `src/app/community/(main)/spaces/[id]/page.tsx` — course tabs; Discussion tab shows only when `space.visible_tabs.posts` is true.)*
- [ ] Course-specific extras (files/quizzes/topics) are wired as per `community-courses.md`.
  - [x] Lesson files/resources are visible in lesson view. *(Implemented in: `src/app/api/community/courses/[courseId]/lessons/[lessonId]/files/route.ts`, `src/lib/circle/headless-member.ts`, `src/components/community/CourseSpaceView.tsx`.)*
  - [~] Quizzes endpoints + UI (attempt lifecycle). *(Implemented minimal attempt flow in: `src/app/api/community/quizzes/[quizId]/attempts/route.ts`, `src/app/api/community/quizzes/[quizId]/attempts/[attemptId]/route.ts`, `src/lib/circle/headless-member.ts`, `src/components/community/CourseSpaceView.tsx`; **Pending**: depends on lesson payload exposing `quiz_id` or `quiz.id`.)*
  - [~] Course topics taxonomy + filters. *(Implemented topics proxy route in `src/app/api/community/course-topics/route.ts` + catalog UI in `src/app/community/(main)/courses/page.tsx`; **Pending**: filtering requires topic metadata per course in `/api/community/spaces`.)*

