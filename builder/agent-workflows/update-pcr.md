# Update PCR Workflow

Use this workflow when changing an existing material PCR.

Update is an input-driven workflow. Do not start by rewriting the PCR from general knowledge. First identify the change driver, then update only the affected PCR surfaces.

## Inputs

An update may be driven by:

- direct user instruction
- source document, file, table, or dataset
- reviewer feedback
- Tiangong database alignment change
- classification mapping correction
- publication or lifecycle requirement

## Steps

1. Read `builder/AGENTS.md`, `builder/tools/tiangong-lca-cli.md`, `builder/tools/data-sources-and-tools.md`, and the relevant contracts.
2. Read the target PCR's `manifest.yaml`, `pcr.en-US.md`, `pcr.zh-CN.md`, and `structured.yaml`.
3. Identify the driving input and whether it changes identity, reference flow, measurement rules, process inventory, evidence, translation, classification refs, or lifecycle status.
4. If the input is a document, file, or dataset, extract only the PCR-relevant claims and create or update stable source ids.
5. If the input is a Tiangong alignment change, update UUID-bearing references without adding Tiangong rows to `Data Sources` unless they provide non-default quantitative evidence.
6. Update canonical `pcr.en-US.md` first.
7. Update `pcr.zh-CN.md` so it remains aligned with the English rule.
8. Add or update external data sources when a new range, factor, method, or boundary rule depends on non-default evidence.
9. Remove stale source ids and inventory rows that no longer support the PCR.
10. Update `manifest.yaml` review metadata when the input creates unresolved identity, evidence, or translation gaps.
11. Run `npm run pcr:sync-structured -- --pcr <library/pcrs/...>`.
12. Run `npm run validate`.
13. Use `npm run pcr:bump -- --pcr <library/pcrs/...> --level <patch|minor|major>` when the rule semantics or published lifecycle changes.

## Version Guidance

- patch: wording, source clarification, non-breaking range clarification
- minor: new process, new measurement rule, expanded scope within the same category
- major: reference flow change, category meaning change, incompatible boundary or allocation change
