# tiangong-pcr CLI Usage

The public CLI is for PCR consumption during LCA data construction.

```bash
npm run tiangong-pcr -- list --status candidate --format json
npm run tiangong-pcr -- tree --depth 3 --format markdown
npm run tiangong-pcr -- resolve --classification cpc:3.0:01111 --format json
npm run tiangong-pcr -- show --pcr <pcr-id> --lang zh-CN
npm run tiangong-pcr -- guidance --pcr <pcr-id> --format json
npm run tiangong-pcr -- validate-model --pcr <pcr-id> --input <file> --format json
npm run tiangong-pcr -- feedback draft --pcr <pcr-id> --type <feedback-type> --summary "<finding>"
```

`list` and `tree` are explicit catalog browsing commands, not semantic search. Prefer `resolve` when a classification code is available.
