# Contributing

Thank you for helping make agent configuration easier to understand.

1. Install Node.js, Rust stable, and the Tauri 2 Windows prerequisites.
2. Run `npm install`.
3. Run `npm test`, `npm run build`, and the Rust formatter check from `AGENTS.md` before opening a pull request.
4. Add parser/discovery fixtures or unit tests for any new convention.
5. Do not convert inferred relationships into explicit ones without source evidence.
6. Any filesystem write feature must include a user-visible preview, stale-content protection, and preservation tests.

Releases are built by `.github/workflows/release.yml` from `v*` tags. Keep the versions in `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json` aligned with the tag. The repository secret `TAURI_SIGNING_PRIVATE_KEY` must contain the ignored `.tauri/agentstudio.key`; never commit or replace that key after distributing an updater-enabled build.

Architecture decisions belong in `docs/` so a later contributor or Codex session can recover the reasoning without relying on chat history.

Before editing a subtree, read its nearest `AGENTS.md`. Use the matching workflow under `skills/` for frontend, native scanner, format-research, or documentation-maintenance tasks. Consult `docs/MAINTENANCE.md` before finishing a material change.
