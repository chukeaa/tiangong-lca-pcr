# Range Authoring Rules

Typical ranges are authoring priors and QA guardrails. They are not substitutes for source-backed field evidence.

Every inventory amount should declare:

- `amount`: numeric value, range, formula description, or foreground-data requirement
- `amount_kind`: value shape, using `builder/vocab/amount-kind.yaml`
- `basis`: human-readable normalization basis, such as `per 1,000 kg reference product`
- `basis_kind`: normalized basis category, using `builder/vocab/basis-kind.yaml`
- `evidence_kind`: evidence category, using `builder/vocab/evidence-kind.yaml`
- `source_ids`: source ids for external evidence or method formulas
- conversion notes when an area-based or process-row value is normalized to the PCR reference flow

Prefer narrow ranges only when a source supports them. When no defensible range is available, set `amount_kind` to `site_specific`, set `evidence_kind` to `foreground_data`, and require foreground evidence instead of inserting a placeholder range.
