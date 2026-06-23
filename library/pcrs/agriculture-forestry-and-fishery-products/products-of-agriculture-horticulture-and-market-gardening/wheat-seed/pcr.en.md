---
pcr_id: pcr.agriculture-forestry-and-fishery-products.products-of-agriculture-horticulture-and-market-gardening.wheat-seed
language: en
status: draft
sync_with: pcr.zh-CN.md
---

# Wheat Seed for Sowing

## 1. Status and Use

This PCR is an example draft for evaluating the TianGong PCR Markdown structure. It is suitable for testing human and agent authoring workflows, but the numerical screening ranges and modelling choices require domain review before operational use.

Use this PCR when constructing lifecycle models or unit processes for cleaned wheat seed intended for sowing, including certified, foundation, or comparable seed classes. Do not use it for wheat grain produced for food, feed, starch, ethanol, or commodity trading unless the seed-specific operations are outside the system boundary and the product is explicitly reclassified.

## 2. Product Category Identity

- Canonical PCR id: `pcr.agriculture-forestry-and-fishery-products.products-of-agriculture-horticulture-and-market-gardening.wheat-seed`
- External classification seed: CPC 3.0 `01111`, `Wheat, seed`
- Product type: agricultural product
- Typical producing system: field cultivation followed by post-harvest seed conditioning
- Typical market state: cleaned, graded, packaged, and optionally treated wheat seed at farm gate, seed plant gate, or regional distribution point

The PCR identity is independent of CPC. CPC provides an entry point and mapping, while this PCR remains the canonical modelling rule.

## 3. Reference Flow

The preferred reference flow is:

```text
1 kg wheat seed for sowing, cleaned and graded, at seed plant gate
```

Acceptable variants:

| Reference flow | Preferred unit | Required qualifiers |
| --- | --- | --- |
| Wheat seed for sowing, untreated | kg | seed class, moisture basis, germination rate, purity, location, gate |
| Wheat seed for sowing, treated | kg | treatment active ingredients, application rate, seed class, moisture basis, gate |
| Packaged certified wheat seed | kg | package material, package size, seed treatment status, storage duration |
| Bulk wheat seed delivered to farm | kg or tonne | transport distance, delivery mode, seed treatment status |

Avoid seed-count reference flows unless the study goal is explicitly agronomic performance. If seed count is used, also provide thousand-kernel weight or another conversion to mass.

## 4. Flow Properties and Unit Conventions

Use `mass` as the primary flow property. Common units are `kg` and `tonne`.

Declare these quality properties when available:

| Property | Common unit | Typical screening range |
| --- | --- | --- |
| Moisture content | percent wet basis | 10-14 percent |
| Physical purity | percent by mass | 95-99.9 percent |
| Germination rate | percent of seeds | 85-98 percent |
| Thousand-kernel weight | g/1000 seeds | 25-60 g |
| Seed treatment loading | g active ingredient/kg seed | 0-10 g/kg |

Ranges are screening aids, not acceptance criteria. Use local seed certification standards when they are available.

## 5. System Boundary

The default boundary is cradle-to-gate for wheat seed production:

1. Production and transport of upstream inputs.
2. Field seed multiplication: land preparation, sowing, fertilization, irrigation where applicable, crop protection, harvesting.
3. Post-harvest handling: drying, cleaning, grading, seed testing, seed treatment, packaging, and storage.
4. Transport to the declared gate if the reference flow is delivered seed.

Exclude downstream crop production that uses the seed unless the lifecycle model explicitly studies seed as an input to wheat cultivation. Exclude capital goods by default unless they are material for the goal and scope. Include land occupation and land transformation if the impact method or study goal requires land use accounting.

## 6. Common Process Decomposition

Build the lifecycle model from these process nodes when data are available:

| Process | Role | Notes |
| --- | --- | --- |
| Breeder or foundation seed supply | upstream product input | model as seed input to multiplication field |
| Field preparation and sowing | foreground process | include seed rate, tillage, machinery fuel, and field losses |
| Crop nutrient management | foreground process | include mineral fertilizer, organic amendments, lime, and nutrient emissions |
| Crop protection | foreground process | include herbicides, fungicides, insecticides, and seed crop inspections if material |
| Irrigation | conditional foreground process | include pumping energy and water withdrawal when irrigated |
| Harvesting and field drying | foreground process | include combine fuel, grain moisture at harvest, and field losses |
| Seed drying and conditioning | foreground process | include drying energy, cleaning electricity, rejected material, and dust if measured |
| Seed treatment and packaging | conditional foreground process | include active ingredients, coating materials, bags, pallets, and waste |
| Storage and gate transport | conditional foreground process | include storage electricity or losses and declared transport leg |

## 7. Inventory Flow Requirements

### 7.1 Product Inputs

| Flow | Flow type | Direction | Typical screening range |
| --- | --- | --- | --- |
| Breeder, foundation, or previous-generation wheat seed | product | input | 120-250 kg/ha |
| Nitrogen fertilizer, as N | product | input | 60-220 kg N/ha |
| Phosphate fertilizer, as P2O5 | product | input | 20-100 kg P2O5/ha |
| Potash fertilizer, as K2O | product | input | 0-100 kg K2O/ha |
| Lime or soil amendment | product | input | 0-3000 kg/ha |
| Crop protection products | product | input | 0.1-10 kg active ingredient/ha |
| Diesel for field operations | product | input | 30-120 L/ha |
| Electricity for cleaning and conditioning | product | input | 5-80 kWh/t cleaned seed |
| Heat or fuel for drying | product | input | 0-500 MJ/t cleaned seed |
| Packaging materials | product | input | 0-50 kg packaging/t seed |

### 7.2 Product Outputs and Waste Outputs

| Flow | Flow type | Direction | Typical screening range |
| --- | --- | --- | --- |
| Cleaned wheat seed for sowing | product | output | 2-7 t/ha before allocation |
| Grain-like rejected seed or screenings | product or waste | output | 1-20 percent of harvested mass |
| Straw | product, residue, or left on field | output | 2-8 t dry matter/ha |
| Packaging waste | waste | output | 0-50 kg/t seed |
| Dust and cleaning residues | waste | output | site-specific |

Classify screenings as product only when there is documented beneficial use or market value. Otherwise classify them as waste and model treatment or disposal.

### 7.3 Elementary Flows

| Flow | Flow type | Compartment | Modelling guidance |
| --- | --- | --- | --- |
| Dinitrogen monoxide | elementary | air | estimate from applied and mineralized nitrogen using regional or IPCC-compatible factors |
| Ammonia | elementary | air | include fertilizer and manure volatilization when nitrogen inputs are present |
| Nitrogen oxides | elementary | air | include if the selected agricultural emission model provides it |
| Nitrate | elementary | water | include leaching and runoff based on regional soil and climate conditions |
| Phosphorus compounds | elementary | water | include erosion or runoff where relevant |
| Carbon dioxide, fossil | elementary | air | from diesel, heat, electricity, and upstream inputs |
| Pesticide active ingredients | elementary | soil, air, water | include emissions when the impact method supports pesticide fate |
| Water withdrawal | elementary | water | include irrigation source and region where irrigated |
| Land occupation | elementary | land | include crop area and duration when land use is in scope |

## 8. Allocation and Co-Product Handling

Use physical partitioning only when a defensible physical relationship exists. Otherwise use this order:

1. Avoid allocation by subdividing seed production, grain use, straw management, and screening treatment processes.
2. Apply substitution for co-products only when the displaced product and market are documented.
3. Apply economic allocation when seed, grain-like screenings, and straw are marketed products and price data are reliable.
4. Apply mass allocation as a fallback and flag the model for review.

Rejected seed, screenings, and straw must not disappear from the model. They require one of: product output, waste treatment, field return, open burning, incorporation, animal feed use, or other documented fate.

## 9. Data Quality Requirements

Minimum foreground data:

- geography and production year or multi-year average
- field yield and cleaned seed yield
- seed rate and seed class
- fertilizer type and application rate
- irrigation status and water source
- field fuel use or operation list
- drying, cleaning, and packaging energy
- seed treatment status and active ingredients
- co-product and waste fate

Preferred data quality:

- at least three-year average for field yield in weather-sensitive regions
- primary data for seed cleaning yield and reject rate
- region-specific fertilizer emission factors
- supplier-specific electricity mix when conditioning is energy intensive
- explicit moisture basis for harvested and cleaned seed

## 10. Agent Modelling Instructions

When an agent constructs a `lifecyclemodel` from this PCR:

1. Create a foreground process named `wheat seed production and conditioning`.
2. Set the quantitative reference to the declared reference flow.
3. Add field production, conditioning, treatment, packaging, and gate transport as separate processes when data are available.
4. Tag flows as `product`, `waste`, or `elementary`; do not infer elementary flows from product names alone.
5. Preserve uncertainty and source notes for all screening-range assumptions.
6. If a required value is unknown, insert a review placeholder instead of inventing a precise value.

## 11. Validation Checklist

Before publishing a process or lifecycle model using this PCR, check:

- the reference flow includes mass, gate, seed treatment status, and seed quality qualifiers
- the model distinguishes seed product from commodity grain
- fertilizer, fuel, irrigation, conditioning energy, packaging, and seed treatment inputs are addressed
- N2O, ammonia, nitrate, fossil CO2, water withdrawal, and land occupation are considered when in scope
- screenings, rejected seed, straw, and packaging waste have declared fates
- allocation method is declared and justified
- all values outside screening ranges have a source note or review flag

## 12. Open Review Questions

- Which seed certification classes should be represented as variants under this PCR versus separate PCR records?
- Should treated and untreated wheat seed share one PCR with treatment qualifiers, or should treatment create a child PCR?
- Which regional agronomic models should be preferred for nitrogen and pesticide emissions?
- Should this PCR define a standard cut-off for farm machinery and seed plant capital equipment?
