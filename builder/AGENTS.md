# PCR Builder Agent Guide

This directory defines how agents construct, update, validate, and publish PCR records.

## Non-Negotiable Rules

- Treat `pcr.en-US.md` as the canonical authored source.
- Treat `pcr.zh-CN.md` as the aligned Chinese rendering of the same PCR.
- Treat `structured.yaml` as generated output. Regenerate it with `npm run pcr:sync-structured -- --pcr <library/pcrs/...>`.
- Do not hand-edit generated structured projections except when changing the projection generator itself.
- Store Tiangong UUID references without dataset versions.
- Do not put CLI lookup traces, search logs, review notes, API keys, session paths, or private runtime details in PCR Markdown or `structured.yaml`.
- Do not list Tiangong database rows in `Data Sources` when they only support UUID identity. Tiangong is the default source for UUID-bearing rows.
- List external literature, official guidance, standards, methods, and non-default quantitative evidence in `Data Sources`.
- Keep classification codes in `classifications/mappings/**` and `classification_refs`, not in canonical PCR directory names.
- During create workflows, common sense may initialize candidate processes, qualifiers, and likely flows, but UUIDs and quantitative ranges must be evidence-backed before they are treated as final PCR content.
- During update workflows, identify the driving input first, such as a user requirement, source document, data file, reviewer request, or Tiangong database alignment change.

## Context Routing

Read only the route needed for the task. Do not load every builder document by default.

For create PCR work:

- read `builder/docs/workflows/create-pcr.md`
- read `builder/docs/tools/tiangong-lca-cli.md` when UUID lookup is needed
- read `builder/docs/tools/data-sources-and-tools.md` when choosing source evidence
- read `builder/docs/contracts/pcr-markdown-contract.md` and `builder/docs/contracts/evidence-and-source-contract.md`
- read specific `builder/docs/methods/**` files only when the workflow references that method topic

For update PCR work:

- read `builder/docs/workflows/update-pcr.md`
- inspect the source/input that drives the update before editing
- read only contracts for the changed surface, such as manifest, Markdown, structured projection, evidence, or UUID references

For translation, review, or publish work:

- read the matching file under `builder/docs/workflows/`
- read only the contracts named by that workflow

For feedback issue intake or accepted feedback updates:

- read `builder/docs/workflows/intake-feedback-issue.md`
- if actionable, read `builder/docs/workflows/update-pcr-from-feedback.md`
- inspect the issue body or feedback draft before editing
- inspect public CLI files under `packages/**` only when feedback concerns consumption behavior rather than PCR methodology

For classification scaffold or mapping work:

- read `docs/classification-policy.md`
- inspect the affected files under `classifications/systems/**` or `classifications/mappings/**`
- inspect `builder/schemas/classification-mapping.schema.json` when mapping shape changes
- inspect `builder/cli/`, `builder/scripts/`, or `builder/templates/` only when scaffold generation behavior changes

For CLI, schema, template, or scaffold behavior changes:

- read `builder/README.md`
- inspect the affected files under `builder/cli/`, `builder/scripts/`, `builder/schemas/`, `builder/templates/`, or `builder/vocab/`
- update `builder/docs/**` only when behavior changes the authoring contract

For public PCR consumption CLI or skill changes:

- inspect `packages/pcr-core/`, `packages/tiangong-pcr-cli/`, `skills/tiangong-pcr/`, and `.github/ISSUE_TEMPLATE/`
- keep `builder/cli/` focused on PCR library maintenance
- update repo-level docs when the consumption boundary or commands change

## Required Commands

For PCR content changes, run before handoff:

```bash
npm run pcr:sync-structured -- --pcr <library/pcrs/...>
npm run validate
```

For builder CLI, schema, template, vocab, docs, classification, or mapping changes, run before handoff:

```bash
npm run validate
```

For publication or version lifecycle updates, run the relevant lifecycle command:

```bash
npm run pcr:bump -- --pcr <library/pcrs/...> --level patch
npm run pcr:publish -- --pcr <library/pcrs/...> --version <semver>
```

## Quality Bar

An authored PCR is not acceptable unless:

- reference flow is represented as one `Field | Value` table with required qualifiers
- measurement and unit rules constrain only modelling consistency, conversion, or validation behavior
- process inventory is organized by process, direction, flow type, and individual flow row
- range, basis, evidence, and source references follow the controlled vocabularies
- quantitative ranges, factors, boundary rules, and allocation rules cite non-default evidence when they constrain modelling choices
- bilingual Markdown files describe the same rule
- `structured.yaml` reflects the canonical Markdown after sync
