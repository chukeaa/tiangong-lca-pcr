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
  - when promoting retained legacy CPC PCR scaffolds
whenToUpdate:
  - when PCR authoring workflow changes
  - when required PCR files or maturity states change
  - when structured PCR rule expectations change
  - when feedback intake or PCR update-from-feedback workflow changes
checkPaths:
  - docs/authoring-guide.md
  - AGENTS.md
  - README.md
  - builder/**
  - packages/**
  - skills/**
  - .github/ISSUE_TEMPLATE/**
  - library/pcrs/**
  - library/modules/**
lastReviewedAt: 2026-09-13
lastReviewedCommit: da2301271085ca4db71804ea458d898deaa59cd5
---

# Authoring Guide

Author PCR content in canonical PCR files under `library/pcrs/`.

Agents should start from `builder/AGENTS.md`, then use `builder/docs/index.md` to choose the smallest relevant workflow, tool note, contract, or method note.

PCR production always synthesizes the current best PCR for the target product category from available evidence. Existing PCR content is prior evidence and a canonical write target, not a separate reasoning mode.

When the trigger is external PCR feedback, start with `builder/docs/workflows/intake-feedback-issue.md`. Treat the issue as candidate evidence until sources, UUIDs, and data production impact are verified. If accepted, continue with `builder/docs/workflows/update-pcr-from-feedback.md`.

Use mapping files under `classifications/mappings/` to connect external classification codes to canonical PCR ids.

One semantic product category uses one canonical PCR record. Additional classification systems add mapping entries to that PCR id.
A newly imported classification leaf does not by itself justify a PCR directory. Leave it represented in classification
coverage until product scope and methodology review establish a material canonical record; then create that record and
accept the mapping edge. Do not create empty PCRs merely to make the classification look fully mapped.

Each material PCR should be a directory:

```text
library/pcrs/<domain>/<subdomain>/<pcr-slug>/
  manifest.yaml
  pcr.en-US.md
  pcr.zh-CN.md
  structured.yaml
```

Keep language-independent identity and lifecycle state in `manifest.yaml`. Keep machine-oriented rules in `structured.yaml`. Keep human-readable English and Chinese text in `pcr.en-US.md` and `pcr.zh-CN.md`.

Use semantic PCR slugs. Classification codes belong in mapping files and `classification_refs`.

## Content Structure

Author material PCRs with this default Markdown structure:

1. scope and applicability
2. product category identity
3. reference flow
4. measurement and unit rules
5. system boundary
6. process inventory structure
7. allocation and co-product handling
8. foreground data collection, calculation, and quality rules
9. validation rules
10. published dataset profile
11. data sources

The process inventory section should decompose the category into common data production processes. For each process, split rows by `inputs` and `outputs`, then by flow type:

- product flows
- waste flows
- elementary flows

The reference flow section should define the functional unit and one declared reference object. Use `Field` / `Value` tables for `What`, `How much`, `How well`, `How long or cycle`, `reference_flow_link`, `Reference amount`, `Reference product flow`, `Reference flow property`, `Reference unit group`, `Reference unit`, and category-specific `Required qualifiers`.

When constructing a foreground data package, the items listed in `Required qualifiers` must be declared in dataset metadata, process notes, reference flow comment, product description, or an equivalent data package field. Missing required qualifiers make the reference flow definition incomplete for that data package.

The measurement and unit rules section contains rules that affect data consistency, conversion, or validation, such as reference mass basis, seed-count conversion, nitrogen fertilizer product/N basis, energy unit handling, or count-to-mass packaging conversion.

The system boundary section stores `Boundary Abstraction` facts: `declared_starting_condition`, `starting_condition_role`, `product_classification_scope`, `recursive_input_rule`, `upstream_dataset_requirement`, and `disclosure`. The declared starting condition is backed by foreground collection records and dataset disclosure.

System-boundary, allocation, and validation requirements are projected as machine-addressable normative rules with `rule_id`, `applies_to`, `rule`, and `source_ids`. Existing numbered lists, bullets, and normative paragraphs receive deterministic fallback ids. Use an explicit rule table and stable ids when external validators, review findings, or feedback records need to reference an individual rule over time. English and Chinese material PCRs must preserve the same ordered rule ids for these three rule families.

Each inventory flow card should carry a stable `row_id`, the selected flow UUID when available, the flow property/unit used in that row, `amount`, `value_mode`, `specificity`, `basis`, `basis_kind`, `evidence_kind`, `collection_protocol_id`, and `source_ids`.

The foreground data collection section defines the raw fields, collection method, unit, frequency, temporal coverage, site scope, aggregation rule, calculation rules, and quality evidence that produce the first dataset values.

The published dataset profile defines how the completed dataset can be used downstream as `secondary_dataset` or `background_dataset`, including required metadata, quality disclosure, allowed use, excluded use, and update triggers.

## Tiangong CLI Evidence

Use `tiangong-lca-cli` as the preferred identity evidence tool when PCR content refers to Tiangong database rows. See `builder/docs/tools/tiangong-lca-cli.md` for the compact operational contract. From the workspace, either use an installed `tiangong-lca` binary or the sibling CLI repo:

```bash
cd ../tiangong-lca-cli
node ./bin/tiangong-lca.js search flow --input ./search-flow.request.json --json
node ./bin/tiangong-lca.js search process --input ./search-process.request.json --json
node ./bin/tiangong-lca.js flow get --id <flow-id> --json
```

`search flow` should be used for product, waste, and elementary flow candidates. `flow get` should be used to confirm the selected row and copy its referenced flow property UUID. Unit group UUIDs are resolved from the referenced flow property support row. Unresolved unit group UUIDs stay blank and are tracked in review metadata.

Every database-backed selection should record in the PCR content:

- selected row UUID without dataset version
- selected flow property UUID and unit group UUID when applicable
- data role and whether the selected record supports flow identity, process decomposition, range evidence, or validation
- external source ids when the quantity range, factor, or boundary rule comes from literature, official guidance, standards, or another non-default source

CLI lookup traces, command history, API keys, access tokens, session paths, and other private runtime details stay outside PCR files. The Tiangong database is the identity source for UUID-bearing rows and is represented by UUIDs in PCR tables.

If the CLI is unavailable during create work, draft semantic candidates without UUIDs and record unresolved identity gaps in `manifest.yaml` review metadata.

## Data Sources and Ranges

Every material PCR should include `Data Sources`. Use stable source ids and reference them from inventory rows.

For ranges, distinguish:

- `collected_record`: value from real foreground records, measurements, logs, invoices, tests, or supplier primary activity records
- `calculated_from_collection`: value calculated from one or more collected foreground records according to a PCR calculation rule
- `external_source`: range derived from literature, official guidance, standards, or comparable source material
- `method_formula`: range or factor calculated by a PCR method rule
- `site_specific`: value must be provided by the foreground data package

Flow identity sources and range sources can differ. A flow UUID may come from a CLI flow search while its amount range comes from a process row, literature source, method formula, or foreground site data.

AI PCR production uses public evidence and domain common sense to initialize candidate processes, likely input/output flows, and search terms. Existing PCR records are read as prior evidence, then the current best PCR is written to the appropriate canonical record.

Public `tiangong-pcr` guidance is a consumption view over PCR content. `tree`, `list`, and the viewer default to material
records; explicit catalog compatibility scopes are `--scope material|legacy|all`. Classification coverage is queried
separately with `coverage summary|list --classification <system>:<version>`, and coverage list output is paginated.
An accepted mapping and a PCR's readiness are separate claims: an authored candidate is review-required guidance,
while a known unmapped leaf returns `mapping: null` and `pcr: null`. Retired leaf-derived ids are resolved through the
alias registry before catalog lookup: `resolve --pcr` returns a terminal locator and copyable next command, while
content commands fail with `PCR_LEGACY_ID_REDIRECT`. They must not be treated as usable methodology. Use
`validate-dataset` to check the implemented subset of foreground collection package requirements, and inspect
`check_coverage.checks_skipped` before interpreting a result as complete. If Agent use of `guidance` reveals missing
or ambiguous instructions, capture that through feedback issue templates or
`npm --silent run tiangong-pcr -- feedback draft`.

## Retained Legacy CPC Scaffold Compatibility

Retained CPC-generated PCR directories are migration-era placeholders until reviewed PCR content is written. They are
excluded from default material browsing and have no positive mapping merely because their directories survive.
Canonical `import-cpc` requires an explicit `--source` for every run. It creates zero PCR records by default, writes
raw/metadata/normalized classification artifacts, validates and preserves an existing mapping byte-for-byte, and
creates an empty current v2 mapping when none exists. A non-3.0 import requires a registered coverage descriptor. The
importer locks the system/version coordinate, rejects symlinked managed inputs, verifies its baseline before commit,
stages outputs, and installs the mapping last.

The fail-fast `scaffold-cpc` compatibility alias requires explicit `--legacy-scaffolds`. That flag is only for
migration reproduction or tests, not new imports. It can operate only on a retained v1/scaffold mapping fixture; a
current v2 mapping fails before mutation, so compatibility mode cannot append an unaccepted edge or recreate a
retired directory. In a v1 fixture, an existing target must still match the deterministic legacy template
byte-for-byte; partial or authored targets fail closed instead of being repaired or overwritten. Phase 2 acceptance,
mapping contraction, alias generation, and redirect behavior are complete. The CPC `99000` pilot removed one
directory; the remaining legacy directories are explicit compatibility inventory until later audited batches remove
them. When intentionally replacing or promoting one of these records into a material PCR:

- review the semantic product boundary first; a classification leaf alone is not authority to create a PCR
- retain or change `classification_refs` according to the reviewed semantic match, not merely the historical path
- update both `pcr.en-US.md` and `pcr.zh-CN.md` as paired renderings of the same rule
- run `npm run pcr:sync-structured -- --pcr <library/pcrs/...>` after editing canonical Markdown so `structured.yaml` stays aligned
- move `status`, `content_maturity`, and `translation_status` forward with `npm run pcr:lifecycle` only after the relevant methodology or translation review has happened
- add a v2 accepted mapping edge only after the classification-to-PCR relation is reviewed and its durable decision evidence exists
- run `npm run aliases:build` and `npm run catalog:build` in the same coordinated change so the old id is either removed from alias sources or redirected to the reviewed canonical PCR, and the catalog pins the registry's exact bytes and entry count

Repository lint regenerates and compares the deterministic projection for every material PCR. A stale
`structured.yaml` is a validation error, so commit canonical Markdown and its generated projection together.

## Lifecycle and Publication

Lifecycle fields form one contract rather than independent labels. Scaffolds are empty; candidates may be draft or
authored; active PCRs are reviewed methodology; published PCRs are published methodology. Use one lifecycle command
to make a valid transition and do not edit a status without moving the corresponding maturity when required.

Before publication, the selected workspace must be `active` with `reviewed_methodology`, Chinese translation status
`reviewed`, a valid semantic version, no unresolved or blocking review metadata, a current structured projection, and
no material lint problem. First publication requires
`pcr:publish --workspace current --version <semver>`. A later version starts with `pcr:revise --version
<target-semver>`, is edited and reviewed only through `--workspace revision`, and is promoted with
`pcr:publish --workspace revision`.

Publication preflight runs while the per-PCR transaction lock is held. Failure leaves the complete PCR leaf
unchanged. Success installs the current files, immutable `releases/<semver>/` snapshot, exact-byte release metadata,
and append-only history together through the recoverable directory transaction. Never edit a published/deprecated
current workspace or managed release artifact in place; run `pcr:recover` when an interrupted mutation reports
recovery state.
