---
name: develop-native-scanner
description: Implement or review AgentStudio Rust discovery, parsing, scope resolution, diagnostics, serialization, and Tauri filesystem commands. Use for changes under src-tauri/.
---

# Develop the native scanner

Read `src-tauri/AGENTS.md`, `docs/ARCHITECTURE.md`, and relevant tests in `src-tauri/src/scanner.rs` before editing.

## Invariants

- Preserve raw source text and unknown skill front matter.
- Keep recoverable per-file failures as diagnostics rather than aborting a safe partial scan.
- Keep traversal inside the selected root, do not follow symlinks, and retain intentional generated/dependency exclusions.
- Model directory ancestry as inferred scope, not explicit delegation or runtime orchestration.
- Keep Tauri commands narrow and DTOs serializable; update `src/model.ts` with contract changes.
- Do not add write operations until the safety design in `docs/ARCHITECTURE.md` is implemented and covered by preservation and recovery tests.

When a change depends on AGENTS or skill convention claims, also use `research-agent-formats` before encoding behavior.

## Finish

Add tests for every new convention and meaningful edge case. Run:

```powershell
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
npm test
npm run build
```

Use `maintain-project-guidance` when behavior, contracts, safety, or supported formats changed.
