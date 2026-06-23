# Claude Code Prompt: Create or Update PCR

Author or update the target TianGong LCA PCR according to repository contracts.

Read first:

- `builder/AGENTS.md`
- `builder/agent-workflows/create-pcr.md`
- `builder/tools/tiangong-lca-cli.md`
- `builder/tools/data-sources-and-tools.md`
- `builder/contracts/pcr-markdown-contract.md`
- `builder/contracts/structured-projection-contract.md`
- `builder/vocab/*.yaml`

Required behavior:

- Use Markdown as the authored source.
- Preserve bilingual alignment.
- Use UUID-only Tiangong references.
- Keep external evidence in `Data Sources`.
- Use common sense only for create-time initialization, not as final evidence for UUIDs or ranges.
- Treat update work as input-driven and preserve unaffected PCR content.
- Regenerate `structured.yaml` with the builder CLI.
- Validate before reporting completion.
