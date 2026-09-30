# MVP boundary

## Product MVP

The smallest useful product is a trustworthy read-only map of project instruction sources:

1. choose a local folder;
2. recursively discover supported files;
3. parse known metadata without discarding original content;
4. infer the filesystem scope hierarchy;
5. show the hierarchy, summaries, skills, provenance, and source preview;
6. surface recoverable parse/read problems without aborting the whole scan.

## First vertical slice implemented here

- Windows folder selection through Tauri's native dialog;
- Rust filesystem walk with no symlink following and a small skip list;
- parsing for `AGENTS.md`, `AGENTS.override.md`, and `SKILL.md`;
- deterministic summary extraction;
- hierarchical React explorer and detail panel;
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

- Selecting a readable project produces a scan without modifying it.
- Nested instruction files appear under their nearest containing ancestor.
- Every inferred edge is labeled as inferred.
- Valid skill `name`/`description` metadata is displayed; malformed metadata produces diagnostics and a usable fallback record.
- One unreadable or malformed source does not discard other results.
- Parser and discovery tests run without the desktop UI.
