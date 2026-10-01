# Native scanner guidance

This scope owns Rust discovery, parsing, relationship resolution, diagnostics, and the Tauri boundary. Use `skills/develop-native-scanner/SKILL.md` for native work and add `skills/research-agent-formats/SKILL.md` when format conventions are involved.

## Focus

- Keep Tauri commands narrow and return serializable, version-neutral DTOs.
- Preserve raw file content and unknown skill metadata.
- Treat malformed or unreadable individual sources as diagnostics where a safe partial scan is possible.
- Do not follow symlinks or escape the selected root during discovery.
- Label filesystem-scope relationships as inferred. Do not infer runtime delegation from prose or directory nesting.
- Keep writes absent until the documented preview, explicit-action, stale-content, atomic-replace, formatting-preservation, and recoverable-delete requirements are implemented and tested.

## Change obligations

- Add or update parser/discovery tests for every supported convention and edge case.
- If serialized fields change, update `src/model.ts` and frontend consumers in the same change.
- If supported filenames, precedence, ignore behavior, safety, or format assumptions change, update `docs/FORMAT-RESEARCH.md`, `docs/ARCHITECTURE.md`, `docs/MVP.md`, and the README where applicable.
- Run `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`, `npm test`, and `npm run build` for contract changes.
