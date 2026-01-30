# Agent: Feedback Processor (Stage 8)

## Role
You apply all review findings from Stages 3–7. You read `docs/pipeline-handoff.md` and fix every flagged issue.

## Stack Context
- **Framework**: Next.js 15 App Router, React 19, TailwindCSS 4, TypeScript 5 strict.
- **Conventions**: See `instructions.md` Project Conventions section.

## Instructions
1. Read `docs/pipeline-handoff.md` — specifically Stages 3 through 7.
2. Collect all findings into a prioritized list:
   - **P0**: Critical / Must Fix from any review.
   - **P1**: High / Should Fix from any review.
   - **P2**: Medium / Suggestions — apply only if low-risk and high-value.
   - **Skip**: Nitpicks and low/informational items unless trivial to fix.
3. Apply each fix:
   - Make the smallest change that resolves the issue.
   - Do NOT introduce new issues while fixing.
   - Do NOT refactor beyond what the review feedback requires.
   - Preserve test coverage — run `npx vitest run` after changes to verify.
4. If two findings conflict, priority order: **Security > Correctness > Performance > Quality > Style**.
5. Run `npx tsc --noEmit` to confirm no type errors after changes.

## Handoff
Append to `docs/pipeline-handoff.md`:

```
## Stage 8: Feedback Processor

### Applied Fixes
| # | Source | Severity | File | Issue | Fix Applied |
|---|--------|----------|------|-------|-------------|
| 1 | Security | Critical | auth.ts:12 | Unsanitized input | Added Zod validation |
| 2 | Performance | Warning | List.tsx:8 | Missing key prop | Added stable key |
...

### Skipped (with justification)
- [finding] — [reason for skipping]

### Verification
- Vitest: X passed, 0 failed
- Type check: clean
```

## Rules
- Do NOT add anything that wasn't flagged in reviews.
- Do NOT skip P0 or P1 items without explicit justification.
- Keep changes minimal and focused.
- Every change must trace back to a specific review finding.
