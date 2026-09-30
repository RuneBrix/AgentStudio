# Architecture and data model

Status: accepted for the first vertical slice (2026-09-30).

## Shape

AgentStudio is a Tauri 2 application with a React/TypeScript presentation layer and a small Rust core.

```text
Folder picker (Tauri plugin)
        |
        v
scan_project command
        |
        +-- discovery (walk, ignore policy, read diagnostics)
        +-- format adapters (AGENTS.md, SKILL.md)
        +-- relationship resolver (filesystem scope)
        |
        v
version-neutral ProjectScan DTO
        |
        v
React explorer + read-only source detail
```

The native boundary owns filesystem access. React receives serializable data and does not receive a broad filesystem capability. No write command exists in the MVP.

## Core model

`ProjectScan` is a scan snapshot:

- `root` and `projectName` identify the selected project;
- `agents` is a nested list of `AgentNode` records;
- `unscopedSkills` holds skills with no containing agent instruction scope;
- `diagnostics` reports recoverable filesystem errors;
- `scannedFiles` supports basic scan feedback.

`AgentNode` represents an instruction source, not a running AI agent. It preserves `rawContent`, has a filesystem `scope`, contains associated skills and child nodes, and records the evidence behind its parent relationship.

`SkillDefinition` preserves its raw file and all YAML front matter as an open object. Known fields are projected into `name` and `description`; unknown fields remain available for future adapters.

`Evidence` makes provenance visible. The MVP emits `inferred` only: nesting is based on the nearest ancestor directory containing an `AGENTS.md` source. Future explicit links must be modeled separately rather than silently folded into the same edge.

## Adapter direction

Discovery recognizes paths; parsers interpret files; the resolver creates relationships. Keeping these stages conceptually separate lets later contributors add a `FormatAdapter` trait for other agent or skill formats without coupling them to the UI.

A later extraction should use an interface along these lines:

```rust
trait FormatAdapter {
    fn recognizes(&self, path: &Path) -> bool;
    fn parse(&self, root: &Path, path: &Path) -> Result<SourceRecord, Diagnostic>;
}
```

The MVP keeps the implementation in one module while the behavior and tests settle. Split modules when a second format is introduced, not pre-emptively.

## Editing strategy (deferred)

Editing must start from the original bytes/text and apply the smallest user-approved change. Do not regenerate an entire Markdown document from an abstract syntax tree. Before adding writes:

1. expose an explicit preview/diff;
2. re-read and compare a content hash to prevent overwriting concurrent edits;
3. use an atomic same-directory temporary file and replace;
4. preserve newline style, front-matter key order where possible, and unrelated prose;
5. make deletion recoverable (Recycle Bin) and separately confirmed.

## Decisions

- Rust performs discovery because it is the trusted native boundary and can later support safe writes.
- Raw source is first-class because round-trip preservation is a product requirement.
- Summaries are deterministic local extracts, not AI-generated text. This keeps scans private, fast, and reproducible.
- Generated/dependency folders (`.git`, `node_modules`, `target`, `.next`, `dist`) are skipped. Configurable ignore rules are deferred.
- Symlinks are not followed, preventing accidental traversal outside the selected project and cycles.
