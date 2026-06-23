# PCR Library Builder

This directory contains construction methods, templates, schemas, fixtures, and CLI tools for maintaining the PCR library.

The builder treats classification systems as inputs and mappings. It does not make PCR records subordinate to any one classification system.

## Agent Authoring System

Agent-facing PCR production assets are organized as:

```text
builder/AGENTS.md
builder/agent-workflows/
builder/contracts/
builder/vocab/
builder/method/
builder/tools/
builder/prompts/
```

- `builder/AGENTS.md` is the local agent entrypoint and hard-rule layer.
- `agent-workflows/` contains task runbooks for creating, updating, translating, reviewing, and publishing PCRs.
- `contracts/` defines durable authoring contracts for Markdown, manifest, structured projection, evidence, and UUID references.
- `vocab/` contains controlled vocabularies intended for future lint enforcement.
- `method/` contains reusable modelling method notes that support the contracts.
- `tools/` explains authoring-time tools, Tiangong CLI lookup, and usable evidence sources.
- `prompts/` contains thin entry prompts for Codex, Claude Code, and PCR reviewers.

## Builder CLI

```bash
npm run init
npm run lint
npm run pcr:sync-structured -- --pcr <library/pcrs/...>
npm run pcr:bump -- --pcr <library/pcrs/...> --level patch
npm run pcr:publish -- --pcr <library/pcrs/...> --version <semver>
npm run validate
```

- `init` creates required scaffold directories and guide files.
- `lint` checks required repository paths and bilingual PCR directory completeness.
- `pcr:sync-structured` regenerates `structured.yaml` from canonical PCR Markdown tables.
- `pcr:bump` updates manifest version lifecycle fields.
- `pcr:publish` syncs structured output and marks the manifest publication state.
- `validate` runs lint plus tests.

Generated PCR scaffolds use the current authoring skeleton:

- process inventory organized by process, then inputs/outputs, then product/waste/elementary flows
- UUID-only Tiangong references in PCR Markdown
- external data sources for literature, standards, official guidance, and non-default range evidence

Create workflows may use common sense to initialize candidate processes and likely flow lists, but final UUIDs and quantitative constraints must be backed by Tiangong lookup or cited sources. Update workflows are input-driven and should start from the specific user request, source file, reviewer comment, dataset, or database alignment change that motivates the edit.

The direct CLI entry point is:

```bash
node builder/cli/index.mjs <command>
```
