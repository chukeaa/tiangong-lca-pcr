---
title: TianGong LCA PCR Library Agent Guide
docType: contract
scope: repo
status: draft
authoritative: true
owner: tiangong-lca-pcr
language: en
whenToUse:
  - when working in the PCR library repository
  - when changing PCR identity, classification mapping, builder, or validation contracts
whenToUpdate:
  - when PCR directory contracts change
  - when classification mapping or builder CLI behavior changes
  - when repository validation expectations change
checkPaths:
  - AGENTS.md
  - README.md
  - .docpact/config.yaml
  - package.json
  - builder/**
  - classifications/**
  - library/modules/**
  - docs/**
lastReviewedAt: 2026-06-23
lastReviewedCommit: f2383cbcc512f42291b6d8e2d575a378fd00fc78
---

# AGENTS.md - TianGong LCA PCR Library

This repository owns canonical PCR and modelling methodology assets for TianGong LCA data authoring.

## Boundaries

- PCR files are classification-independent methodology records.
- Classification systems map to PCR records through `classifications/mappings/`.
- Do not duplicate PCR records only because a new classification system is added.
- Keep reusable method rules in `library/modules/` and category-specific rules in `library/pcrs/`.
- Builder scripts must not depend on private workspace state.

## PCR Directory Contract

Canonical PCR identity is directory-based. Each PCR record must use one directory with shared metadata, structured rules, and bilingual Markdown:

```text
library/pcrs/<domain>/<subdomain>/<pcr-slug>/
  manifest.yaml
  pcr.en-US.md
  pcr.zh-CN.md
  structured.yaml
```

Rules:

- `manifest.yaml` owns language-independent PCR identity, title map, lifecycle status, content maturity, target entities, module references, and available languages.
- `pcr.en-US.md` and `pcr.zh-CN.md` are two language renderings of the same PCR record, not separate PCR records.
- `structured.yaml` is the machine-oriented projection of the canonical Markdown PCR. It carries reference flow definitions, measurement rules, process inventories, validation-facing fields, and external data sources without authoring trace logs.
- Do not create parallel `pcrs/en/` and `pcrs/zh-CN/` directory trees.
- Do not use CPC, HS, ISIC, NAICS, or another external classification system as the canonical PCR directory tree.
- Do not include external classification codes in PCR directory names. Use semantic PCR slugs such as `wheat-seed`; keep CPC, HS, ISIC, NAICS, and similar codes in mappings and `classification_refs`.
- If a classification leaf maps to an existing PCR, update the mapping file instead of duplicating the PCR.

Reusable modules may use the same localized directory pattern:

```text
library/modules/<group>/<module-slug>/
  manifest.yaml
  module.en-US.md
  module.zh-CN.md
  structured.yaml
```

Legacy single-file module stubs under `library/modules/core/*.md` are scaffold placeholders and should be migrated to the directory pattern when their content becomes material.

## Classification Mapping Contract

Classification data and mappings live outside canonical PCR records:

```text
classifications/systems/<system>/<version>/
classifications/mappings/<system>-<version>-to-pcr.yaml
```

Mapping files are the authoritative link from external classification codes to canonical PCR ids. Mapping relation types should include `exact`, `broader`, `narrower`, `proxy`, and `manual_review`.

## Builder CLI

The builder CLI lives under `builder/cli/`.

Agent-facing PCR production guidance lives under `builder/`. Read `builder/AGENTS.md` before using `builder/agent-workflows/**`, `builder/tools/**`, `builder/contracts/**`, `builder/vocab/**`, or `builder/prompts/**`.

Use:

```bash
npm run init
npm run lint
npm run pcr:scaffold:cpc -- --source <cpc-structure.csv> --classification-version 3.0 --source-url <official-source-url>
npm run pcr:sync-structured -- --pcr <library/pcrs/...>
npm run pcr:bump -- --pcr <library/pcrs/...> --level patch
npm run pcr:publish -- --pcr <library/pcrs/...> --version <semver>
npm run validate
```

Command meanings:

- `init`: create required scaffold directories and repository guide files. It can also create an optional PCR scaffold directory with `node builder/cli/index.mjs init --sample-pcr <domain/path/slug> --pcr-id <id>`.
- `lint`: validate required directories and enforce that every PCR directory with `manifest.yaml` also has `pcr.en-US.md`, `pcr.zh-CN.md`, and `structured.yaml`.
- `pcr:scaffold:cpc`: import an official CPC structure CSV, normalize hierarchy files under `classifications/systems/cpc/<version>/`, create `classifications/mappings/cpc-<version>-to-pcr.yaml`, and create empty bilingual PCR directories for CPC leaf classes only. Generated PCR directories use semantic slugs and do not include CPC codes.
- `pcr:sync-structured`: parse canonical `pcr.en-US.md` tables and regenerate `structured.yaml` as a UUID-only projection.
- `pcr:bump`: update the PCR manifest version and `updated_at_utc` lifecycle field.
- `pcr:publish`: run `pcr:sync-structured`, mark the PCR manifest as published, and set manifest version and publication timestamps.
- `validate`: run `lint` and the builder CLI tests.

Generated PCR leaf scaffolds under `library/pcrs/**` are intentionally excluded from docpact coverage. The builder, classification sources, mappings, schemas, modules, and project documents remain governed.

## PCR Authoring Evidence

Material PCR Markdown should organize inventories by common process first, then by input/output direction, then by flow type (`product`, `waste`, `elementary`), and finally by individual flow rows.

When Tiangong database references are used, prefer the `tiangong-lca` CLI as the authoring evidence tool:

```bash
tiangong-lca search flow --input ./search-flow.request.json --json
tiangong-lca search process --input ./search-process.request.json --json
tiangong-lca flow get --id <flow-id> --json
```

PCR content stores selected Tiangong UUIDs without dataset versions. Do not include CLI command traces, search logs, API keys, session files, or private runtime details in PCR Markdown or `structured.yaml`. The Tiangong database is the default source for UUID-bearing references, so list only external literature, standards, official guidance, or other non-default evidence in `Data Sources`.

For create workflows, common sense may initialize candidate processes, likely flows, qualifiers, and search terms, but UUIDs and quantitative constraints require Tiangong lookup or external evidence before they are final. For update workflows, identify the driving input first, then update only the affected PCR files, source ids, structured projection, and manifest lifecycle metadata.

## Default Load Order

1. `AGENTS.md`
2. `README.md`
3. `docs/architecture.md`
4. `docs/authoring-guide.md`
5. target PCR, module, schema, or mapping file

## Validation

Run the local validation entry point before handoff when files in this repo change:

```bash
npm run validate
```
