# MVP boundary

## Product MVP

The smallest useful product is a trustworthy read-only map of project instruction sources:

1. add one or more local project folders and switch between them;
2. recursively discover supported files;
3. parse known metadata without discarding original content;
4. infer the filesystem scope hierarchy;
5. show the hierarchy, summaries, skills, provenance, readable Markdown, and source preview;
6. surface recoverable parse/read problems without aborting the whole scan.

## First vertical slice implemented here

- Windows folder selection through Tauri's native dialog;
- a collapsible, persistent local project sidebar with add, remove, switch, and rescan actions;
- Rust filesystem walk with no symlink following and a small skip list;
- parsing for `AGENTS.md`, `AGENTS.override.md`, and `SKILL.md`;
- deterministic summary extraction;
- scope-oriented React explorer with an adjustable split view, rendered Markdown, and raw-source modes;
- Rust unit tests for discovery, hierarchy, front matter, ignore behavior, and summaries.

## Explicitly deferred

- creating, editing, or removing files;
- effective-instruction merge previews;
- graph/workflow view;
- explicit relationship schemas;
- user-configurable ignore patterns, fallback names, themes, and layout;
- file watching and incremental rescans;
- cloud services, telemetry, or AI-generated summaries.

## Acceptance criteria

- Adding, switching, removing, or rescanning a readable project does not modify its directory.
- Nested instruction files appear under their nearest containing ancestor.
- Every inferred edge is labeled as inferred.
- Valid skill `name`/`description` metadata is displayed; malformed metadata produces diagnostics and a usable fallback record.
- One unreadable or malformed source does not discard other results.
- Parser and discovery tests run without the desktop UI.
