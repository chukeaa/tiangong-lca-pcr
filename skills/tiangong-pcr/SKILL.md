---
name: tiangong-pcr
description: Use when selecting a TianGong PCR, reading PCR modelling guidance, validating an LCA process/lifecyclemodel against PCR rules, or drafting PCR feedback for maintainers.
---

# TianGong PCR

Use the checked-in PCR library through `tiangong-pcr`. Do not select PCR rules from memory when the CLI is available.

## Workflow

1. If the user provides an external classification code, resolve it deterministically:

   ```bash
   npm run tiangong-pcr -- resolve --classification cpc:3.0:01111 --format json
   ```

2. If no classification code is available, inspect the catalog explicitly:

   ```bash
   npm run tiangong-pcr -- tree --depth 3 --format markdown
   npm run tiangong-pcr -- list --status candidate --format json
   ```

   Choose a PCR from product meaning, declared gate, reference flow, and process boundary. Do not treat catalog browsing as fuzzy search.

3. Read Agent-facing modelling guidance:

   ```bash
   npm run tiangong-pcr -- guidance --pcr <pcr-id> --format json
   ```

4. Build the `process` or `lifecyclemodel` from `reference_flow`, `measurement_rules`, `process_map`, and `process_inventory`.

5. Validate the model draft:

   ```bash
   npm run tiangong-pcr -- validate-model --pcr <pcr-id> --input <model-file> --format json
   ```

6. If the PCR is missing, ambiguous, outdated, mistranslated, or has weak evidence, draft feedback instead of silently patching around it:

   ```bash
   npm run tiangong-pcr -- feedback draft --pcr <pcr-id> --type range_evidence_update --summary "<finding>"
   ```

## Boundaries

- `pcr.en-US.md` remains the canonical authored PCR source.
- `structured.yaml` is generated and consumed by `tiangong-pcr guidance`.
- Tiangong UUIDs from PCR guidance must be copied without dataset versions.
- Feedback issues are candidate evidence for maintainers. They are not accepted PCR truth until reviewed and merged.
- Use `missing_pcr` feedback only after checking `tree`, `list`, and any relevant classification mapping.
