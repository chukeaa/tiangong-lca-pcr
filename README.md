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
  - when public PCR consumption CLI or Agent skill behavior changes
  - when classification import or legacy scaffold compatibility behavior changes
checkPaths:
  - README.md
  - AGENTS.md
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

# TianGong LCA PCR Library

This repository stores TianGong LCA product category rules and data production methodology assets.

Canonical source: [tiangong-lca/pcr](https://github.com/tiangong-lca/pcr). The workspace's retained local directory is `tiangong-lca-pcr`; repository renaming does not change PCR identifiers, package names, or release history.

PCR records are canonical methodology documents. Classification systems such as CPC, HS, ISIC, and NAICS are entry points that map to canonical PCR records; they do not own the PCR directory structure.

## Repository Shape

- `library/pcrs/`: canonical PCR markdown records grouped by TianGong methodology domains.
- `library/modules/`: reusable data production method modules referenced by PCR records.
- `library/indexes/`: generated material PCR indexes.
- `classifications/systems/`: source and normalized classification-system data.
- `classifications/mappings/`: accepted mappings from external classification codes to canonical material PCR ids.
- `classifications/aliases/`: deterministic terminal locators for retired leaf-derived PCR ids.
- `classifications/indexes/`: derived classification coverage read models for the CLI and viewer.
- `builder/`: CLI, implementation modules, scripts, schemas, templates, controlled vocabularies, and builder documentation for constructing and validating the PCR library.
- `packages/pcr-core/`: shared library for reading PCR catalog, mapping, guidance, validation, and feedback draft data.
- `packages/tiangong-pcr-cli/`: public Agent-facing CLI for consuming PCR guidance during foreground data package construction.
- `skills/tiangong-pcr/`: thin Agent skill for selecting PCRs, using guidance, validating drafts, and creating feedback.
- `.github/workflows/`: repository validation gates for pull requests and main-branch updates.
- `.github/ISSUE_TEMPLATE/`: structured PCR feedback and missing-PCR issue forms.
- `docs/`: project-level architecture, authoring notes, release policy, and the phased optimization roadmap.

## PCR Record Shape

Each material PCR should use one directory with shared metadata, bilingual Markdown, and machine-readable rules:

```text
library/pcrs/<domain>/<subdomain>/<pcr-slug>/
  manifest.yaml
  pcr.en-US.md
  pcr.zh-CN.md
  structured.yaml
```

After first publication, the same canonical leaf also carries an immutable release chain. While a later version is
being authored, one explicit revision workspace may coexist with the stable current release:

```text
  release-history.yaml
  revision/                         # present only while one revision is open
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

The top-level four files remain the current consumer-facing release. Release snapshots are immutable, history is
append-only, and managed subtrees never contain another `manifest.yaml`.

Material PCR content should use this authoring shape:

- reference flow definition with UUID-bearing product flow and category-specific required qualifiers
- measurement and unit rules for modelling consistency, conversion, and validation
- system boundary, boundary abstraction, and allocation rules
- process inventory organized by process, then inputs/outputs, then product/waste/elementary flows
- foreground data collection protocols, calculation rules, and data quality requirements
- published dataset profile for downstream `secondary_dataset` and `background_dataset` use
- validation rules
- selected Tiangong UUIDs without dataset versions
- external data sources for ranges, factors, official guidance, and non-default evidence

## Builder CLI

```bash
npm run init
npm run lint
npm run aliases:build
npm run aliases:check
npm run catalog:build
npm run catalog:check
npm run catalog:recover [-- --force-stale-lock]
npm run pcr:import:cpc -- --source <cpc-structure.csv> --classification-version 3.0 --source-url <official-source-url>
npm run pcr:import:cpc -- --source <cpc-structure.csv> --classification-version 3.0 --legacy-scaffolds  # migration compatibility only
npm run pcr:sync-structured -- --pcr <library/pcrs/...> [--workspace current|revision]
npm run pcr:bump -- --pcr <library/pcrs/...> --level patch
npm run pcr:publish -- --pcr <library/pcrs/...> --workspace current --version <semver>
npm run pcr:revise -- --pcr <library/pcrs/...> --version <target-semver>
npm run pcr:publish -- --pcr <library/pcrs/...> --workspace revision
npm run pcr:recover -- --pcr <library/pcrs/...> [--force-stale-lock]
npm run validate
```

`pcr:import:cpc` is the canonical CPC import entry point, and every invocation must pass `--source` explicitly. It
stores the raw source and metadata and regenerates the normalized hierarchy, leaves, and paths. The default mode
creates zero PCR records. If the version's mapping file is missing, it creates a zero-edge current mapping document; if the
mapping already exists, import validates it first and then preserves its exact bytes. A non-3.0 version must have a
coverage descriptor registered before import so the generated sources participate in catalog and runtime integrity
checks. Reusing a retained raw filename with different bytes fails closed; when source artifacts legitimately change,
the command reports coverage/catalog output as stale and points to the rebuild action.

`--legacy-scaffolds` is an explicit migration/test-only mode for retained v1/scaffold mapping fixtures. A current
v2 mapping makes it fail closed before mutation, so it cannot inject an unaccepted edge or rehydrate a retired
leaf-derived PCR directory. On a retained v1 fixture it may create one complete four-file scaffold when the target is
absent; an existing target must contain all four expected files and match the deterministic legacy template
byte-for-byte. It never repairs a partial directory or overwrites an accepted edge or PCR content. The old
`pcr:scaffold:cpc` command name is a protected compatibility alias and refuses to run without
`--legacy-scaffolds`. Do not use either legacy path for new classification imports.

The importer holds one lock for the CPC system/version coordinate, reads managed inputs without following symlinks,
checks that its preflight baseline has not changed, and stages each file or complete legacy directory before its
atomic installation. It commits the mapping last, so an interrupted or rejected import cannot leave a newly
published edge without its identity or PCR target; earlier classification-only artifacts may already be installed
and are safe to regenerate on the next run.

`pcr:sync-structured` regenerates `structured.yaml` from canonical Markdown and appends deterministic projection metadata: a generator contract version, canonical Markdown SHA-256, and generated-content SHA-256, with no timestamp. Repository lint validates every material projection against the shared JSON Schema, verifies its fingerprint, and rejects stale output. `--workspace` defaults to `current`; a published or deprecated current release cannot be synced or bumped in place.

First publication uses `pcr:publish --workspace current --version <semver>` and creates both the current release and its
initial immutable `releases/<semver>/` snapshot plus `release-history.yaml`. For a later version, `pcr:revise` opens
`revision/`, fixes a greater target version, and leaves the top-level release unchanged. Sync and lifecycle commands
must then use `--workspace revision`; reviewed revision publication uses `pcr:publish --workspace revision` without a
version argument. A deprecated PCR cannot be reopened.

Builder sync, bump, lifecycle, revise, and publish mutations replace the complete canonical leaf through a recoverable
directory transaction. Lock, journal, staging, and backup state live under `library/.pcr-builder-state/`;
`pcr:recover` rolls back interrupted pre-commit work or finishes committed cleanup. `--force-stale-lock` is only for
verified stale state when ordinary recovery requires it. Publication preflight still requires active reviewed
methodology, reviewed Chinese translation, valid SemVer, fresh projection content, and no unresolved review blocker.

`aliases:build` deterministically projects the retired CPC leaf-derived identity inventory into
`classifications/aliases/pcr-id-aliases.yaml`; `aliases:check` rejects a stale registry. Current mapping v2 files
contain accepted positive edges only, with reviewer, UTC decision time, and durable decision reference. Catalog
publication pins the alias registry path, exact-byte SHA-256, and entry count, then replaces `library/catalog.yaml`,
the material index, and coverage indexes as one journaled recoverable artifact set. Runtime alias reads fail closed
when that binding or registry drifts. If a catalog publication is interrupted, run `catalog:recover`, then
`catalog:check`; use `catalog:recover -- --force-stale-lock` only after confirming no writer is active.

PCR production agents may use `tiangong-lca-cli` to search Tiangong database flow, process, and dataset identity records and copy selected UUID references into PCR content. The CLI is an evidence tool for identity selection.

Builder docs live under `builder/docs/`. Start with `builder/AGENTS.md` for task routing and `builder/docs/index.md` for the compact documentation map. AI PCR production always synthesizes the current best PCR for the target product category; existing PCR content is prior evidence and a canonical write target.

## Public PCR CLI

Use `tiangong-pcr` when consuming PCRs to guide foreground data package construction:

```bash
npm --silent run tiangong-pcr -- tree --format markdown
npm --silent run tiangong-pcr -- list --scope material --format json
npm --silent run tiangong-pcr -- list --path-prefix agriculture-forestry-and-fishery-products/products-of-agriculture-horticulture-and-market-gardening --format json
npm --silent run tiangong-pcr -- list --scope legacy --page 1 --page-size 10 --format json
npm --silent run tiangong-pcr -- list --page 2 --page-size 10
npm --silent run tiangong-pcr -- coverage summary --classification cpc:3.0 --format json
npm --silent run tiangong-pcr -- coverage list --classification cpc:3.0 --page 1 --page-size 10 --format json
npm --silent run tiangong-pcr -- resolve --classification cpc:3.0:01111 --format json
npm --silent run tiangong-pcr -- resolve --pcr <pcr-id> --format json
npm --silent run tiangong-pcr -- show --pcr <pcr-id> --lang zh-CN
npm --silent run tiangong-pcr -- guidance --pcr <pcr-id> --format json
npm --silent run tiangong-pcr -- validate-dataset --pcr <pcr-id> --input <dataset-file> --format json
npm --silent run tiangong-pcr -- feedback draft --pcr <pcr-id> --type range_evidence_update --summary "<finding>"
```

The public CLI provides deterministic classification `resolve`, explicit `tree` and `list` methodology-catalog
browsing, classification `coverage summary|list`, structured `guidance`, foreground data package checks through
`validate-dataset`, process/lifecyclemodel draft checks through `validate-model`, and issue-ready feedback drafting.
`tree`, `list`, and the viewer default to material records. Use `--scope material|legacy|all` on catalog commands
when the scope must be explicit. `tree` defaults to a bounded depth-2 category view; use paginated
`list --path-prefix` to drill into a category. `list` defaults to 10 records per page and reports its filters,
effective scope, `has_more`, and copyable next/previous commands.

Classification coverage is separate from the methodology catalog. `coverage summary --classification cpc:3.0`
returns bounded aggregate counts, while `coverage list --classification cpc:3.0` returns explicit leaves in pages of
10 by default and supports `--status`. The checked-in coverage index is a deterministic read model derived from
normalized leaves, accepted mapping input, and material-target state; it is not a new authoring
truth. Its source descriptor records generator/contract versions plus exact-byte SHA-256 fingerprints for both input
files, and runtime reads fail closed when either source path or bytes no longer match. Mapped entries also project
the acceptance decision, which runtime resolution checks against the canonical mapping. Classification resolution
also fails closed when the derived coverage index is absent; it never falls back to selecting directly from mapping.

Material catalog and mapped resolve results carry a `readiness` object. A mapped edge identifies a PCR record; it does
not by itself claim that methodology is usable. Authored candidates are marked `review_required`. A known
classification leaf without an accepted mapping is a successful `resolve` result with `mapping: null` and
`pcr: null`.

`resolve` accepts exactly one selector: `--classification <system>:<version>:<code>` or `--pcr <pcr-id>`. Retired
leaf-derived ids are checked in the alias registry before catalog lookup. Their result is
`legacy_id_redirect` with a terminal coverage locator and copyable next command; the CLI never auto-follows that
locator into a PCR. `show`, `guidance`, and validation reject the same id with stable code
`PCR_LEGACY_ID_REDIRECT`, so retirement cannot be mistaken for ordinary not-found or usable methodology.

For material PCRs, readiness also reports `projection_fingerprint`. `pcr-core` validates the current
`structured.yaml` against the shared material projection Schema and recomputes its canonical-source and
generated-content hashes at runtime. A missing or invalid Schema/fingerprint is a readiness blocker, even when
the file exists. Runtime readiness separately checks material methodology completeness, so a current,
Schema-valid but empty projection is also unavailable. Empty scaffolds report the fingerprint as `not_required`.

Validation output reports `validation_status`, `completeness`, accepted input shape, checks performed, checks skipped, and findings by severity. Public readiness and validation reports are checked for both JSON shape and cross-field consistency, including blocker/usability alignment, finding totals, coverage totals, completeness, and status. A `passed` result applies only to `checks_performed`; consumers must inspect partial coverage. Validation commands default to `--fail-on error` and exit 2 when error findings are present or the result is inconclusive. Use `--fail-on never` explicitly when a report-only workflow must keep exit code 0.

PCR guidance is dataset-production first. `process` and `lifecyclemodel` remain target entities as publication, validation, and downstream-use projections of the foreground data package rather than separate sources of methodology truth.

Use `npm --silent run tiangong-pcr -- --help` for the global Agent workflow and `npm --silent run tiangong-pcr -- <command> --help` for command-specific options, output shape, and next-step guidance.

Formats are enforced per command: `resolve`, `guidance`, and validation are JSON; `show` is Markdown; `tree` supports JSON or Markdown; `list` supports JSON, Markdown, or table output; feedback drafts support JSON or Markdown. With `--format json`, usage or runtime failures leave stdout empty and return a stable `{ "error": { "code", "message", "details", "exit_code" } }` envelope on stderr.

## Local PCR Viewer

Use the static PCR viewer when you want to browse PCR records in a browser:

```bash
npm run viewer:build
npm run viewer:build -- --scope legacy
npm run viewer:serve
```

The build step defaults to material PCRs; use `--scope material|legacy|all` to choose another explicit record scope.
It reads records through `packages/pcr-core`, writes generated data under `packages/pcr-viewer/dist/data/`, and copies
the read-only browser assets into `packages/pcr-viewer/dist/`. Missing or empty selected-scope catalogs fail before
replacement. Custom output directories are replaced only when empty or marked as a previous viewer build; protected
repository and source paths are rejected after canonical path resolution. The replacement is prepared in a sibling
temporary directory so a failed build does not erase the last usable output. The local server also rejects requested
files whose resolved symlink target escapes the build root.

The viewer is a consumption surface only. It does not edit PCR Markdown, manifests, mappings, or `structured.yaml`.

## Migration Status

The consumption surfaces are now material-first: default catalog, tree, list, and viewer output represent methodology
records, while complete classification coverage remains queryable separately. Phase 2 steps 1-5 are complete:
ordinary CPC imports create zero PCR records; CPC 3.0 mapping v2 retains exactly 3 accepted material edges, CPC 2.1
is empty v2, and the deterministic registry preserves all 2,874 retired leaf-derived ids as coverage locators.
CPC 3.0 coverage remains 2,877 total, 3 mapped, 2,874 unmapped, and 0 unknown.

The first Phase 3 physical pilot removed only CPC `99000`. The repository therefore has 2,876 PCR directories:
3 material records and 2,873 surviving legacy scaffolds. Code `99000` now resolves as known-unmapped and its old PCR
id redirects through the alias registry. CPC `98000` and the broader physical migration remain pending; do not treat
the pilot as completion of bulk migration. Only authored or reviewed material records can enter guidance and
validation.
