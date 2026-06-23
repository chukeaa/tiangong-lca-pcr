# Create PCR Workflow

Use this workflow when authoring a material PCR from an empty scaffold or classification-seeded placeholder.

## Inputs

- target PCR directory under `library/pcrs/**`
- target product category and classification mapping context
- Tiangong CLI or database access for UUID lookup
- external sources for ranges, factors, process decomposition, and boundary rules
- optional user notes, seed examples, or source files

Create is an initialization workflow. The agent may use domain common sense to draft candidate process structure, likely flows, product state, and required qualifiers. That freedom is limited to initialization: UUIDs, quantitative ranges, allocation formulas, and mandatory boundary rules must be backed by Tiangong lookup or cited external evidence before they are treated as final PCR content.

## Steps

1. Read `builder/AGENTS.md`, `builder/docs/tools/tiangong-lca-cli.md`, `builder/docs/tools/data-sources-and-tools.md`, `builder/docs/contracts/pcr-markdown-contract.md`, `builder/docs/contracts/evidence-and-source-contract.md`, and `builder/vocab/*.yaml`.
2. Inspect `manifest.yaml`, classification refs, and mapping entries.
3. Confirm whether an existing PCR already covers the same product category. If yes, update mappings instead of duplicating the PCR.
4. Draft scope, exclusions, product category identity, typical market state, candidate processes, and likely flows. Common sense is allowed here, but keep weak assumptions out of final quantitative constraints.
5. Define one reference flow object using the `Field | Value` table.
6. Use Tiangong CLI or database search to select UUID-bearing flow, flow property, and unit group references. Leave unresolved UUIDs blank rather than inventing them.
7. Define measurement and unit rules only where they affect consistency, conversion, or validation.
8. Define common modelling processes before writing detailed inventory rows.
9. For each process, write inventory rows by direction and flow type: product, waste, elementary.
10. Record amounts or ranges only when they have a defensible basis. Use controlled vocabularies for `amount_kind`, `basis_kind`, and `evidence_kind`.
11. Add external data sources and reference their source ids from inventory or rule rows.
12. Move unresolved identity, range, or evidence gaps into `manifest.yaml` review metadata instead of putting review notes in PCR Markdown.
13. Write `pcr.en-US.md` first.
14. Write `pcr.zh-CN.md` as an aligned rendering of the same rule.
15. Run `npm run pcr:sync-structured -- --pcr <library/pcrs/...>`.
16. Run `npm run validate`.
17. Update `manifest.yaml` lifecycle fields only when content maturity changes.

## Do Not

- do not invent UUIDs
- do not record Tiangong dataset versions
- do not use external classification codes as canonical PCR directory identity
- do not put authoring traces or unresolved review notes in PCR Markdown
- do not insert placeholder ranges where foreground evidence is required
- do not turn common-sense initialization into final quantitative PCR rules without evidence
