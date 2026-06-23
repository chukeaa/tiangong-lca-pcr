# Update PCR From Feedback Workflow

Use this workflow after a PCR feedback issue has passed intake.

## Steps

1. Read the issue, affected PCR files, and relevant contract or method note.
2. Reproduce the current guidance when relevant:

   ```bash
   npm run tiangong-pcr -- guidance --pcr <pcr-id> --format json
   ```

3. Apply the smallest PCR change that addresses the accepted feedback.
4. If methodology content changes, edit `pcr.en-US.md`, align `pcr.zh-CN.md`, and run:

   ```bash
   npm run pcr:sync-structured -- --pcr <library/pcrs/...>
   ```

5. If lifecycle status or version changes, run `pcr:bump` or `pcr:publish`.
6. Run:

   ```bash
   npm run validate
   ```

7. Record the resolution in the issue: accepted change, evidence used, files changed, version impact, and remaining follow-up.

## Acceptance

- The issue evidence is traceable from PCR `Data Sources`, mapping files, or maintainer comments.
- English and Chinese PCR renderings stay semantically aligned.
- `structured.yaml` matches canonical Markdown.
- Public CLI guidance reflects the accepted PCR change.
