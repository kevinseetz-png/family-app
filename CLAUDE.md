# Claude Code — Mandatory Workflow

**ALWAYS follow the agent pipeline defined in `.claude/instructions.md` for every task.**

## Pipeline Enforcement

Every code task MUST go through the pipeline. Use the complexity gate to determine which stages:

| Task Type | Stages |
|-----------|--------|
| **Small** (typo, config, copy) | Skip pipeline, just do it |
| **Medium** (single component, bug fix) | 1 → 2 → 9 |
| **Large** (feature, auth, data model, multi-file) | 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 |

## Pipeline Stages

1. **Test Writer** (`.claude/agents/01-test-writer.md`) — Write failing tests FIRST
2. **Implementer** (`.claude/agents/02-implementer.md`) — Minimum code to pass tests
3. **Performance Reviewer** (`.claude/agents/03-performance-reviewer.md`) — Report only
4. **Security Reviewer** (`.claude/agents/04-security-reviewer.md`) — Report only
5. **Code Quality Reviewer** (`.claude/agents/05-code-quality-reviewer.md`) — Report only
6. **Accessibility Reviewer** (`.claude/agents/06-accessibility-reviewer.md`) — Report only
7. **Type Safety Reviewer** (`.claude/agents/07-type-safety-reviewer.md`) — Report only
8. **Feedback Processor** (`.claude/agents/08-feedback-processor.md`) — Apply fixes from 3-7
9. **Final Tester** (`.claude/agents/09-final-tester.md`) — Run all checks, produce verdict

## Handoff

All agents write output to `docs/pipeline-handoff.md`. Each stage appends under `## Stage N: Agent Name`.

## Rules

- NEVER skip the pipeline for medium or large tasks.
- NEVER write implementation code without tests first.
- NEVER modify code during review stages (3-7) — report only.
- Security > Correctness > Performance > Quality > Style.
- Read agent spec files in `.claude/agents/` before executing each stage.
