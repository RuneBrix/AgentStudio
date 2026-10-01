---
name: maintain-project-guidance
description: Reconcile AgentStudio README, architecture, format research, MVP, contributor instructions, scoped AGENTS.md files, and repository skills after material project changes.
---

# Maintain project guidance

This is the documentation-handler workflow. It runs when invoked during a task or final review; it is not a background agent.

Read `docs/AGENTS.md` and `docs/MAINTENANCE.md`, then inspect the actual diff.

## Reconciliation

- Identify which maintenance-map rows the change affects.
- Compare implemented behavior with user-facing, architectural, research, and contributor claims.
- Make the smallest edits that restore accuracy; do not rewrite unaffected Markdown.
- Keep shipped behavior, accepted decisions, research facts, inference, ambiguity, and deferred plans visibly distinct.
- Update scoped `AGENTS.md` or skills only when the development workflow or invariant changed.
- Keep `agents/openai.yaml` metadata aligned with each skill entrypoint.
- Never claim tests, UI behavior, supported formats, or safety properties that were not verified.

Use installed document or design plugins only when the affected artifact genuinely requires them. Ordinary Markdown maintenance should remain local and dependency-free.

## Validate

Run `npm run check:guidance`. Then run the checks required by the underlying code change; documentation-only edits need no desktop rebuild unless they alter build inputs, embedded assets, or commands.
