# Repository skill guidance

Skills in this directory teach repeatable AgentStudio development workflows. They are not product runtime code and must not grant authority beyond the user's task.

- Keep each skill's activation description narrow and discriminating.
- Put essential project-specific decisions in `SKILL.md`; link to maintained project documents instead of duplicating them.
- Preserve automatic discovery unless a user explicitly requests explicit-only invocation.
- Keep `agents/openai.yaml` display text and default prompt consistent with `SKILL.md`.
- Do not add placeholder resource directories or copied external manuals.
- Validate every changed skill with the skill-creator validator and run `npm run check:guidance`.
