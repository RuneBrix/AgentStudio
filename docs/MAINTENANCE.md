# Change maintenance map

This map defines what to inspect when a change lands. It is a review checklist, not a requirement to edit every listed file.

| Change | Required code/tests | Documentation and guidance to inspect |
| --- | --- | --- |
| Supported filename, format, precedence, or discovery rule | Rust scanner/parser tests; serialized DTOs if affected | `docs/FORMAT-RESEARCH.md`, `docs/ARCHITECTURE.md`, `docs/MVP.md`, `README.md` current scope, native skill and scoped guidance |
| `ProjectScan`, `AgentNode`, skill, evidence, or diagnostic shape | Rust serialization tests; `src/model.ts`; all consumers | `docs/ARCHITECTURE.md`, frontend/native scoped guidance |
| New or changed Tauri command/capability | Rust command tests; capability configuration; frontend API wrapper | Architecture boundary and README safety posture; `CONTRIBUTING.md` if setup changes |
| Filesystem write, edit, or delete behavior | Preview/diff, stale-content, atomicity, preservation, and recovery tests | Architecture write strategy, MVP status, README safety posture, root/native guidance |
| Explorer interaction, layout, or visible terminology | Frontend build and focused behavior tests when logic warrants them | README screenshots/capability text if present, MVP behavior, frontend guidance |
| Dependency, toolchain, or development command | Lockfiles and clean-install/build verification | README setup, `CONTRIBUTING.md`, root/scoped verification commands |
| Updater, signing key, release target, or publishing workflow | Tauri plugins and capabilities; bundle configuration; frontend update state; release workflow | README release procedure, architecture network/safety boundary, MVP behavior, `CONTRIBUTING.md` |
| Repository skill or `AGENTS.md` change | Skill validator; `npm run check:guidance` | `docs/MAINTENANCE.md`, README contributor map, related `agents/openai.yaml` |
| Research-only clarification | Tests only if behavior changes | `docs/FORMAT-RESEARCH.md`; architecture/MVP only when the product decision changes |

## Documentation handler workflow

The documentation handler is the `maintain-project-guidance` skill plus the `docs/AGENTS.md` scope. It does not run in the background. Invoke it after a material change or during final review:

1. inspect the actual diff and identify affected rows above;
2. compare code behavior with existing claims;
3. make the smallest updates needed to restore accuracy;
4. keep current behavior, decisions, and future plans clearly separated;
5. validate guidance and run the checks relevant to the underlying code change.

A documentation-only edit does not require rebuilding the desktop application unless it changes embedded assets, build inputs, or contributor commands.
