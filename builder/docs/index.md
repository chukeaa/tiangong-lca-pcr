# Builder Documentation Index

Use this index to choose the smallest relevant builder context.

## Workflows

- `workflows/create-pcr.md`: create a material PCR from an empty scaffold or classification-seeded placeholder.
- `workflows/update-pcr.md`: update an existing PCR from a user request, source file, reviewer note, dataset, or database alignment change.
- `workflows/translate-pcr.md`: keep bilingual PCR renderings aligned.
- `workflows/review-pcr.md`: review PCR methodology quality.
- `workflows/publish-pcr.md`: publish or version a PCR.
- `workflows/intake-feedback-issue.md`: triage external PCR feedback or missing-PCR issues.
- `workflows/update-pcr-from-feedback.md`: apply accepted feedback to PCR content, mappings, translations, or public CLI behavior.

## Contracts

- `contracts/pcr-markdown-contract.md`: authored Markdown structure.
- `contracts/pcr-manifest-contract.md`: lifecycle and identity metadata.
- `contracts/structured-projection-contract.md`: generated `structured.yaml` projection rules.
- `contracts/evidence-and-source-contract.md`: source records and source references.
- `contracts/tiangong-uuid-reference-contract.md`: Tiangong UUID storage rules.

## Tools

- `tools/tiangong-lca-cli.md`: Tiangong CLI lookup use and fallback behavior.
- `tools/data-sources-and-tools.md`: source roles, evidence priority, and tool selection.

## Methods

Read method notes only when the active workflow or PCR topic needs them:

- `methods/reference-flow-decision-rules.md`
- `methods/measurement-unit-rules.md`
- `methods/process-map-rules.md`
- `methods/inventory-flow-pattern-rules.md`
- `methods/range-authoring-rules.md`
- `methods/source-evidence-policy.md`
- `methods/lifecycle-status-policy.md`

## Prompts

Prompt files are thin entrypoints for agent tools. They should point agents to workflows and contracts instead of duplicating workflow content.
