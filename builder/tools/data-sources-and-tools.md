# Data Sources and Tools

PCR authors may combine common sense, Tiangong database lookup, external evidence, and user-provided materials. The output must distinguish authored judgement from evidence-backed modelling constraints.

## Source Roles

Use Tiangong database lookup for identity:

- flow identity
- flow property identity
- unit or unit group identity
- process or lifecyclemodel identity when required

Use external evidence for modelling constraints:

- quantitative ranges
- emission factors
- yield, loss, moisture, conversion, and allocation factors
- process decomposition that constrains what must be included
- system boundary and cut-off rules
- official product specifications

Use common sense only for initialization:

- candidate process list
- likely input and output flow candidates
- likely product state and required qualifiers
- first-pass boundary hypotheses
- terms to use in searches

Common sense must not be the final authority for UUIDs, quantitative ranges, allocation formulas, or mandatory boundary rules.

## Preferred Evidence Order

Prefer sources in this order when multiple sources are available:

1. official standards, PCR program rules, regulations, and technical guidance
2. official statistical datasets and institutional reports
3. peer-reviewed literature
4. manufacturer or industry technical documents
5. comparable LCA datasets or EPDs used as proxy evidence
6. expert judgement or common sense, only as a temporary initialization aid

## Tooling

Useful authoring tools include:

- Tiangong LCA CLI for database UUID lookup
- web search for official source discovery
- PDF readers for standards, reports, and articles
- spreadsheet tools for tabular datasets
- classification mappings under `classifications/mappings/**`
- builder CLI commands for sync, lint, version bump, and publish

When using web or file sources, cite the stable source in `Data Sources` and reference the source id from the relevant PCR row or rule. Do not store search histories or temporary extraction notes in PCR Markdown.

## User-Provided Inputs

An update request may be driven by:

- a direct user instruction
- a source document or file
- a table or dataset
- reviewer feedback
- a database alignment change
- a classification mapping correction

For every update, identify the driving input before editing. If the input changes rule semantics, update source ids, bilingual text, `structured.yaml`, and manifest lifecycle fields as needed.
