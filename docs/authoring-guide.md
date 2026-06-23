---
title: PCR Authoring Guide
docType: guide
scope: repo
status: draft
authoritative: true
owner: tiangong-lca-pcr
language: en
whenToUse:
  - when authoring or reviewing PCR Markdown and structured PCR rule files
  - when filling CPC-generated empty PCR scaffolds
whenToUpdate:
  - when PCR authoring workflow changes
  - when required PCR files or maturity states change
  - when structured PCR rule expectations change
checkPaths:
  - docs/authoring-guide.md
  - AGENTS.md
  - README.md
  - builder/**
  - library/pcrs/**
  - library/modules/**
lastReviewedAt: 2026-06-23
lastReviewedCommit: edd52008c4e9be4c9e6e2bdcd53b0f9dd7f8e99d
---

# Authoring Guide

Author PCR content in canonical PCR files under `library/pcrs/`.

Use mapping files under `classifications/mappings/` to connect external classification codes to canonical PCR ids.

Do not create duplicate PCR files only because two classification systems describe the same product category.

Each material PCR should be a directory:

```text
library/pcrs/<domain>/<subdomain>/<pcr-slug>/
  manifest.yaml
  pcr.en.md
  pcr.zh-CN.md
  structured.yaml
```

Keep language-independent identity and lifecycle state in `manifest.yaml`. Keep machine-oriented rules in `structured.yaml`. Keep human-readable English and Chinese text in `pcr.en.md` and `pcr.zh-CN.md`.

Use semantic PCR slugs. Do not prefix or suffix PCR directories with CPC, HS, ISIC, NAICS, or other external classification codes. Classification codes belong in mapping files and `classification_refs`.

## CPC Scaffolded PCRs

CPC-generated PCR directories are placeholders until reviewed PCR content is written. When filling one of these records:

- keep the existing `classification_refs` and CPC-to-PCR mapping unless the classification match is wrong
- update both `pcr.en.md` and `pcr.zh-CN.md` as paired renderings of the same rule
- put machine-checkable reference-flow, inventory-flow, boundary, allocation, and QA patterns in `structured.yaml`
- move `status` and `content_maturity` forward only after the PCR has been reviewed for methodology quality
