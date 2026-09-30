# AgentStudio

AgentStudio is an open-source, local-first Windows desktop explorer for repository agent instructions and skills. The first vertical slice lets you choose a project folder, scans it without writing to it, parses supported files, and presents the resulting scope hierarchy.

## Current scope

Supported in the first slice:

- exact `AGENTS.md` and `AGENTS.override.md` files;
- case-insensitive `SKILL.md` files with YAML front matter;
- nearest-ancestor agent relationships inferred from filesystem scope;
- skill metadata (`name`, `description`, and unknown front-matter fields);
- read-only source previews and non-fatal parse diagnostics.

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
- [Contributing](CONTRIBUTING.md)

## License

MIT
