# MVP boundary

## Product MVP

The smallest useful product is a trustworthy read-only map of project instruction sources:

1. add one or more local project folders and switch between them;
2. recursively discover supported files;
3. parse known metadata without discarding original content;
4. infer the filesystem scope hierarchy;
5. show repository context, the instruction hierarchy, selectable Markdown and skills, provenance, rendered content, and source preview;
6. surface recoverable parse/read problems without aborting the whole scan.

## First vertical slice implemented here

- Windows folder selection through Tauri's native dialog;
- a collapsible, persistent local project sidebar with add, remove, switch, and rescan actions;
- Rust filesystem walk with no symlink following and a small skip list;
- parsing for `AGENTS.md`, `AGENTS.override.md`, and `SKILL.md`;
- repository-oriented React explorer with all-files and Markdown-focused guidance modes, an adjustable split view, and rendered/raw-source views for AGENTS, SKILL, and other `.md` files;
- startup update checks with explicit, signed update installation from GitHub Releases;
- Rust unit tests for discovery, hierarchy, front matter, ignore behavior, and Markdown content boundaries.

## Explicitly deferred

- creating, editing, or removing files;
- effective-instruction merge previews;
- graph/workflow view;
- explicit relationship schemas;
- user-configurable ignore patterns, fallback names, themes, and layout;
- file watching and incremental rescans;
- application-data cloud services, telemetry, or AI-generated summaries.

## Acceptance criteria

- Adding, switching, removing, or rescanning a readable project does not modify its directory.
- Nested instruction files appear under their nearest containing ancestor.
- Every inferred edge is labeled as inferred.
- Valid skill `name`/`description` metadata is displayed; malformed metadata produces diagnostics and a usable fallback record.
- Case-insensitive `.md` files are selectable and readable; other ordinary file types remain non-interactive context entries.
- One unreadable or malformed source does not discard other results.
- Parser and discovery tests run without the desktop UI.
- A failed update check does not prevent local project use, and installing an available update requires explicit user action.
