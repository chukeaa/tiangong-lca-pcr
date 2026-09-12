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
  - .github/workflows/**
  - .github/ISSUE_TEMPLATE/**
  - classifications/**
  - library/modules/**
  - docs/**
lastReviewedAt: 2026-09-13
lastReviewedCommit: da2301271085ca4db71804ea458d898deaa59cd5
---

# AGENTS.md - TianGong LCA PCR Library

This repository owns canonical PCR and modelling methodology assets for TianGong LCA data authoring.

The canonical GitHub repository is `tiangong-lca/pcr`. When the consuming workspace delivery profile includes this repository, use its controller and `pcr` label for tracked delivery. Keep repository changes in this repository, target `main`, and hand off the exact eligible commit for workspace integration. Physical submodule presence alone does not establish delivery-controller support.

## Boundaries

- PCR files are classification-independent methodology records.
- Classification systems map to PCR records through `classifications/mappings/`.
- Do not duplicate PCR records only because a new classification system is added.
- A classification leaf is coverage input, not a request to create canonical PCR identity. Create a PCR only when a
  reviewed semantic product boundary and material methodology need a canonical record.
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

After first publication the same leaf also owns its audited release lineage, and may own one explicit open revision:

```text
  release-history.yaml
  revision/
    revision.yaml
    manifest.next.yaml
    pcr.en-US.md
    pcr.zh-CN.md
    structured.yaml
  releases/<semver>/
    release.yaml
    manifest.snapshot.yaml
    pcr.en-US.md
    pcr.zh-CN.md
    structured.yaml
```

Rules:

- `manifest.yaml` owns language-independent PCR identity, title map, lifecycle status, content maturity, target entities, module references, and available languages.
- `pcr.en-US.md` and `pcr.zh-CN.md` are two language renderings of the same PCR record, not separate PCR records.
- `structured.yaml` is the machine-oriented projection of the canonical Markdown PCR. It carries reference flow definitions, measurement rules, process inventories, validation-facing fields, external data sources, and deterministic projection metadata without authoring trace logs.
- Material projections must satisfy `packages/pcr-core/schemas/structured-projection.schema.json` and carry a current canonical-Markdown/content SHA-256 fingerprint. Missing, malformed, stale, or unsupported projections are unavailable to guidance and validation.
- Do not create parallel `pcrs/en/` and `pcrs/zh-CN/` directory trees.
- Do not use CPC, HS, ISIC, NAICS, or another external classification system as the canonical PCR directory tree.
- Do not include external classification codes in PCR directory names. Use semantic PCR slugs such as `wheat-seed`; keep CPC, HS, ISIC, NAICS, and similar codes in mappings and `classification_refs`.
- If a classification leaf maps to an existing PCR, update the mapping file instead of duplicating the PCR.
- After publication, the top-level four files are the current consumer-facing release. Open later work with
  `pcr:revise` and operate explicitly on `--workspace revision`; never edit, sync, or bump published/deprecated current
  content in place.
- `releases/<semver>/` is immutable and `release-history.yaml` is append-only. Do not create or edit them manually;
  publication maintains them through a recoverable whole-directory transaction.
- A published current record may move only to `deprecated/deprecated_methodology`. A deprecated PCR cannot be
  reopened by lifecycle or revision commands.

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
classifications/aliases/pcr-id-aliases.yaml
classifications/indexes/<system>-<version>-coverage.json
```

Mapping files are the authoritative link from external classification codes to canonical PCR ids. Current
`schema_version: 2` / `status: current` mappings contain accepted positive edges only. Each edge must point to a
material PCR, use `exact`, `broader`, `narrower`, or `proxy`, and carry an `acceptance` decision with status,
decision-maker, UTC time, and durable decision reference. Candidate and `manual_review` evidence belongs in coverage
assessment, not in the positive mapping.

`pcr:import:cpc -- --source <csv>` is classification-only by default. Every invocation requires an explicit source;
the command writes raw source, source metadata, and normalized classification artifacts, creates zero PCR records,
creates a zero-edge mapping only when the mapping is absent, and validates then preserves the exact bytes of any
existing mapping. A retained raw artifact name is immutable: importing different bytes under the same name fails
closed. A non-3.0 import requires a registered coverage descriptor.

The `scaffold-cpc` compatibility alias must fail unless `--legacy-scaffolds` is explicit. That mode exists only for
migration reproduction and tests, never for a new classification import. It may operate only on a legacy v1/scaffold
mapping. A current v2 mapping makes the compatibility mode fail before mutation, so it cannot inject an unaccepted
edge or rehydrate a retired leaf-derived PCR directory. For retained v1 fixtures, a missing target may be created as
one complete four-file legacy scaffold; an existing target must already be complete and byte-for-byte equal to the
expected legacy template. It must never repair partial directories, replace an accepted edge, or overwrite PCR
content.

CPC import mutations are protected by one lock per classification coordinate, no-follow reads, a baseline
compare-and-swap check, and staged writes. The mapping is the final committed artifact, so a failed import cannot
publish an edge whose identity or PCR target was not installed.

Only an explicitly accepted edge to a material PCR is a positive mapping. CPC 3.0 currently has exactly three such
edges (`01111`, `04412`, and `04911`); CPC 2.1 is a current v2 mapping with zero edges.
Classification coverage is a derived read model under `classifications/indexes/`; it combines normalized leaves,
mapping input, target PCR state, and coverage assessment for bounded CLI and viewer reads. Each checked-in index must
record exact-byte SHA-256 fingerprints for its normalized-leaf and mapping sources, and consumers must reject a stale
or substituted source. A mapped entry projects its acceptance evidence and runtime resolution rechecks it against the
canonical mapping. The index is not authoring truth and must be regenerated from those sources. CPC 3.0 coverage
remains complete at 2,877 leaves: 3 mapped, 2,874 unmapped, and 0 unknown.

Retired CPC leaf-derived PCR ids are recorded in the deterministic registry at
`classifications/aliases/pcr-id-aliases.yaml`. Its 2,874 aliases are terminal locators to classification coverage;
they are checked before catalog lookup, cannot chain or cycle, and must not be silently followed into a PCR.
`resolve --pcr` returns the locator and a copyable next command, while content commands fail with
`PCR_LEGACY_ID_REDIRECT`. One physical pilot has removed CPC `99000`; it is known-unmapped and its old id redirects.
The remaining 2,873 legacy directories are still compatibility artifacts. Bulk physical migration is not complete.

## Builder CLI and Authoring Docs

The builder CLI lives under `builder/cli/`.

Agent-facing PCR production guidance lives under `builder/`. Use `builder/AGENTS.md` for task routing and hard rules, then use `builder/docs/index.md` to choose the smallest relevant workflow, contract, tool note, method note, or prompt.

CLI commands and command meanings are documented in `builder/README.md`. Keep detailed CLI usage there instead of duplicating it in this repo-level contract.

Material PCRs must have a deterministic, schema-valid `structured.yaml` projection whose source and generated-content
fingerprints match canonical Markdown and the projection bytes. Lifecycle state, content maturity, and translation
state are one validated contract. Publication must pass the builder preflight before either the manifest or structured
projection is replaced.

First publication uses the current workspace and creates the initial immutable release snapshot and history. Later
publication requires a `pcr:revise` workspace whose target SemVer is fixed at open time. Builder sync, bump,
lifecycle, revise, and publish mutations use per-PCR lock/journal/stage/backup state under
`library/.pcr-builder-state/`; recover interrupted state with `pcr:recover`, and use `--force-stale-lock` only after
confirming no writer is active.

Stable machine tokens are authored only in `builder/vocab/*.yaml`. Do not hand-edit the generated runtime constants
or controlled-vocabulary Schema under `packages/pcr-core/`; run `npm run vocab:generate`, and keep token validity
separate from lifecycle, readiness, evidence, and other cross-field policy.

Build or check the deterministic legacy-id registry with `npm run aliases:build` and `npm run aliases:check`.
The catalog binds the registry's canonical path, exact-byte SHA-256, and entry count; a missing or mismatched binding
must fail closed at runtime. Catalog publication replaces the catalog, material index, and coverage indexes as one
journaled, recoverable artifact set. If publication is interrupted, use `npm run catalog:recover`; use its
`--force-stale-lock` option only after confirming no writer is active. Do not hand-edit catalog transaction state
under `library/.pcr-builder-state/catalog/`.

Generated PCR leaf scaffolds under `library/pcrs/**` are intentionally excluded from docpact coverage. The builder, classification sources, mappings, schemas, modules, and project documents remain governed.

## Public PCR Consumption CLI and Skill

The public Agent-facing CLI lives under `packages/tiangong-pcr-cli/` and uses shared logic from `packages/pcr-core/`.

Use this CLI to consume PCRs while constructing foreground data packages and their downstream LCA `process` or
`lifecyclemodel` projections:

```bash
npm --silent run tiangong-pcr -- tree --format markdown
npm --silent run tiangong-pcr -- list --scope material --format json
npm --silent run tiangong-pcr -- list --path-prefix <domain/subdomain> --format json
npm --silent run tiangong-pcr -- list --scope legacy --page 1 --page-size 10 --format json
npm --silent run tiangong-pcr -- list --page 2 --page-size 10
npm --silent run tiangong-pcr -- coverage summary --classification cpc:3.0 --format json
npm --silent run tiangong-pcr -- coverage list --classification cpc:3.0 --page 1 --page-size 10 --format json
npm --silent run tiangong-pcr -- resolve --classification cpc:3.0:01111 --format json
npm --silent run tiangong-pcr -- resolve --pcr <pcr-id> --format json
npm --silent run tiangong-pcr -- guidance --pcr <pcr-id> --format json
npm --silent run tiangong-pcr -- feedback draft --pcr <pcr-id> --type <feedback-type>
```

Rules:

- `tree` and `list` are explicit catalog-browsing tools, not fuzzy search. They default to material PCRs; use
  `--scope material|legacy|all` when the requested record scope must be explicit.
- `tree` defaults to the bounded material domain/subdomain view at depth 2. Use paginated `list --path-prefix` to drill down; request depth 3 only when the complete selected-scope hierarchy is required.
- `list` is paginated by default with 10 records per page. Output must expose active filters, pagination completeness, and copyable next/previous commands.
- `coverage summary|list --classification <system>:<version>` exposes classification coverage separately from the
  methodology catalog. `coverage list` is paginated and candidate/manual-review evidence must never be auto-selected.
- `resolve` requires exactly one of `--classification` or `--pcr`. Classification resolution uses deterministic
  accepted mappings and the derived coverage index; a missing coverage index fails closed and must never fall back to
  selecting directly from a mapping file. A known but unmapped leaf is a successful resolution with `mapping: null`
  and `pcr: null`. A retired PCR id returns a terminal alias locator and copyable next command without auto-following
  it. Neither result implies usable methodology.
- Catalog, resolve, and guidance results must expose PCR readiness. Empty scaffolds are excluded from default material
  browsing, remain available through explicit legacy/all compatibility scope, and must be rejected by guidance and validation.
- `guidance` and validation must re-check the target projection's Schema and fingerprint at runtime, present Agent-facing boundary, allocation, inventory, production, and validation rules, and never mutate PCR content.
- Validation output must distinguish status from coverage by reporting accepted input, checks performed, checks skipped, findings, and completeness. Error findings and inconclusive validation fail the CLI by default; report-only exit behavior must be explicitly requested.
- `feedback draft` creates issue-ready candidate evidence; it does not update PCR truth.
- `--help` must work globally and for each public command. Command help should include purpose, options, output shape where relevant, and Agent next-step guidance.
- Output formats are command-specific contracts. JSON-only commands must never silently emit another representation, and JSON-requested failures must keep stdout empty while returning a stable error code and details on stderr.
- PCR guidance is dataset-production first, while `process` and `lifecyclemodel` remain target entities as publication, validation, and downstream-use projections of the foreground data package.
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
