# AgentStudio contributor guidance

AgentStudio is a local-first Tauri 2 + React application for understanding repository agent instruction files and skills. `AGENTS.md` files in this repository are scoped contributor guidance, not declarations of independently runnable agents.

## Instruction scopes

- `src/AGENTS.md` applies to the React/TypeScript interface.
- `src-tauri/AGENTS.md` applies to Rust, Tauri commands, discovery, parsing, and native safety boundaries.
- `docs/AGENTS.md` applies to maintained project documentation.
- `skills/AGENTS.md` applies to repository-owned skill definitions.

Read the nearest scoped file before changing files in that subtree. Deeper guidance supplements this file and wins when it is more specific.

## Repository skills

Use the matching repository skill when the task enters its domain:

- `skills/develop-frontend-explorer/SKILL.md` for React explorer behavior, presentation, and desktop UI work.
- `skills/develop-native-scanner/SKILL.md` for Rust discovery, parsing, relationships, diagnostics, or Tauri native commands.
- `skills/research-agent-formats/SKILL.md` when adding or revising assumptions about agent or skill formats.
- `skills/maintain-project-guidance/SKILL.md` after material code, configuration, dependency, or format changes that may make documentation or guidance stale.

These skills are intentionally narrow and may be combined when a change crosses boundaries. Read a skill's full `SKILL.md` before using it.

## Architectural boundaries

- Keep filesystem discovery, parsing, and any future writes in Rust behind narrow Tauri commands.
- Keep the React layer focused on presentation and explicit user actions.
- Treat `AGENTS.md` as a filesystem-scoped instruction source, not proof of a runnable subagent.
- Preserve raw source and unknown metadata. Never silently turn inferred relationships into explicit ones.
- Do not add project-file writes without a preview, explicit confirmation, concurrent-change protection, and preservation tests.
- Prefer deterministic local behavior; do not add telemetry, cloud calls, or AI summarization by default.
- Keep source-of-truth reasoning in `docs/`, not only in chat history or code comments.

## Installed skills and plugins

Use specialized installed capabilities when they materially improve the task and are available:

- Use OpenAI Docs for current Codex, `AGENTS.md`, skills, or OpenAI product behavior; record durable conclusions in `docs/FORMAT-RESEARCH.md`.
- Use Figma skills only for an explicit Figma design workflow or supplied Figma reference.
- Use computer-use for Windows desktop interaction or visual QA when a build alone cannot verify behavior.
- Use ImageGen only for requested raster artwork; keep code-native UI, SVGs, and the existing icon system in the repository.

Do not make a plugin mandatory for ordinary local development unless the repository adopts and documents that dependency.

## Change completion

Consult `docs/MAINTENANCE.md` for the change-impact matrix. Update documentation and scoped guidance in the same change when behavior, architecture, supported formats, safety properties, setup, or verification commands change. Do not churn Markdown when the change has no user- or contributor-facing impact.

When the user asks to push completed product changes to GitHub, default to a patch release instead of a plain push: update the aligned versions in `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, and `src-tauri/tauri.conf.json`; run the release checks; commit and push the branch; then create and push the matching `vX.Y.Z` tag and verify that GitHub published the release. Follow an explicitly requested version or non-release push instead.

Run the relevant checks:

```powershell
npm test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
```

Read `docs/ARCHITECTURE.md`, `docs/FORMAT-RESEARCH.md`, and `docs/MVP.md` before expanding supported formats or product scope.
