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
lastReviewedCommit: edd52008c4e9be4c9e6e2bdcd53b0f9dd7f8e99d
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
  pcr.en.md
  pcr.zh-CN.md
  structured.yaml
```

Rules:

- `manifest.yaml` owns language-independent PCR identity, title map, lifecycle status, content maturity, target entities, module references, and available languages.
- `pcr.en.md` and `pcr.zh-CN.md` are two language renderings of the same PCR record, not separate PCR records.
- `structured.yaml` owns machine-oriented PCR rules such as reference flow patterns, inventory flow patterns, and QA rules.
- Do not create parallel `pcrs/en/` and `pcrs/zh-CN/` directory trees.
- Do not use CPC, HS, ISIC, NAICS, or another external classification system as the canonical PCR directory tree.
- Do not include external classification codes in PCR directory names. Use semantic PCR slugs such as `wheat-seed`; keep CPC, HS, ISIC, NAICS, and similar codes in mappings and `classification_refs`.
- If a classification leaf maps to an existing PCR, update the mapping file instead of duplicating the PCR.

Reusable modules may use the same localized directory pattern:

```text
library/modules/<group>/<module-slug>/
  manifest.yaml
  module.en.md
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

Use:

```bash
npm run init
npm run lint
npm run pcr:scaffold:cpc -- --source <cpc-structure.csv> --classification-version 3.0 --source-url <official-source-url>
npm run validate
```

Command meanings:

- `init`: create required scaffold directories and repository guide files. It can also create a sample PCR directory with `node builder/cli/index.mjs init --sample-pcr <domain/path/slug> --pcr-id <id>`.
- `lint`: validate required directories and enforce that every PCR directory with `manifest.yaml` also has `pcr.en.md`, `pcr.zh-CN.md`, and `structured.yaml`.
- `pcr:scaffold:cpc`: import an official CPC structure CSV, normalize hierarchy files under `classifications/systems/cpc/<version>/`, create `classifications/mappings/cpc-<version>-to-pcr.yaml`, and create empty bilingual PCR directories for CPC leaf classes only. Generated PCR directories use semantic slugs and do not include CPC codes.
- `validate`: run `lint` and the builder CLI tests.

Generated PCR leaf scaffolds under `library/pcrs/**` are intentionally excluded from docpact coverage. The builder, classification sources, mappings, schemas, modules, and project documents remain governed.

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
