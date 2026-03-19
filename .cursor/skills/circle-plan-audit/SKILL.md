---
name: circle-plan-audit
description: Audits a Circle headless UI plan against this repo’s implementation and Circle swagger YAMLs. Use when the user provides a plan from references/plans/* and asks what’s missing, what’s already done, or wants a coverage/gap report before implementation.
---

# Circle plan audit (UI ↔ API coverage)

## Inputs (user-provided)

- **Plan path**: a markdown file under `references/plans/` (example: `references/plans/spaces/basic.md`)
- **References folder**: `references/` (contains the Circle swagger YAMLs)

If the user paste plan text instead of a path, treat it as the plan.

## Non-negotiables (repo rules)

- Never expose Circle tokens to the browser. All Circle calls go through server routes under `src/app/api/community/*`.
- Prefer normalizing response shapes in server routes so UI components stay simple.

## Audit workflow

### 1) Read the plan and extract intent

From the plan, collect:
- **Target UI surface(s)** (routes/components)
- **Required API endpoints** (Headless Member API)
- **Planned server routes** (proxy routes you expect to exist)
- **Acceptance checklist** items

### 2) Verify API support in swagger

Use `references/circle/api-docs/headless-client-swagger.yaml` to confirm:
- endpoint exists
- methods (GET/POST/PATCH/DELETE)
- required params and request body schema
- response shape hints that might affect UI (pagination, fields like `display_view`, etc.)

### 3) Check current implementation coverage

Look for:
- existing proxy routes in `src/app/api/community/**/route.ts`
- existing Circle client wrapper functions in `src/lib/circle/headless-member.ts`
- existing UI pages/components under `src/app/community/**` and `src/components/community/**`

### 4) Produce a coverage report (required output format)

Return a concise report with these sections:

#### Coverage summary
- **Already implemented**: bullet list (point to routes/components)
- **Partially implemented**: bullet list (what’s missing)
- **Not implemented**: bullet list (APIs/UI not present)

#### API-to-UI mapping table
For each endpoint family in the plan:
- **Swagger endpoint**
- **Proxy route** (exists? if not, propose file path)
- **Client wrapper** (exists? if not, propose function name)
- **UI usage** (exists? where)

#### Risks / constraints
- token/session constraints (member auth)
- pagination / rate limits
- missing fields or ambiguous swagger areas

#### Recommended implementation slices
Break into 3–8 slices, each independently shippable.

## Examples (how the user should call this)

**Example prompt**

“Use `circle-plan-audit` on `references/plans/spaces/basic.md`. Compare it to `references/circle/api-docs/headless-client-swagger.yaml` and our current `/community` UI. Tell me what endpoints and UI behaviors are missing.”

