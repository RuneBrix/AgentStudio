# AgentStudio contributor guidance

AgentStudio is a local-first Tauri 2 + React application for understanding repository agent instruction files and skills.

## Architectural boundaries

- Keep filesystem discovery, parsing, and any future writes in Rust behind narrow Tauri commands.
- Keep the React layer focused on presentation and explicit user actions.
- Treat `AGENTS.md` as a filesystem-scoped instruction source, not proof of a runnable subagent.
- Preserve raw source and unknown metadata. Never silently turn inferred relationships into explicit ones.
- Do not add project-file writes without a preview, explicit confirmation, concurrent-change protection, and preservation tests.
- Prefer deterministic local behavior; do not add telemetry, cloud calls, or AI summarization by default.

## Verification

Run these checks after relevant changes:

```powershell
npm test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
```

Read `docs/ARCHITECTURE.md`, `docs/FORMAT-RESEARCH.md`, and `docs/MVP.md` before expanding the supported formats or product scope.
