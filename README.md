# AgentStudio

AgentStudio is an open-source, local-first Windows desktop explorer for repository agent instructions and skills. It keeps a local sidebar of projects, scans the selected project without writing to it, and presents supported instruction sources within the surrounding repository structure.

## Current scope

Supported in the first slice:

- exact `AGENTS.md` and `AGENTS.override.md` files;
- case-insensitive `SKILL.md` files with YAML front matter;
- nearest-ancestor agent relationships inferred from filesystem scope;
- skill metadata (`name`, `description`, and unknown front-matter fields);
- a repository tree with an **All files** view for context and a **Guidance** view containing every Markdown file;
- selectable skill documents with metadata, diagnostics, rendered Markdown, and source views;
- selectable case-insensitive `.md` files with distinct AGENTS, SKILL, README, and Markdown icons plus read-only rendered/source views;
- a collapsible, persistent local project sidebar with add, remove, switch, and rescan actions;
- an adjustable split view between project structure and instruction content;
- rendered Markdown documents with an explicit read-only source view;
- non-fatal parse diagnostics;
- signed update checks against public GitHub Releases, with user-controlled installation.

Editing, deletion, graph visualization, and configuration are intentionally deferred. See [docs/MVP.md](docs/MVP.md).

## Local development

Prerequisites: Node.js 20+, Rust stable, and the [Tauri 2 Windows prerequisites](https://v2.tauri.app/start/prerequisites/).

```powershell
npm install
npm run tauri dev
```

Run the automated checks:

```powershell
npm test
cargo test --manifest-path src-tauri/Cargo.toml
npm run build
```

## Releases and updates

The installed app checks `RuneBrix/AgentStudio` GitHub Releases once at startup. A failed check is silent; when a newer signed version exists, the app offers to install it and restart. Project paths and scan results are never sent with this request.

Before the first release, add the ignored `.tauri/agentstudio.key` file contents as the repository secret `TAURI_SIGNING_PRIVATE_KEY`. Keep a secure backup: existing installations cannot trust future updates if the key is lost. For completed product changes, increment the patch version by default, align `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, and `src-tauri/tauri.conf.json`, commit them, and push a matching tag such as `v0.2.0`. The release workflow builds a Windows NSIS installer, publishes the GitHub Release, and exposes its generated `latest.json` to installed apps.

## Safety posture

The current application exposes one project-data command, `scan_project`. It canonicalizes and reads the selected directory but has no project write command. The updater can replace the installed application only after Tauri verifies the release signature and the user chooses to install it. UI copy must not imply that an inferred relationship was declared by the source files.

## Project documents

- [Architecture and data model](docs/ARCHITECTURE.md)
- [Format research and uncertainties](docs/FORMAT-RESEARCH.md)
- [MVP boundary](docs/MVP.md)
- [Change maintenance map](docs/MAINTENANCE.md)
- [Contributing](CONTRIBUTING.md)

## Agent-assisted development

The repository contains scoped `AGENTS.md` guidance for the React frontend, Rust/Tauri core, documentation, and repository skills. Reusable project workflows live under [`skills/`](skills/):

- frontend explorer development;
- native scanner and parser development;
- agent/skill format research;
- documentation and guidance maintenance.

These files guide contributors and coding agents; they do not define independently runnable product agents. Run `npm run check:guidance` after changing them.

## License

MIT
