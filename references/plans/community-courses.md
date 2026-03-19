## Community UI plan: Courses

### Current UI implementation (already in repo)

- **Courses catalog page**: `src/app/community/(main)/courses/page.tsx`
  - Uses `GET /api/community/spaces` then filters `space_type === "course"`
  - Shows “All courses” vs “My courses” based on `is_member`
- **Course space experience**: `src/components/community/CourseSpaceView.tsx`
  - Sections: `GET /api/community/courses/[courseId]` → Headless `GET /courses/{course_id}/sections`
  - Lesson detail: `GET /api/community/courses/[courseId]/lessons/[lessonId]`
  - Progress toggle: `PATCH /api/community/courses/[courseId]/lessons/[lessonId]/progress`
  - Locks: honors `needs_to_complete_previous_lesson` in lesson progress

### Relevant Headless Member API (from swagger)

- **Sections / lessons / progress**
  - `GET /api/headless/v1/courses/{course_id}/sections`
  - `GET /api/headless/v1/courses/{course_id}/lessons/{id}`
  - `PATCH /api/headless/v1/courses/{course_id}/lessons/{lesson_id}/progress`
- **Lesson files**
  - `GET /api/headless/v1/courses/{course_id}/lessons/{lesson_id}/files` (**not used in UI**)
- **Quiz attempts**
  - `GET/POST /api/headless/v1/courses/{course_id}/quiz_attempts` (**not used in UI**)
  - `GET/POST /api/headless/v1/quizzes/{quiz_id}/attempts` (**not used in UI**)
  - `GET /api/headless/v1/quizzes/{quiz_id}/attempts/{id}` (**not used in UI**)
- **Course topics**
  - `GET /api/headless/v1/course_topics` (**not used in UI**)

### Gaps (API capabilities not yet used)

- **Lesson downloads/resources** via `lessons/{lesson_id}/files` *(Implemented in: `src/app/api/community/courses/[courseId]/lessons/[lessonId]/files/route.ts`, `src/lib/circle/headless-member.ts`, `src/components/community/CourseSpaceView.tsx`)*
- **Quizzes**
  - listing quiz prompts (as included in lesson payloads or via quiz endpoints)
  - attempt lifecycle (start attempt, submit, review results)
- **Course topics taxonomy** via `course_topics` for browsing and filtering courses

### UI/UX improvements (best-practice)

- **Course catalog**
  - Add filters: topic, difficulty (if present), duration, enrolled/not, recently updated
  - Add course “card metadata” (progress %, next lesson, total lessons) for enrolled courses
- **Course inside space**
  - Add “Resume where you left off”
  - Add lesson navigation (next/prev unlocked lesson) in lesson view
  - Add lesson resources section (downloads/links)
  - Add richer lesson rendering:
    - cover/featured media (already partially supported)
    - attachments list + open in new tab
- **Quizzes**
  - Add quiz UI embedded in lesson view where a lesson includes quiz content
  - Show attempt history + latest score

### Implementation approach

#### Server routes to add

- `GET /api/community/courses/[courseId]/lessons/[lessonId]/files` → `GET /courses/{course_id}/lessons/{lesson_id}/files` *(Implemented in: `src/app/api/community/courses/[courseId]/lessons/[lessonId]/files/route.ts`)*
- Course topics:
  - `GET /api/community/course-topics` → `GET /course_topics` *(Implemented in: `src/app/api/community/course-topics/route.ts`)*
- Quiz attempts:
  - `GET/POST /api/community/courses/[courseId]/quiz-attempts` → `GET/POST /courses/{course_id}/quiz_attempts` *(Implemented: `GET` in `src/app/api/community/courses/[courseId]/quiz-attempts/route.ts`; note swagger labels this “for admins”.)*
  - `GET/POST /api/community/quizzes/[quizId]/attempts` → `GET/POST /quizzes/{quiz_id}/attempts` *(Implemented: `POST` in `src/app/api/community/quizzes/[quizId]/attempts/route.ts`)*
  - `GET /api/community/quizzes/[quizId]/attempts/[attemptId]` → `GET /quizzes/{quiz_id}/attempts/{id}` *(Implemented: `GET` in `src/app/api/community/quizzes/[quizId]/attempts/[attemptId]/route.ts`)*

#### UI work items

- Course catalog:
  - introduce course topic filters (powered by `course_topics`) *(Implemented in: `src/app/community/(main)/courses/page.tsx`; actual filtering requires `course_topics` metadata in `/api/community/spaces` records.)*
- Lesson view:
  - show lesson files/resources section *(Implemented in: `src/components/community/CourseSpaceView.tsx`)*
  - add next/prev lesson navigation (based on sections payload)
- Quiz:
  - implement attempt flow and persist progress/answers according to swagger schemas *(Implemented minimal flow in: `src/components/community/CourseSpaceView.tsx` + proxies; quiz UI appears when lesson payload includes `quiz_id` or `quiz.id`.)*

### Acceptance checklist

- [x] Lesson files are visible and downloadable from lesson view. *(Implemented in: `src/components/community/CourseSpaceView.tsx` + proxy route.)*
- [~] Course topic taxonomy is usable to filter/browse courses. *(Partially: topics load + selectable in `src/app/community/(main)/courses/page.tsx`; full filtering depends on spaces response including topic metadata.)*
- [~] Quizzes are supported end-to-end with attempts and result viewing. *(Partially: start + submit attempt via `POST /api/community/quizzes/[quizId]/attempts`, results render; requires lesson payload exposing a quiz id.)*
- [ ] Progress updates remain optimistic and resilient to token refresh.

