# PCR Library Builder

This directory contains CLI tools, schemas, templates, fixtures, controlled vocabularies, and authoring documentation for maintaining the PCR library.

The builder treats classification systems as inputs and mappings. It does not make PCR records subordinate to any one classification system.

Public PCR consumption tools live under `packages/` and `skills/`. Do not add Agent-facing model-construction commands to `builder/cli/`; keep this directory focused on creating, updating, validating, and publishing PCR records.

## Directory Shape

Machine-facing and execution-facing assets stay directly under `builder/`. Human and agent documentation lives under `builder/docs/`.

```text
builder/AGENTS.md
builder/cli/
builder/scripts/
builder/schemas/
builder/templates/
builder/fixtures/
builder/vocab/
builder/docs/
  index.md
  workflows/
  contracts/
  methods/
  tools/
  prompts/
```

- `builder/AGENTS.md` is the local agent routing and hard-rule entrypoint.
- `builder/docs/index.md` is the human-readable builder documentation map.
- `builder/docs/workflows/` contains task runbooks for creating, updating, translating, reviewing, and publishing PCRs.
- `builder/docs/contracts/` defines durable authoring contracts for Markdown, manifest, structured projection, evidence, and UUID references.
- `builder/docs/methods/` contains reusable modelling method notes that support the contracts.
- `builder/docs/tools/` explains authoring-time tools, Tiangong CLI lookup, and usable evidence sources.
- `builder/docs/prompts/` contains thin entry prompts for Codex, Claude Code, and PCR reviewers.
- `builder/vocab/` contains controlled vocabularies intended for lint and CLI consumption.

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

- language-specific Markdown templates: `builder/templates/pcr.en-US.md.hbs` and `builder/templates/pcr.zh-CN.md.hbs`
- process inventory organized by process, then inputs/outputs, then product/waste/elementary flows
- UUID-only Tiangong references in PCR Markdown
- external data sources for literature, standards, official guidance, and non-default range evidence

Create workflows may use common sense to initialize candidate processes and likely flow lists, but final UUIDs and quantitative constraints must be backed by Tiangong lookup or cited sources. Update workflows are input-driven and should start from the specific user request, source file, reviewer comment, dataset, or database alignment change that motivates the edit.

The direct CLI entry point is:

```bash
node builder/cli/index.mjs <command>
```
