# AgentStudio

AgentStudio is an open-source, local-first Windows desktop explorer for repository agent instructions and skills. It keeps a local sidebar of projects, scans the selected project without writing to it, and presents supported instruction sources as a readable filesystem scope hierarchy.

## Current scope

Supported in the first slice:

- exact `AGENTS.md` and `AGENTS.override.md` files;
- case-insensitive `SKILL.md` files with YAML front matter;
- nearest-ancestor agent relationships inferred from filesystem scope;
- skill metadata (`name`, `description`, and unknown front-matter fields);
- a collapsible, persistent local project sidebar with add, remove, switch, and rescan actions;
- an adjustable split view between project structure and instruction content;
- rendered Markdown guidance with an explicit read-only source view;
- non-fatal parse diagnostics.

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

## Safety posture

The current application exposes one Rust command, `scan_project`. It canonicalizes and reads the selected directory but has no write command. UI copy must not imply that an inferred relationship was declared by the source files.

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
