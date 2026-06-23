# Model Authoring Loop

1. Resolve or select the PCR.
2. Read `guidance` JSON.
3. Treat `reference_flow.required_qualifiers` as required modelling metadata.
4. Use `process_map` to decide required, conditional, optional, and excluded process coverage.
5. Use `process_inventory` rows as expected flow roles, not as a complete foreground dataset.
6. Preserve `amount_kind`, `basis_kind`, `evidence_kind`, and `source_ids` in model notes when translating PCR guidance into data tasks.
7. Run `validate-model` before handoff.
