# Inventory Flow Pattern Rules

Author new PCR inventory content as process inventory, not as a flat inventory list.

Each material PCR should break the product category into common modelling processes first. Within each process, organize the inventory in this order:

1. direction: `inputs` or `outputs`
2. flow type: `product`, `waste`, or `elementary`
3. individual flow rows

Each flow row should record:

- modelling role
- flow type
- Tiangong flow UUID when a database flow exists
- flow property UUID
- unit group UUID
- preferred reference unit
- amount or expected range, when useful
- `amount_kind`, using `builder/vocab/amount-kind.yaml`
- basis, such as `per 1,000 kg reference product`
- `basis_kind`, using `builder/vocab/basis-kind.yaml`
- `evidence_kind`, using `builder/vocab/evidence-kind.yaml`
- source ids that support non-default quantitative evidence or method formulas

Keep flow identity evidence separate from range evidence. A database flow search can justify the UUID choice, but it does not by itself justify an inventory amount range unless a process row or external source supports that amount.
