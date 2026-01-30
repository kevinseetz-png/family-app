# Development Workflow — Agent Pipeline

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, TailwindCSS 4
- **Language**: TypeScript 5 (strict mode)
- **Testing**: Vitest + React Testing Library (unit/integration), Playwright (e2e)
- **Linting**: ESLint 9
- **Package Manager**: npm
- **PWA**: Web app manifest at `public/manifest.json`

## Project Conventions
- **File structure**: `src/app/` for routes (App Router), `src/components/` for shared components, `src/lib/` for utilities, `src/hooks/` for custom hooks, `src/types/` for shared TypeScript types.
- **Component files**: PascalCase — `LoginForm.tsx`, co-located with tests as `LoginForm.test.tsx`.
- **Utilities/hooks**: camelCase — `useAuth.ts`, `validateEmail.ts`.
- **API routes**: `src/app/api/[resource]/route.ts` using Next.js App Router route handlers.
- **Server actions**: `src/app/actions/` directory.
- **Exports**: Named exports only. No default exports except for Next.js pages/layouts.
- **State**: React Server Components by default. Client components only when interactivity is needed (`'use client'` directive).
- **Styling**: TailwindCSS utility classes. No CSS modules. No inline styles.

## Pipeline Handoff
All agents write their output to `docs/pipeline-handoff.md`. Each agent appends its section under a heading like `## Stage N: Agent Name`. Subsequent agents read this file to see prior results. The file is cleared at the start of each new task.

## Complexity Gate
Not every task needs all 9 stages. Use this guide:

| Task Type | Stages to Run |
|-----------|---------------|
| **Small** (typo fix, config change, copy tweak) | Skip pipeline. Just do it. |
| **Medium** (single component, simple route, bug fix) | 1 → 2 → 9 |
| **Large** (feature with UI + API + state, auth, data model) | 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 |

When in doubt, use the medium path and escalate if reviews uncover issues.

## Pipeline Stages

1. **Test Writer** — Write failing tests before implementation.
2. **Implementer** — Write minimum code to pass all tests.
3. **Performance Review** — Flag perf issues. *(Large tasks only)*
4. **Security Review** — Flag vulnerabilities. *(Large tasks only)*
5. **Code Quality Review** — Flag quality issues. *(Large tasks only)*
6. **Accessibility Review** — Flag a11y issues. *(Large tasks only, UI only)*
7. **Type Safety Review** — Flag type issues. *(Large tasks only)*
8. **Feedback Processor** — Apply fixes from stages 3–7. *(Large tasks only)*
9. **Final Tester** — Run all checks and confirm green.

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type check
npx vitest run       # Unit/integration tests
npx playwright test  # E2E tests (when configured)
```

## Rules
- Each stage appends results to `docs/pipeline-handoff.md`.
- If the final test run fails, fix and re-test (max 3 attempts).
- Never delete or skip failing tests to make the suite pass.
- Security > Correctness > Performance > Quality > Style (priority order).
