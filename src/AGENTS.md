# Frontend explorer guidance

This scope owns the React/TypeScript presentation layer. Use `skills/develop-frontend-explorer/SKILL.md` for frontend work.

## Focus

- Present `ProjectScan` data without inventing semantics the Rust result does not provide.
- Keep explicit and inferred relationships visually distinct.
- Make read-only state and user-triggered actions obvious.
- Keep filesystem access behind typed wrappers in `src/api.ts`; do not add direct filesystem access to React.
- Preserve keyboard usability, semantic labels, readable focus states, and layouts that remain usable at the configured minimum window size.
- Prefer small components and derived view state over duplicating the native data model.

## Change obligations

- When the Rust DTO changes, update `src/model.ts`, API consumers, empty/error states, and the relevant integration view together.
- When visible behavior or supported content changes, check `README.md`, `docs/MVP.md`, and `docs/MAINTENANCE.md` for stale claims.
- Add frontend tests when logic becomes non-trivial; do not add a test stack solely for static markup.
- Run `npm run build`. Run the full `npm test` when shared behavior or contracts change.

Use Figma skills only when a Figma source or explicit Figma task exists. Use computer-use for actual Windows UI verification when interaction, focus, native dialogs, or layout cannot be established by compilation alone.
