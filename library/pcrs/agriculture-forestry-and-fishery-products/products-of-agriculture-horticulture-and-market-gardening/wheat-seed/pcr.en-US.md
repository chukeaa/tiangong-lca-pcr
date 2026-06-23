---
pcr_id: pcr.agriculture-forestry-and-fishery-products.products-of-agriculture-horticulture-and-market-gardening.wheat-seed
language: en-US
status: candidate
sync_with: pcr.zh-CN.md
---

# Wheat Seed for Sowing

## 1. Scope and Applicability

This PCR guides construction of `process` and `lifecyclemodel` records for cleaned wheat seed intended for sowing, including certified, foundation, registered, or comparable seed classes. It covers seed multiplication, post-harvest seed conditioning, optional seed treatment, packaging, storage, and delivery to the declared gate.

Do not use this PCR for commodity wheat grain for food, feed, starch, ethanol, or trading unless seed-specific operations are outside the system boundary and the product is explicitly reclassified.

## 2. Product Category Identity

- Canonical PCR id: `pcr.agriculture-forestry-and-fishery-products.products-of-agriculture-horticulture-and-market-gardening.wheat-seed`
- External classification entry: CPC 3.0 `01111`, `Wheat, seed`
- Product type: agricultural product
- Typical production route: seed multiplication field plus post-harvest seed conditioning
- Typical market state: cleaned, graded, packaged, and optionally treated wheat seed at seed plant gate or regional delivery point

The PCR identity is independent of CPC. CPC provides a mapping entry only; the semantic PCR directory remains the stable methodology record.

## 3. Reference Flow

| Field | Value |
| --- | --- |
| Reference amount | 1 kg |
| Reference product flow | Wheat `12da5e7d-9b93-4404-8c7d-08f98bec6238` |
| Reference flow property | Mass `93a60a56-a3c8-11da-a746-0800200b9a66` |
| Reference unit group | Units of mass `93a60a57-a4c8-11da-a746-0800200c9a66` |
| Reference unit | kg |
| Required qualifiers | seed class or certification class; treatment status; moisture basis; physical purity; germination rate; geography and declared gate; packaging state |

When constructing a `process` or `lifecyclemodel`, the items listed in `Required qualifiers` must be declared in the process description, lifecycle model metadata, reference flow comment, product description, or an equivalent model field. If an item is not applicable, state why; if it is missing, treat the reference flow definition as incomplete.

Avoid seed-count reference flows unless the study goal is agronomic performance. If seed count is used, also provide thousand-kernel weight or another conversion to mass.

## 4. Measurement and Unit Rules

| rule_id | Applies to | Required property | Required unit | Rule |
| --- | --- | --- | --- | --- |
| `reference_mass` | reference product | Mass `93a60a56-a3c8-11da-a746-0800200b9a66` | kg | The reference flow must be expressed as kg cleaned wheat seed for sowing. |
| `seed_count_conversion` | optional seed-count data | Mass `93a60a56-a3c8-11da-a746-0800200b9a66` | kg | Seed count data may be used only when thousand-kernel weight or another transparent conversion to mass is provided. |
| `fertilizer_n_basis` | nitrogen fertilizer inputs and nitrogen emissions | Mass `93a60a56-a3c8-11da-a746-0800200b9a66` | kg | Record nitrogen fertilizer as kg product and kg N when nitrogen emissions are modelled. |
| `energy_inventory` | electricity, fuel, and drying energy | Net calorific value `93a60a56-a3c8-11da-a746-0800200c9a66` | MJ or kWh | State the energy unit used in each inventory row and preserve enough information for conversion. |
| `packaging_count` | count-based packaging data | Number of items `01846770-4cfe-4a25-8ad9-919d8d378345` | item | Count-based packaging data must also state bag capacity or mass when packaging material burdens are modelled by mass. |

Seed quality properties are foreground attributes, not replacement flow properties:

| Attribute | Common unit | Typical range | Source ids |
| --- | --- | --- | --- |
| Moisture content | percent wet basis | 10-14 percent | `fao-wheat-seed-production` |
| Physical purity | percent by mass | 95-99.9 percent | `fao-wheat-seed-production` |
| Germination rate | percent of seeds | 85-98 percent | `fao-wheat-seed-production`, `umn-small-grain-seeding-rate` |
| Thousand-kernel weight | g/1000 seeds | 25-60 g | `unl-wheat-seeding-rate`, `umn-small-grain-seeding-rate` |
| Seed treatment loading | g active ingredient/kg seed | product-specific |  |

## 5. System Boundary

The default boundary is cradle-to-gate for wheat seed production:

1. Upstream production and transport of seed, fertilizer, fuel, electricity, crop protection products, seed treatment chemicals, and packaging.
2. Field seed multiplication: land preparation, sowing, fertilization, irrigation where applicable, crop protection, field inspections when material, harvesting, and field drying.
3. Seed conditioning: drying, cleaning, grading, testing, treatment, packaging, and storage.
4. Transport to the declared gate when the reference flow is delivered seed.

Exclude downstream crop production using the seed unless the lifecycle model explicitly studies seed as an input to wheat cultivation. Exclude capital goods by default unless they are material for the goal and scope. Include land occupation and land transformation when required by the impact method or study goal.

## 6. Process Inventory Structure

### Process Map

| process_id | process_name | inclusion | inclusion_condition | role | quantitative_reference |
| --- | --- | --- | --- | --- | --- |
| field_seed_multiplication | Field Seed Multiplication | required |  | foreground | harvested seed crop |
| seed_conditioning_and_treatment | Seed Conditioning and Treatment | required |  | foreground | cleaned seed output |
| storage_and_delivery | Storage and Delivery | conditional | include when the declared gate is delivered seed or storage materially affects the reference flow | foreground/downstream | delivered seed |

### Process: field_seed_multiplication

#### Inputs

##### Product flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Previous-generation wheat seed | Wheat | `12da5e7d-9b93-4404-8c7d-08f98bec6238` | Mass / kg | 25-70 kg | range | per 1,000 kg harvested seed crop | process_output | external_source | `unl-wheat-seeding-rate`, `umn-small-grain-seeding-rate` |
| Nitrogen fertilizer carrier | Urea | `3f8850c0-f718-4c4b-8fcb-8fd42e03aa8e` | Mass / kg | site-specific; record both kg product and kg N | site_specific | per 1,000 kg harvested seed crop | process_output | foreground_data | `ipcc-2019-managed-soils-n2o` |
| Phosphate fertilizer | Phosphate fertilizer | `9c196b01-6aad-4252-a6e8-f853853a830c` | Mass / kg | site-specific | site_specific | per 1,000 kg harvested seed crop | process_output | foreground_data |  |
| Potassium fertilizer | Potassium fertilizer | `dd008d87-16e4-4e85-a048-b9949f6fbca6` | Mass / kg | site-specific | site_specific | per 1,000 kg harvested seed crop | process_output | foreground_data |  |
| Irrigation water supplied as a product input | Irrigation water | `4ad684b1-8e85-4dee-8d9c-55d1fa2d4432` | Mass / kg | 0-5,000 kg | range | per 1,000 kg harvested seed crop | process_output | foreground_data |  |
| Field machinery fuel | Diesel, burned in agricultural machinery | `57e0b1a3-2d05-46b2-b61b-cf7b5b167c6f` | Mass / kg | 5-40 kg | range | per 1,000 kg harvested seed crop | process_output | foreground_data |  |
| Crop protection herbicide proxy | Herbicide | `c1370404-9e2b-4ed6-ba96-c094f74e0f2d` | Mass / kg | product-specific | product_specific | per active ingredient or formulated product | process_output | foreground_data |  |
| Crop protection fungicide proxy | Azoxystrobin | `8a1f4968-6428-413f-a50b-b413bf9190cf` | Mass / kg | product-specific | product_specific | per active ingredient or formulated product | process_output | foreground_data |  |
| Crop protection insecticide proxy | Insecticide | `ba2ec0c8-d5da-4ca8-bf9f-317478a1ce1b` | Mass / kg | product-specific | product_specific | per active ingredient or formulated product | process_output | foreground_data |  |

##### Waste flows

No waste input is normally required for the field multiplication process. Include reused organic amendments or recovered irrigation water only when they cross the process boundary as waste-derived inputs.

##### Elementary flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Land occupation | Select applicable elementary flow for land occupation |  | Area-time / ha a | site-specific | site_specific | per crop cycle | crop_cycle | foreground_data |  |
| Water withdrawal | water | `419682fe-60fb-4b43-be89-bf2824b51104` | Mass / kg | align with irrigation water input | exact | per 1,000 kg harvested seed crop | process_output | foreground_data |  |

#### Outputs

##### Product flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Harvested wheat seed crop | Wheat | `12da5e7d-9b93-4404-8c7d-08f98bec6238` | Mass / kg | 1,000 kg | exact | field subprocess quantitative reference | process_output | observed_dataset |  |
| Straw or field residue | Wheat straw | `bcaf0254-cdd3-43d1-823a-2f69df3801d8` | Mass / kg | 0-2,000 kg | range | per 1,000 kg harvested seed crop | process_output | foreground_data |  |

##### Waste flows

Declare any field waste sent to treatment separately when it leaves the field boundary.

##### Elementary flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Direct soil N2O emission to air | nitrous oxide, emissions to air unspecified | `08a91e70-3ddc-11dd-94c3-0050c2490048` | Mass / kg | calculate from N inputs; IPCC EF1 default is 1 percent of applied N as N2O-N | formula | per N input | n_input | method_formula | `ipcc-2019-managed-soils-n2o` |
| Ammonia volatilization to air | ammonia, emissions to air unspecified | `08a91e70-3ddc-11dd-a2a9-0050c2490048` | Mass / kg | site-specific or regional model | site_specific | per N input | n_input | method_formula | `ipcc-2019-managed-soils-n2o` |
| Nitrate leaching to water | nitrate, emissions to fresh water | `4d9a8790-3ddd-11dd-8d68-0050c2490048` | Mass / kg | site-specific or regional model | site_specific | per N input | n_input | method_formula | `ipcc-2019-managed-soils-n2o` |
| Fossil carbon dioxide from field energy | carbon dioxide (fossil), emissions to air unspecified | `08a91e70-3ddc-11dd-923d-0050c2490048` | Mass / kg | derived from fuel datasets | formula | per fuel inventory | fuel_inventory | tiangong_default |  |

### Process: seed_conditioning_and_treatment

#### Inputs

##### Product flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Harvested seed crop input | Wheat | `12da5e7d-9b93-4404-8c7d-08f98bec6238` | Mass / kg | 1,000-1,250 kg | range | per 1,000 kg cleaned seed output | process_output | external_source | `usda-seed-cleaning-handling` |
| Electricity for drying, cleaning, grading, treatment, and packaging | alternating current | `4d0361a3-56cc-45f9-aa42-bb9103285bf9` | Net calorific value / MJ or kWh | site-specific | site_specific | per 1,000 kg cleaned seed output | process_output | foreground_data | `usda-seed-cleaning-handling` |
| Seed treatment fungicide proxy | Azoxystrobin | `8a1f4968-6428-413f-a50b-b413bf9190cf` | Mass / kg | product-specific | product_specific | per kg treated seed | process_output | foreground_data |  |
| Seed treatment insecticide proxy | Insecticide | `ba2ec0c8-d5da-4ca8-bf9f-317478a1ce1b` | Mass / kg | product-specific | product_specific | per kg treated seed | process_output | foreground_data |  |
| Packaging unit | Woven polypropylene bag | `9bfaad07-355e-467a-9bab-f95094e7c869` | Number of items / item | 20-50 bags | range | per 1,000 kg packaged seed, depending on bag size | process_output | foreground_data |  |

##### Waste flows

No waste input is normally required for seed conditioning. Include reused packaging or recovered materials only when they cross the process boundary as waste-derived inputs.

##### Elementary flows

Include direct dust emissions, water use, or combustion emissions only when the plant process emits them directly rather than through background energy datasets.

#### Outputs

##### Product flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cleaned wheat seed for sowing | Wheat | `12da5e7d-9b93-4404-8c7d-08f98bec6238` | Mass / kg | 1,000 kg | exact | PCR reference output | reference_flow | observed_dataset |  |
| Marketable straw or residue owned by seed plant | Wheat straw | `bcaf0254-cdd3-43d1-823a-2f69df3801d8` | Mass / kg | optional | not_applicable | only if included in seed plant boundary | process_output | foreground_data |  |

##### Waste flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Screenings, rejected seed, dust, and off-grade material | Rejects | `e6d6aa78-105e-4acc-a84b-46f68765a1cc` | Mass / kg | 10-200 kg | range | per 1,000 kg cleaned seed output | process_output | external_source | `usda-seed-cleaning-handling` |
| Packaging waste | Select applicable packaging waste flow |  | Mass / kg | site-specific | site_specific | per 1,000 kg packaged seed | process_output | foreground_data |  |

##### Elementary flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cleaning dust emitted to air | Select applicable particulate flow |  | Mass / kg | site-specific | site_specific | per 1,000 kg cleaned seed output | process_output | foreground_data | `usda-seed-cleaning-handling` |
| Fossil carbon dioxide from conditioning energy | carbon dioxide (fossil), emissions to air unspecified | `08a91e70-3ddc-11dd-923d-0050c2490048` | Mass / kg | derived from energy datasets | formula | per process inventory | fuel_inventory | tiangong_default |  |

### Process: storage_and_delivery

#### Inputs

##### Product flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Storage electricity | alternating current | `4d0361a3-56cc-45f9-aa42-bb9103285bf9` | Net calorific value / MJ or kWh | site-specific | site_specific | per storage duration | storage_duration | foreground_data |  |
| Delivery transport fuel | Diesel oil | `9d258d75-6792-4f1c-9856-81602ed8f816` | Mass / kg | route-specific | route_specific | per tonne-km | transport_service | foreground_data |  |

##### Waste flows

No waste input is normally required.

##### Elementary flows

Include direct storage emissions only when measured or required by the study goal.

#### Outputs

##### Product flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Declared delivered product | Wheat | `12da5e7d-9b93-4404-8c7d-08f98bec6238` | Mass / kg | 1,000 kg | exact | if reference flow is delivered seed | reference_flow | observed_dataset |  |

##### Waste flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Storage loss or damaged seed | Rejects | `e6d6aa78-105e-4acc-a84b-46f68765a1cc` | Mass / kg | 0-20 kg | range | per 1,000 kg stored seed | process_output | foreground_data |  |

##### Elementary flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fossil carbon dioxide from storage or transport energy | carbon dioxide (fossil), emissions to air unspecified | `08a91e70-3ddc-11dd-923d-0050c2490048` | Mass / kg | derived from fuel and energy datasets | formula | per process inventory | fuel_inventory | tiangong_default |  |

## 7. Allocation and Co-product Handling

Apply allocation decisions in this order:

1. Avoid allocation by subdividing seed production, screenings, straw management, and reject handling processes.
2. Use substitution only when the displaced product and market are supported by evidence.
3. Use economic allocation when seed, screenings, and straw are all marketable products and price data are reliable.
4. Use mass allocation only as a fallback and disclose the sensitivity.

Rejected seed, screenings, straw, and packaging waste must have declared fates, such as product output, waste treatment, field return, incorporation, feed use, open burning, or another evidenced route.

## 8. Data Quality and Evidence Rules

Minimum foreground data:

- geography and production year or multi-year average
- seed class and seed lot quality
- field yield and cleaned seed yield
- seeding rate and multiplication generation
- fertilizer types and application rates
- irrigation status, water source, and pumping energy when irrigated
- field fuel use or operation list
- drying, cleaning, treatment, and packaging energy
- seed treatment active ingredients and loadings
- fates of screenings, rejected seed, straw, and packaging waste

Preferred data quality:

- at least three-year average for field yield in weather-sensitive regions
- primary data for seed cleaning yield and reject rate
- region-specific nitrogen and pesticide emission models
- supplier-specific electricity mix when conditioning energy is material
- explicit moisture basis for harvested and cleaned seed

## 9. Validation Rules

Before publishing a process or lifecycle model using this PCR, check:

- reference flow includes mass, gate, seed treatment status, and seed quality qualifiers
- model distinguishes seed product from commodity grain
- field seed multiplication and seed conditioning are separate when data are available
- fertilizer, fuel, irrigation, conditioning energy, packaging, and seed treatment inputs are addressed
- N2O, ammonia, nitrate, fossil CO2, water withdrawal, and land occupation are considered when in scope
- screenings, rejected seed, straw, and packaging waste have declared fates
- allocation method is declared and justified
- values outside typical ranges include a source note and modelling rationale

## 10. Data Sources

| Source id | Type | Reference | Used for |
| --- | --- | --- | --- |
| `fao-wheat-seed-production` | official guidance | <https://www.fao.org/4/y4011e/y4011e0v.htm> | seed certification, quality control, seed quality attributes, and process boundary |
| `unl-wheat-seeding-rate` | extension guidance | <https://cropwatch.unl.edu/determining-seeding-rate-your-winter-wheat/> | seeding rate and thousand-kernel weight background |
| `umn-small-grain-seeding-rate` | extension guidance | <https://extension.umn.edu/planting-small-grains/seeding-rate-small-grains> | seeding rate formula, stand loss, and germination background |
| `usda-seed-cleaning-handling` | official handbook | <https://www.govinfo.gov/content/pkg/GOVPUB-A-PURL-gpo20323/pdf/GOVPUB-A-PURL-gpo20323.pdf> | seed cleaning process decomposition and screenings or reject context |
| `ipcc-2019-managed-soils-n2o` | official method guidance | <https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch11_Soils_N2O_CO2.pdf> | N2O direct emission factor and nitrogen emission modelling |
