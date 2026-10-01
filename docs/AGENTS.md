# Documentation handler guidance

This scope maintains durable project truth. Use `skills/maintain-project-guidance/SKILL.md` when code or configuration changes may require documentation updates.

## Document ownership

- `README.md`: current user-facing capabilities, setup, safety posture, and links.
- `docs/ARCHITECTURE.md`: accepted boundaries, data flow, model decisions, and deferred write strategy.
- `docs/FORMAT-RESEARCH.md`: sourced format facts, conservative interpretations, and unresolved ambiguity.
- `docs/MVP.md`: implemented slice, acceptance criteria, and explicitly deferred work.
- `docs/MAINTENANCE.md`: code-to-document and code-to-guidance update map.
- `CONTRIBUTING.md`: contributor workflow and required checks.
- Scoped `AGENTS.md` files and repository skills: operational guidance for future agent sessions.

## Rules

- Update claims because the source of truth changed, not merely because a file was touched.
- Keep current behavior separate from plans and deferred work.
- Date research findings and retain authoritative source links.
- Keep inferred behavior labeled as inferred.
- Never describe an unimplemented command, write path, parser, or relationship as available.
- After guidance changes, run `npm run check:guidance`.
