---
title: PCR Library Architecture
docType: reference
scope: repo
status: draft
authoritative: true
owner: tiangong-lca-pcr
language: en
whenToUse:
  - when changing canonical PCR identity, classification source handling, mappings, or modules
  - when deciding whether a classification system should create PCR records or mapping records
whenToUpdate:
  - when PCR directory structure changes
  - when classification import or mapping architecture changes
  - when generated scaffold governance changes
  - when public PCR consumption CLI, Agent skill, or feedback intake architecture changes
checkPaths:
  - docs/architecture.md
  - AGENTS.md
  - README.md
  - .docpact/config.yaml
  - builder/**
  - packages/**
  - skills/**
  - .github/ISSUE_TEMPLATE/**
  - classifications/**
  - library/modules/**
lastReviewedAt: 2026-06-23
lastReviewedCommit: 4b4fb01e69672a05ce3e63d7c8a31a263551a353
---

# Architecture

The PCR library separates canonical PCR records from classification systems.

```text
classification code -> mapping -> canonical PCR -> modules -> rendered PCR
```

Canonical PCR records live under `library/pcrs/`. Classification source data and mappings live under `classifications/`.

Builder assets under `builder/` separate implementation from documentation. CLI, scripts, schemas, templates, fixtures, and vocabularies stay directly under `builder/`; human and agent documentation lives under `builder/docs/`. `builder/AGENTS.md` provides task routing, while `builder/docs/index.md` maps workflows, contracts, methods, tools, and prompts.

Public PCR consumption is a separate layer. `packages/pcr-core/` reads the library, classification mappings, Markdown, and generated `structured.yaml`. `packages/tiangong-pcr-cli/` exposes catalog browsing, deterministic classification resolution, PCR display, Agent guidance, model validation, and feedback drafting. `skills/tiangong-pcr/` teaches agents how to use the CLI without copying PCR rules.

For CPC-backed bootstrapping, the builder stores the official source file and normalized hierarchy under `classifications/systems/cpc/<version>/`, then writes an explicit mapping file under `classifications/mappings/`. The CPC hierarchy seeds the initial PCR scaffold, but the generated PCR directory remains the canonical PCR identity.

PCR directory slugs must not embed external classification codes. A CPC leaf such as `01111 Wheat, seed` maps to a semantic PCR directory such as `wheat-seed`; `01111` stays in `classifications/mappings/` and `classification_refs`.

PCR records use a directory-level bilingual structure:

```text
library/pcrs/<domain>/<subdomain>/<pcr-slug>/
  manifest.yaml
  pcr.en-US.md
  pcr.zh-CN.md
  structured.yaml
```

This keeps one PCR identity while allowing English and Chinese markdown renderings to coexist.

Within one PCR identity, machine-facing rules are projected from canonical Markdown into `structured.yaml`. The projection carries the reference flow definition, measurement and unit rules, and process inventory. Inventory rules are process-oriented: a PCR describes common modelling processes, then each process separates `inputs` and `outputs`, then separates `product`, `waste`, and `elementary` flows. Public CLI `guidance` reads this projection; it must not become a separate source of PCR truth.

Database-backed references are not classification identity. PCR Markdown records selected Tiangong UUIDs without dataset versions, and `structured.yaml` is regenerated as the machine projection of those Markdown tables. CLI command traces and lookup logs are authoring-time evidence and do not belong in PCR content. External classification codes still belong in the mapping layer.

Create workflows can start from common-sense product knowledge to initialize candidate process structures, but final UUIDs and quantitative modelling constraints require Tiangong lookup or cited evidence. Update workflows are input-driven and should preserve unaffected PCR content while applying a specific source, file, reviewer, user, classification, or database-alignment change.

Feedback intake closes the consumption loop. Agents and humans can use `.github/ISSUE_TEMPLATE/` or `tiangong-pcr feedback draft` to record missing PCRs, mapping gaps, unclear reference flows, UUID issues, range evidence updates, validation-rule issues, translations, and source updates. These records are candidate evidence until maintainers intake and merge a PCR change.

Generated leaf PCR scaffolds may remain empty until reviewed methodology content is authored. Governance and docpact checks cover the builder, mappings, modules, and project contracts; generated `library/pcrs/**` content is excluded until those PCR files become material authored records.
