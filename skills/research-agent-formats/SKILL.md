---
name: research-agent-formats
description: Research and document agent-instruction or skill conventions before AgentStudio changes its supported formats, parser assumptions, precedence, or relationship semantics.
---

# Research agent formats

Use this skill before encoding a new `AGENTS.md`, skill, plugin, or related convention.

## Method

1. State the exact behavior the product needs to decide.
2. Prefer current authoritative specifications or product documentation. For OpenAI or Codex behavior, use the installed OpenAI Docs skill when available.
3. Separate documented facts from AgentStudio policy, inference, and unresolved ambiguity.
4. Record the research date and direct sources in `docs/FORMAT-RESEARCH.md`.
5. Choose the narrowest parser behavior supported by evidence. Preserve unknown fields and raw source when the format can evolve.

Do not infer named agents, delegation, workflows, or cross-tree links from free-form prose. Do not turn one tool's configurable fallback names, size limits, or directory conventions into a universal standard.

## When research changes behavior

Combine this skill with `develop-native-scanner`, add fixtures or tests, and inspect the README, architecture, MVP, frontend terminology, and scoped guidance using `docs/MAINTENANCE.md`.

If research does not justify a product change, document the uncertainty without changing the parser.
