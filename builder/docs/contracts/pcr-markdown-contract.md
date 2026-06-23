# PCR Markdown Contract

This contract defines the authored PCR Markdown shape consumed by agents and builder tooling.

## Files

Each PCR directory must contain:

- `manifest.yaml`
- `pcr.en-US.md`
- `pcr.zh-CN.md`
- `structured.yaml`

`pcr.en-US.md` is the canonical authored source. `pcr.zh-CN.md` is an aligned rendering of the same rule.

## Required Sections

Material PCR Markdown must use this section order:

1. Scope and Applicability
2. Product Category Identity
3. Reference Flow
4. Measurement and Unit Rules
5. System Boundary
6. Process Inventory Structure
7. Allocation and Co-product Handling
8. Data Quality and Evidence Rules
9. Validation Rules
10. Data Sources

## Reference Flow

The reference flow section must define one declared reference object using this table:

```markdown
| Field | Value |
| --- | --- |
| Reference amount |  |
| Reference product flow | <name> `<uuid>` |
| Reference flow property | <name> `<uuid>` |
| Reference unit group | <name> `<uuid>` |
| Reference unit |  |
| Required qualifiers | qualifier; qualifier |
```

`Required qualifiers` are category-specific descriptors that must be declared when constructing concrete `process` or `lifecyclemodel` records.

Do not add a second free-text reference flow that repeats or conflicts with this table.

## Measurement and Unit Rules

The measurement section must define rules, not a catalog:

```markdown
| rule_id | Applies to | Required property | Required unit | Rule |
| --- | --- | --- | --- | --- |
| `reference_mass` | reference product | Mass `<uuid>` | kg | ... |
```

Rules should constrain modelling consistency, conversion, or validation. Ordinary units used by individual inventory rows belong in those rows.

## Process Inventory

Process inventory must be organized as:

```markdown
### Process Map

| process_id | process_name | inclusion | inclusion_condition | role | quantitative_reference |
| --- | --- | --- | --- | --- | --- |

### Process: <process_id>

#### Inputs

##### Product flows
##### Waste flows
##### Elementary flows

#### Outputs

##### Product flows
##### Waste flows
##### Elementary flows
```

Inventory row tables must keep stable columns:

```markdown
| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
```

## Data Sources

Data Sources must use stable source ids:

```markdown
| Source id | Type | Reference | Used for |
```

List external sources, standards, literature, official guidance, and non-default quantitative evidence. Do not list Tiangong database rows when they only support UUID identity.
