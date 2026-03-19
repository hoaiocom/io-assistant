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

- **Lesson downloads/resources** via `lessons/{lesson_id}/files`
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

- `GET /api/community/courses/[courseId]/lessons/[lessonId]/files` → `GET /courses/{course_id}/lessons/{lesson_id}/files`
- Course topics:
  - `GET /api/community/course-topics` → `GET /course_topics`
- Quiz attempts:
  - `GET/POST /api/community/courses/[courseId]/quiz-attempts` → `GET/POST /courses/{course_id}/quiz_attempts`
  - `GET/POST /api/community/quizzes/[quizId]/attempts` → `GET/POST /quizzes/{quiz_id}/attempts`
  - `GET /api/community/quizzes/[quizId]/attempts/[attemptId]` → `GET /quizzes/{quiz_id}/attempts/{id}`

#### UI work items

- Course catalog:
  - introduce course topic filters (powered by `course_topics`)
- Lesson view:
  - show lesson files/resources section
  - add next/prev lesson navigation (based on sections payload)
- Quiz:
  - implement attempt flow and persist progress/answers according to swagger schemas

### Acceptance checklist

- [ ] Lesson files are visible and downloadable from lesson view.
- [ ] Course topic taxonomy is usable to filter/browse courses.
- [ ] Quizzes are supported end-to-end with attempts and result viewing.
- [ ] Progress updates remain optimistic and resilient to token refresh.

