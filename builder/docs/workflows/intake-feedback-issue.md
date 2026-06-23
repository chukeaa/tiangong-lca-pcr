# Intake Feedback Issue Workflow

Use this workflow when reading a PCR feedback or missing PCR issue.

## Steps

1. Identify the feedback type, PCR id, affected section, process_id, flow role, and evidence sources.
2. Classify the work as one of:
   - PCR methodology content
   - classification mapping
   - Tiangong UUID identity
   - quantitative range or source evidence
   - bilingual translation
   - public CLI or validator behavior
3. Verify cited sources and Tiangong UUIDs before editing PCR content.
4. Decide whether the issue is actionable, needs more information, is already covered, or should become a new missing-PCR task.
5. If actionable, use `builder/docs/workflows/update-pcr-from-feedback.md`.
6. Comment on the issue with the intake decision, required files, and whether a PCR version bump is expected.

## Rules

- Treat feedback as candidate evidence, not accepted PCR truth.
- Do not edit `structured.yaml` directly.
- For methodology changes, update canonical `pcr.en-US.md` first, then align `pcr.zh-CN.md`.
- For mapping-only changes, update `classifications/mappings/**` and avoid duplicating PCR records.
- For public CLI issues, update `packages/**`, tests, and the consumption docs rather than builder authoring contracts unless the contract changes.
