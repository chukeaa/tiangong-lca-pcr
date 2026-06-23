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
lastReviewedCommit: 0778c96b0faa23026da60a6c0ac232c9ba333772
---

# Authoring Guide

Author PCR content in canonical PCR files under `library/pcrs/`.

Agents should start from `builder/AGENTS.md`, then use `builder/docs/index.md` to choose the smallest relevant workflow, tool note, contract, or method note.

Use mapping files under `classifications/mappings/` to connect external classification codes to canonical PCR ids.

Do not create duplicate PCR files only because two classification systems describe the same product category.

Each material PCR should be a directory:

```text
library/pcrs/<domain>/<subdomain>/<pcr-slug>/
  manifest.yaml
  pcr.en-US.md
  pcr.zh-CN.md
  structured.yaml
```

Keep language-independent identity and lifecycle state in `manifest.yaml`. Keep machine-oriented rules in `structured.yaml`. Keep human-readable English and Chinese text in `pcr.en-US.md` and `pcr.zh-CN.md`.

Use semantic PCR slugs. Do not prefix or suffix PCR directories with CPC, HS, ISIC, NAICS, or other external classification codes. Classification codes belong in mapping files and `classification_refs`.

## Content Structure

Author material PCRs with this default Markdown structure:

1. scope and applicability
2. product category identity
3. reference flow
4. measurement and unit rules
5. system boundary
6. process inventory structure
7. allocation and co-product handling
8. data quality and evidence rules
9. validation rules
10. data sources

The process inventory section should decompose the category into common modelling processes. For each process, split rows by `inputs` and `outputs`, then by flow type:

- product flows
- waste flows
- elementary flows

The reference flow section should define one declared reference object. Use a `Field` / `Value` table with `Reference amount`, `Reference product flow`, `Reference flow property`, `Reference unit group`, `Reference unit`, and category-specific `Required qualifiers`. Do not add a second free-text "preferred reference flow" that repeats the same information.

When constructing a `process` or `lifecyclemodel`, the items listed in `Required qualifiers` must be declared in the process description, lifecycle model metadata, reference flow comment, product description, or an equivalent model field. If an item is not applicable, state why; if it is missing, treat the reference flow definition as incomplete.

The measurement and unit rules section is not a catalog of every flow property or unit that may appear later. It should contain only rules that affect modelling consistency, conversion, or validation, such as reference mass basis, seed-count conversion, nitrogen fertilizer product/N basis, energy unit handling, or count-to-mass packaging conversion.

Each inventory flow row should carry the selected flow UUID when available, the flow property/unit used in that row, `Amount`, `amount_kind`, `Basis`, `basis_kind`, `evidence_kind`, and `source_ids`.

## Tiangong CLI Evidence

Use `tiangong-lca-cli` as the preferred authoring evidence tool when PCR content refers to Tiangong database rows. See `builder/docs/tools/tiangong-lca-cli.md` for the compact operational contract. From the workspace, either use an installed `tiangong-lca` binary or the sibling CLI repo:

```bash
cd ../tiangong-lca-cli
node ./bin/tiangong-lca.js search flow --input ./search-flow.request.json --json
node ./bin/tiangong-lca.js search process --input ./search-process.request.json --json
node ./bin/tiangong-lca.js flow get --id <flow-id> --json
```

`search flow` should be used for product, waste, and elementary flow candidates. `flow get` should be used to confirm the selected row and copy its referenced flow property UUID. Unit group UUIDs are resolved from the referenced flow property support row. Until the CLI exposes direct support-row search, do not invent unit group UUIDs.

Every database-backed selection should record in the PCR content:

- selected row UUID without dataset version
- selected flow property UUID and unit group UUID when applicable
- modelling role and whether the selected record supports flow identity, process decomposition, range evidence, or validation
- external source ids when the quantity range, factor, or boundary rule comes from literature, official guidance, standards, or another non-default source

Do not write CLI lookup traces, command history, API keys, access tokens, session paths, or other private runtime details into PCR files. The Tiangong database is the default source for UUID-bearing rows and does not need to be repeated in `Data Sources`.

If the CLI is unavailable during create work, draft semantic candidates without UUIDs and record unresolved identity gaps in `manifest.yaml` review metadata. Do not invent UUIDs or support rows.

## Data Sources and Ranges

Every material PCR should include `Data Sources`. Use stable source ids and reference them from inventory rows.

For ranges, distinguish:

- `observed_dataset`: range derived from an explicit dataset row
- `external_source`: range derived from literature, official guidance, standards, or comparable source material
- `method_formula`: range or factor calculated by a PCR method rule
- `site_specific`: value must be provided by the foreground model

Flow identity sources and range sources can differ. A flow UUID may come from a CLI flow search while its amount range comes from a process row, literature source, method formula, or foreground site data.

Create workflows may use common sense to initialize candidate processes, likely input/output flows, and search terms. Update workflows are input-driven: begin from the specific user request, document, file, dataset, reviewer feedback, or database alignment change, then update only the affected PCR sections and lifecycle metadata.

## CPC Scaffolded PCRs

CPC-generated PCR directories are placeholders until reviewed PCR content is written. When filling one of these records:

- keep the existing `classification_refs` and CPC-to-PCR mapping unless the classification match is wrong
- update both `pcr.en-US.md` and `pcr.zh-CN.md` as paired renderings of the same rule
- run `npm run pcr:sync-structured -- --pcr <library/pcrs/...>` after editing canonical Markdown so `structured.yaml` stays aligned
- move `status` and `content_maturity` forward only after the PCR has been reviewed for methodology quality
