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
lastReviewedCommit: 0778c96b0faa23026da60a6c0ac232c9ba333772
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

## Builder CLI and Authoring Docs

The builder CLI lives under `builder/cli/`.

Agent-facing PCR production guidance lives under `builder/`. Use `builder/AGENTS.md` for task routing and hard rules, then use `builder/docs/index.md` to choose the smallest relevant workflow, contract, tool note, method note, or prompt.

CLI commands and command meanings are documented in `builder/README.md`. Keep detailed CLI usage there instead of duplicating it in this repo-level contract.

Generated PCR leaf scaffolds under `library/pcrs/**` are intentionally excluded from docpact coverage. The builder, classification sources, mappings, schemas, modules, and project documents remain governed.

## Context Routing

Read only the context needed for the current task.

- For repo structure, PCR identity, classification mapping, or governance changes, use `AGENTS.md`, `README.md`, `docs/architecture.md`, and the target files.
- For PCR content authoring, use `docs/authoring-guide.md`, then route through `builder/AGENTS.md`.
- For builder CLI, schema, script, template, or vocab changes, use `builder/README.md`, then inspect only the affected implementation files.
- For create, update, translate, review, or publish PCR workflows, start at `builder/AGENTS.md` and `builder/docs/index.md`.

## Validation

Run the local validation entry point before handoff when files in this repo change:

```bash
npm run validate
```
