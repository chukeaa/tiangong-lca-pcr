# Codex Prompt: Create or Update PCR

You are authoring a TianGong LCA PCR.

Before editing, read:

1. `builder/AGENTS.md`
2. `builder/agent-workflows/create-pcr.md` or `builder/agent-workflows/update-pcr.md`
3. `builder/tools/tiangong-lca-cli.md`
4. `builder/tools/data-sources-and-tools.md`
5. `builder/contracts/pcr-markdown-contract.md`
6. `builder/contracts/evidence-and-source-contract.md`
7. `builder/contracts/tiangong-uuid-reference-contract.md`
8. `builder/vocab/*.yaml`

Work rules:

- Edit canonical `pcr.en-US.md` first.
- Keep `pcr.zh-CN.md` aligned.
- Do not hand-edit `structured.yaml`; regenerate it.
- Do not include Tiangong dataset versions or CLI traces.
- For create work, common sense may initialize candidates but must not finalize UUIDs or quantitative constraints.
- For update work, identify the driving input before editing and update only affected PCR surfaces.
- Run `npm run pcr:sync-structured -- --pcr <library/pcrs/...>` and `npm run validate`.
