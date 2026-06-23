---
title: TianGong LCA PCR Library README
docType: overview
scope: repo
status: draft
authoritative: true
owner: tiangong-lca-pcr
language: en
whenToUse:
  - when onboarding to the PCR library repository
  - when checking the repository layout or builder CLI entry points
whenToUpdate:
  - when repository layout changes
  - when builder CLI commands change
  - when public PCR consumption CLI or Agent skill behavior changes
  - when the scaffold status changes
checkPaths:
  - README.md
  - AGENTS.md
  - package.json
  - builder/**
  - packages/**
  - skills/**
  - .github/ISSUE_TEMPLATE/**
  - classifications/**
  - library/modules/**
  - docs/**
lastReviewedAt: 2026-06-23
lastReviewedCommit: 4b4fb01e69672a05ce3e63d7c8a31a263551a353
---

# TianGong LCA PCR Library

This repository stores TianGong LCA product category rules and modelling methodology assets.

PCR records are canonical methodology documents. Classification systems such as CPC, HS, ISIC, and NAICS are entry points that map to canonical PCR records; they do not own the PCR directory structure.

## Repository Shape

- `library/pcrs/`: canonical PCR markdown records grouped by TianGong methodology domains.
- `library/modules/`: reusable modelling method modules referenced by PCR records.
- `library/indexes/`: generated and maintained PCR indexes.
- `classifications/systems/`: source and normalized classification-system data.
- `classifications/mappings/`: mappings from external classification codes to canonical PCR ids.
- `builder/`: CLI, scripts, schemas, templates, controlled vocabularies, and builder documentation for constructing and validating the PCR library.
- `packages/pcr-core/`: shared library for reading PCR catalog, mapping, guidance, validation, and feedback draft data.
- `packages/tiangong-pcr-cli/`: public Agent-facing CLI for consuming PCR guidance during LCA model construction.
- `skills/tiangong-pcr/`: thin Agent skill for selecting PCRs, using guidance, validating drafts, and creating feedback.
- `.github/ISSUE_TEMPLATE/`: structured PCR feedback and missing-PCR issue forms.
- `docs/`: project-level architecture and authoring notes.

## PCR Record Shape

Each material PCR should use one directory with shared metadata, bilingual Markdown, and machine-readable rules:

```text
library/pcrs/<domain>/<subdomain>/<pcr-slug>/
  manifest.yaml
  pcr.en-US.md
  pcr.zh-CN.md
  structured.yaml
```

Material PCR content should use this authoring shape:

- reference flow definition with UUID-bearing product flow and category-specific required qualifiers
- measurement and unit rules for modelling consistency, conversion, and validation
- system boundary and allocation rules
- process inventory organized by process, then inputs/outputs, then product/waste/elementary flows
- data quality and validation rules
- selected Tiangong UUIDs without dataset versions
- external data sources for ranges, factors, official guidance, and non-default evidence

## Builder CLI

```bash
npm run init
npm run lint
npm run pcr:scaffold:cpc -- --source <cpc-structure.csv> --classification-version 3.0 --source-url <official-source-url>
npm run pcr:sync-structured -- --pcr <library/pcrs/...>
npm run pcr:bump -- --pcr <library/pcrs/...> --level patch
npm run pcr:publish -- --pcr <library/pcrs/...> --version <semver>
npm run validate
```

`pcr:scaffold:cpc` imports a CPC structure CSV, stores the raw and normalized classification data under `classifications/systems/cpc/<version>/`, writes a CPC-to-PCR mapping file, and creates empty bilingual PCR directories for leaf classes only. PCR directory names are semantic slugs, not CPC codes; the CPC code remains in the mapping layer and PCR metadata.

`pcr:sync-structured` regenerates `structured.yaml` from canonical Markdown. `pcr:bump` updates the manifest version lifecycle. `pcr:publish` syncs `structured.yaml` and marks the manifest publication state.

PCR authors may use `tiangong-lca-cli` to search Tiangong database flow/process/lifecyclemodel records and copy selected UUID references into PCR content. The CLI is an authoring evidence tool, not a runtime dependency of this repository.

Builder authoring docs live under `builder/docs/`. Start with `builder/AGENTS.md` for task routing and `builder/docs/index.md` for the compact documentation map.

## Public PCR CLI

Use `tiangong-pcr` when consuming PCRs to guide LCA `process` or `lifecyclemodel` construction:

```bash
npm run tiangong-pcr -- tree --depth 3 --format markdown
npm run tiangong-pcr -- list --status candidate --format json
npm run tiangong-pcr -- resolve --classification cpc:3.0:01111 --format json
npm run tiangong-pcr -- show --pcr <pcr-id> --lang zh-CN
npm run tiangong-pcr -- guidance --pcr <pcr-id> --format json
npm run tiangong-pcr -- validate-model --pcr <pcr-id> --input <model-file> --format json
npm run tiangong-pcr -- feedback draft --pcr <pcr-id> --type range_evidence_update --summary "<finding>"
```

The public CLI intentionally does not provide fuzzy search in the first version. Agents should use deterministic classification `resolve` when a code is available, otherwise use `tree` and `list` to inspect PCR hierarchy and choose a candidate from product meaning and modelling boundary.

## Initial Status

This repository is intentionally scaffold-first. It establishes the layout and contracts for CPC-backed PCR scaffold generation without treating the generated empty PCR files as reviewed PCR content.
