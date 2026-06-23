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
  - when public PCR consumption CLI, skill, or feedback intake behavior changes
  - when repository validation expectations change
checkPaths:
  - AGENTS.md
  - README.md
  - .docpact/config.yaml
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

# AGENTS.md - TianGong LCA PCR Library

This repository owns canonical PCR and modelling methodology assets for TianGong LCA data authoring.

## Boundaries

- PCR files are classification-independent methodology records.
- Classification systems map to PCR records through `classifications/mappings/`.
- Do not duplicate PCR records only because a new classification system is added.
- Keep reusable method rules in `library/modules/` and category-specific rules in `library/pcrs/`.
- Builder scripts must not depend on private workspace state.
- Keep PCR production and PCR consumption separate: `builder/` owns library maintenance, while `packages/` and `skills/` expose reviewed PCR guidance to agents and humans.

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

## Public PCR Consumption CLI and Skill

The public Agent-facing CLI lives under `packages/tiangong-pcr-cli/` and uses shared logic from `packages/pcr-core/`.

Use this CLI to consume PCRs while constructing LCA `process` or `lifecyclemodel` data:

```bash
npm --silent run tiangong-pcr -- tree --depth 3 --format markdown
npm --silent run tiangong-pcr -- list --status candidate --format json
npm --silent run tiangong-pcr -- list --page 2 --page-size 10
npm --silent run tiangong-pcr -- resolve --classification cpc:3.0:01111 --format json
npm --silent run tiangong-pcr -- guidance --pcr <pcr-id> --format json
npm --silent run tiangong-pcr -- feedback draft --pcr <pcr-id> --type <feedback-type>
```

Rules:

- `tree` and `list` are explicit catalog-browsing tools, not fuzzy search.
- `list` is paginated by default with 10 records per page. Human-readable output must tell agents how to request the next page and what next command to run.
- `resolve` must use deterministic mapping files under `classifications/mappings/**`.
- `guidance` must consume `structured.yaml` and present Agent-facing rules without mutating PCR content.
- `feedback draft` creates issue-ready candidate evidence; it does not update PCR truth.
- `--help` must work globally and for each public command. Command help should include purpose, options, output shape where relevant, and Agent next-step guidance.
- Agent skill guidance lives under `skills/tiangong-pcr/` and must remain thin. It should point agents to CLI commands and library contracts instead of duplicating PCR rules.
- GitHub feedback intake surfaces live under `.github/ISSUE_TEMPLATE/`.

## Context Routing

Read only the context needed for the current task.

- For repo structure, PCR identity, classification mapping, or governance changes, use `AGENTS.md`, `README.md`, `docs/architecture.md`, and the target files.
- For PCR content authoring, use `docs/authoring-guide.md`, then route through `builder/AGENTS.md`.
- For builder CLI, schema, script, template, or vocab changes, use `builder/README.md`, then inspect only the affected implementation files.
- For public PCR consumption CLI, Agent skill, or feedback issue template changes, inspect `packages/**`, `skills/tiangong-pcr/**`, `.github/ISSUE_TEMPLATE/**`, `README.md`, and `docs/architecture.md`.
- For create, update, translate, review, or publish PCR workflows, start at `builder/AGENTS.md` and `builder/docs/index.md`.

## Validation

Run the local validation entry point before handoff when files in this repo change:

```bash
npm run validate
```
