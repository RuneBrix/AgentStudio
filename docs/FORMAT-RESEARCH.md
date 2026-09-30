# Format research and uncertainties

Research date: 2026-09-30.

## Established behavior used by the MVP

OpenAI's Codex guidance describes `AGENTS.md` as directory-scoped instructions loaded from the repository root toward the current working directory. Deeper instructions are later in the chain and can override earlier guidance. It also documents `AGENTS.override.md` as a possible selected source while retaining the directory scope in the injected heading.

OpenAI's Skills documentation defines a skill as a directory centered on a `SKILL.md` manifest containing YAML front matter and Markdown instructions. `name` and `description` are the discovery metadata, supporting files may live alongside it, matching `SKILL.md` is case-insensitive, and unknown workflow material can include `references/`, `scripts/`, and `assets/`.

Sources:

- [OpenAI: Codex AGENTS.md loading behavior](https://developers.openai.com/api/docs/guides/latest-model#using-agentsmd)
- [OpenAI: Skills](https://developers.openai.com/api/docs/guides/tools-skills)

## Deliberately conservative interpretation

`AGENTS.md` is free-form Markdown, not a declaration of an executable subagent. AgentStudio therefore calls each file an “instruction source” internally and infers a parent/child view only from directory containment. The UI labels that edge as inferred.

The MVP recognizes only:

- exact-case `AGENTS.md` and `AGENTS.override.md` filenames;
- case-insensitive `SKILL.md` filenames;
- `name` and `description` strings in skill YAML front matter.

It does not interpret headings, prose links, or words such as “delegate” as machine-readable relationships.

## Ambiguities we must not assume

1. **“Agent” identity.** An `AGENTS.md` file configures work in a scope; it does not necessarily define a named or independently runnable agent.
2. **Parent/child semantics.** Directory nesting establishes applicable instruction scope, not delegation, orchestration, or a runtime handoff.
3. **Sibling or cross-tree relationships.** Free-form Markdown may mention other folders or agents, but there is no documented link schema to parse reliably.
4. **Summary fields.** `AGENTS.md` has no required title or purpose property. The MVP extracts the first prose paragraph and labels it as inferred.
5. **Override precedence details.** A directory containing both base and override files needs a deliberate product representation. The MVP discovers both rather than claiming an effective merged result.
6. **Fallback filenames and size limits.** Codex may be configured with fallback names and a byte cap. Those values are environment configuration, not repository-wide constants, so the MVP does not guess them.
7. **Skill placement.** Skills can be made available through several capability/plugin mechanisms. Mere physical containment does not prove an explicit association with an `AGENTS.md`; AgentStudio presents nearest-scope association as inferred.
8. **Skill front-matter evolution.** Beyond `name` and `description`, fields and product-specific extensions can evolve. Unknown YAML is preserved and not rejected.
9. **Ignore behavior.** Codex discovery behavior and `.gitignore` interaction are not treated as a universal standard. The MVP's skip list is an application performance/safety policy.
10. **Case sensitivity for AGENTS files.** The official material establishes case-insensitive skill matching but not equivalent AGENTS matching. The MVP stays exact.

These unknowns are reasons to keep provenance and raw source in the model, and to add format adapters rather than baking assumptions into view components.
