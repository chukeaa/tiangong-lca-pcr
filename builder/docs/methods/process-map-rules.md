# Process Map Rules

PCR process inventories should start from a process map before detailed flow rows are authored.

The process map should identify:

- stable process id
- process label
- inclusion status, using `builder/vocab/process-inclusion.yaml`
- inclusion condition for every `conditional` process
- role in the model, such as foreground production, conditioning, storage, delivery, use, or end-of-life
- quantitative reference or output basis when relevant

The detailed `### Process: <process_id>` sections should align with the process map. Every `required` process in the Process Map must have a matching detailed inventory section. Every detailed inventory section must match one `process_id` in the Process Map.

Use process ids that are stable slugs. Do not use classification codes as process ids.
