# PCR Builder Agent Guide

This directory defines how agents construct, update, validate, and publish PCR records.

## Load Order

1. `builder/AGENTS.md`
2. `builder/agent-workflows/<task>.md`
3. `builder/tools/tiangong-lca-cli.md`
4. `builder/tools/data-sources-and-tools.md`
5. `builder/contracts/*.md`
6. `builder/vocab/*.yaml`
7. relevant `builder/method/*.md`
8. target PCR directory under `library/pcrs/**`

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

## Required Commands

Run before handoff:

```bash
npm run pcr:sync-structured -- --pcr <library/pcrs/...>
npm run validate
```

Run before publication or version lifecycle updates:

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
