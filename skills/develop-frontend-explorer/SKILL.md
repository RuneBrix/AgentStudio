---
name: develop-frontend-explorer
description: Implement or review AgentStudio React explorer behavior, presentation, accessibility, and native DTO consumption. Use for changes under src/; do not use for Rust parsing rules.
---

# Develop the frontend explorer

Read `src/AGENTS.md`, `docs/ARCHITECTURE.md`, and the current DTOs in `src/model.ts` before changing behavior.

## Outcome

Deliver a minimal, understandable Windows desktop interface that presents native scan results faithfully. Preserve visible distinctions between explicit source facts and application inference, and make read-only versus user-triggered actions unambiguous.

## Work boundaries

- Keep project filesystem access behind `src/api.ts` and narrow Tauri commands.
- Derive view state from the serialized model instead of redefining domain semantics in components.
- Handle empty, loading, diagnostic, and failure states alongside the happy path.
- Maintain semantic labels, keyboard usability, focus visibility, and the configured minimum window size.
- Reuse the existing visual language unless the task explicitly changes it.

Use Figma skills only when the task supplies or requests Figma work. Use computer-use when native dialogs, focus, layout, or Windows interaction require live UI verification. Use ImageGen only for requested raster assets, not SVG or code-native UI.

## Finish

Run `npm run build`. Add focused tests when behavior contains meaningful logic. If visible capabilities, terms, setup, or contracts changed, use `maintain-project-guidance` and consult `docs/MAINTENANCE.md` before finishing.
