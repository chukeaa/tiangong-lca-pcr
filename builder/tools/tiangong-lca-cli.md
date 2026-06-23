# Tiangong LCA CLI Authoring Tool

Use the Tiangong LCA CLI to look up database-backed identity references while authoring PCR records.

The CLI is an authoring tool. PCR Markdown and `structured.yaml` store selected UUIDs, not command traces, query logs, dataset versions, API keys, or private runtime paths.

## Availability

Prefer an installed `tiangong-lca` binary when available:

```bash
tiangong-lca --help
```

In the workspace checkout, the sibling CLI repository may also be used:

```bash
cd ../tiangong-lca-cli
node ./bin/tiangong-lca.js --help
```

If neither entry point is available, continue authoring semantic candidates but do not invent UUIDs. Leave UUID-backed rows blank or mark the gap in `manifest.yaml` review metadata according to the manifest contract.

## PCR Lookup Use

Use CLI lookup for:

- product, waste, and elementary flow UUIDs
- flow property UUIDs
- unit or unit group UUIDs when the CLI exposes them
- process or lifecyclemodel references when a PCR needs database-backed process identity

Typical lookup shape:

```bash
tiangong-lca search flow --input ./search-flow.request.json --json
tiangong-lca flow get --id <flow-id> --json
tiangong-lca search process --input ./search-process.request.json --json
```

Use `search flow` to find candidates, then use `flow get` or the most specific available command to confirm the selected row before copying UUIDs into PCR content.

## Storage Rules

PCR content may store:

- selected UUID
- selected flow property UUID
- selected unit or unit group UUID
- modelling role of the reference

PCR content must not store:

- Tiangong dataset version
- CLI command output blocks
- lookup trace tables
- local request file paths
- credentials, tokens, or private endpoints

Tiangong is the default source for UUID-bearing identity references. Do not list Tiangong database rows in `Data Sources` unless a specific row is being used as non-default quantitative evidence for a range, factor, or method rule.

## Fallback Behavior

When the CLI cannot resolve a UUID:

1. Keep the human-readable flow candidate if it is useful for PCR drafting.
2. Do not fabricate UUIDs or unit support rows.
3. Prefer leaving the UUID cell empty over writing a weak substitute.
4. Record the unresolved identity issue in `manifest.yaml` review metadata, not in the PCR Markdown body.
5. Re-run lookup before publish.
