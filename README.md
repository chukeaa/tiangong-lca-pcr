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
  - when the scaffold status changes
checkPaths:
  - README.md
  - AGENTS.md
  - package.json
  - builder/**
  - classifications/**
  - library/modules/**
  - docs/**
lastReviewedAt: 2026-06-23
lastReviewedCommit: edd52008c4e9be4c9e6e2bdcd53b0f9dd7f8e99d
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
- `builder/`: templates, schemas, scripts, and construction method documents for building the PCR library.
- `docs/`: project-level architecture and authoring notes.

## PCR Record Shape

Each material PCR should use one directory with shared metadata, bilingual Markdown, and machine-readable rules:

```text
library/pcrs/<domain>/<subdomain>/<pcr-slug>/
  manifest.yaml
  pcr.en.md
  pcr.zh-CN.md
  structured.yaml
```

## Builder CLI

```bash
npm run init
npm run lint
npm run pcr:scaffold:cpc -- --source <cpc-structure.csv> --classification-version 3.0 --source-url <official-source-url>
npm run validate
```

`pcr:scaffold:cpc` imports a CPC structure CSV, stores the raw and normalized classification data under `classifications/systems/cpc/<version>/`, writes a CPC-to-PCR mapping file, and creates empty bilingual PCR directories for leaf classes only. PCR directory names are semantic slugs, not CPC codes; the CPC code remains in the mapping layer and PCR metadata.

## Initial Status

This repository is intentionally scaffold-first. It establishes the layout and contracts for CPC-backed PCR scaffold generation without treating the generated empty PCR files as reviewed PCR content.
