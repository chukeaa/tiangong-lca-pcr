---
name: tiangong-pcr
description: Use when selecting a TianGong PCR, reading PCR modelling guidance, validating an LCA process/lifecyclemodel against PCR rules, or drafting PCR feedback for maintainers.
---

# TianGong PCR

Use the checked-in PCR library through `tiangong-pcr`. Do not select PCR rules from memory when the CLI is available.

Use command-specific help when unsure about arguments or output shape:

```bash
npm --silent run tiangong-pcr -- --help
npm --silent run tiangong-pcr -- list --help
npm --silent run tiangong-pcr -- guidance --help
```

## Workflow

1. If the user provides an external classification code, resolve it deterministically:

   ```bash
   npm --silent run tiangong-pcr -- resolve --classification cpc:3.0:01111 --format json
   ```

2. If no classification code is available, inspect the catalog explicitly:

   ```bash
   npm --silent run tiangong-pcr -- tree --depth 3 --format markdown
   npm --silent run tiangong-pcr -- list --status candidate --format json
   npm --silent run tiangong-pcr -- list --page 2 --page-size 10
   ```

   `list` defaults to 10 records per page. Follow `next_command` in JSON output or the "Next page" line in human-readable output. Choose a PCR from product meaning, declared gate, reference flow, and process boundary. Do not treat catalog browsing as fuzzy search.

3. Read Agent-facing modelling guidance:

   ```bash
   npm --silent run tiangong-pcr -- guidance --pcr <pcr-id> --format json
   ```

4. Build the `process` or `lifecyclemodel` from `reference_flow`, `measurement_rules`, `process_map`, and `process_inventory`.

5. Validate the model draft:

   ```bash
   npm --silent run tiangong-pcr -- validate-model --pcr <pcr-id> --input <model-file> --format json
   ```

6. If the PCR is missing, ambiguous, outdated, mistranslated, or has weak evidence, draft feedback instead of silently patching around it:

   ```bash
   npm --silent run tiangong-pcr -- feedback draft --pcr <pcr-id> --type range_evidence_update --summary "<finding>"
   ```

## Boundaries

- `pcr.en-US.md` remains the canonical authored PCR source.
- `structured.yaml` is generated and consumed by `tiangong-pcr guidance`.
- Tiangong UUIDs from PCR guidance must be copied without dataset versions.
- Feedback issues are candidate evidence for maintainers. They are not accepted PCR truth until reviewed and merged.
- Use `missing_pcr` feedback only after checking `tree`, `list`, and any relevant classification mapping.
