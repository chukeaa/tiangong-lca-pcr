---
pcr_id: pcr.agriculture-forestry-and-fishery-products.products-of-agriculture-horticulture-and-market-gardening.wheat-seed
language: zh-CN
status: candidate
sync_with: pcr.en-US.md
---

# 小麦播种种子

## 1. 范围与适用性

本 PCR 用于指导构建清选后小麦播种种子的 `process` 和 `lifecyclemodel` 记录，包括认证种子、基础种、登记种或类似种子等级。范围覆盖繁种田、采后种子加工、可选种子处理、包装、储存以及至声明交付边界的交付。

若研究对象是食用、饲用、淀粉、乙醇或商品交易用小麦籽粒，不应直接使用本 PCR，除非系统边界已排除种子专属处理过程，并且产品已被明确重新分类。

## 2. 产品类别识别

- Canonical PCR id: `pcr.agriculture-forestry-and-fishery-products.products-of-agriculture-horticulture-and-market-gardening.wheat-seed`
- 外部分类入口: CPC 3.0 `01111`, `Wheat, seed`
- 产品类型: 农产品
- 典型生产路线: 种子繁殖田加采后种子加工
- 典型市场状态: 清选、分级、包装、可选药剂处理后，在种子加工厂门或区域交付点交付的小麦种子

PCR 身份不由 CPC 决定。CPC 只提供映射入口；语义化 PCR 目录是稳定的方法学记录。

## 3. 参考流

| Field | Value |
| --- | --- |
| Reference amount | 1 kg |
| Reference product flow | Wheat `12da5e7d-9b93-4404-8c7d-08f98bec6238` |
| Reference flow property | Mass `93a60a56-a3c8-11da-a746-0800200b9a66` |
| Reference unit group | Units of mass `93a60a57-a4c8-11da-a746-0800200c9a66` |
| Reference unit | kg |
| Required qualifiers | 种子等级或认证等级；处理状态；含水率基准；物理净度；发芽率；地理范围和声明交付边界；包装状态 |

建模时，`Required qualifiers` 中列出的信息应在 `process` 说明、`lifecyclemodel` metadata、reference flow comment、产品说明或等效模型字段中明确声明。若某一项不适用，应说明原因；若缺失，应视为参考流定义不完整。

除非研究目标直接关注农艺表现，否则不建议用粒数作为唯一参考流。如使用粒数，应同时提供千粒重或其他质量换算。

## 4. 计量与单位规则

| rule_id | Applies to | Required property | Required unit | Rule |
| --- | --- | --- | --- | --- |
| `reference_mass` | reference product | Mass `93a60a56-a3c8-11da-a746-0800200b9a66` | kg | 参考流必须以 kg 清选后小麦播种种子表示。 |
| `seed_count_conversion` | optional seed-count data | Mass `93a60a56-a3c8-11da-a746-0800200b9a66` | kg | 只有在提供千粒重或其他透明质量换算时，才可使用粒数数据。 |
| `fertilizer_n_basis` | nitrogen fertilizer inputs and nitrogen emissions | Mass `93a60a56-a3c8-11da-a746-0800200b9a66` | kg | 建模氮排放时，氮肥应同时记录 kg product 和 kg N。 |
| `energy_inventory` | electricity, fuel, and drying energy | Net calorific value `93a60a56-a3c8-11da-a746-0800200c9a66` | MJ or kWh | 每个能源清单行必须声明所用能源单位，并保留可换算信息。 |
| `packaging_count` | count-based packaging data | Number of items `01846770-4cfe-4a25-8ad9-919d8d378345` | item | 采用包装件数数据时，如包装材料负荷按质量建模，必须同时声明袋容量或质量。 |

种子质量属性属于前景属性，不替代 flow property：

| 属性 | 常用单位 | 常见范围 | 来源 id |
| --- | --- | --- | --- |
| 含水率 | 湿基百分比 | 10-14 percent | `fao-wheat-seed-production` |
| 物理净度 | 质量百分比 | 95-99.9 percent | `fao-wheat-seed-production` |
| 发芽率 | 种子百分比 | 85-98 percent | `fao-wheat-seed-production`, `umn-small-grain-seeding-rate` |
| 千粒重 | g/1000 seeds | 25-60 g | `unl-wheat-seeding-rate`, `umn-small-grain-seeding-rate` |
| 种子处理载量 | g active ingredient/kg seed | 按产品确定 |  |

## 5. 系统边界

默认边界为 cradle-to-gate 小麦种子生产：

1. 上游种子、肥料、燃料、电力、植保产品、种子处理药剂和包装的生产与运输。
2. 田间繁种：整地、播种、施肥、必要时灌溉、植保、重要时纳入田检、收获和田间干燥。
3. 种子加工：干燥、清选、分级、检测、药剂处理、包装和储存。
4. 当参考流为送达种子时，包含至声明交付边界的运输。

除非生命周期模型明确研究种子作为小麦种植投入的下游使用阶段，否则不包含使用该种子生产粮食小麦的过程。默认不包含资本品；若研究目标和范围显示其显著，应单独纳入。若影响方法或研究目标要求土地使用核算，应纳入土地占用和土地转化。

## 6. 过程清单结构

### 过程图

| process_id | process_name | inclusion | inclusion_condition | role | quantitative_reference |
| --- | --- | --- | --- | --- | --- |
| field_seed_multiplication | Field Seed Multiplication | required |  | foreground | harvested seed crop |
| seed_conditioning_and_treatment | Seed Conditioning and Treatment | required |  | foreground | cleaned seed output |
| storage_and_delivery | Storage and Delivery | conditional | include when the declared gate is delivered seed or storage materially affects the reference flow | foreground/downstream | delivered seed |

### 过程：field_seed_multiplication

#### 输入

##### 产品流

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 上一代小麦种子 | Wheat | `12da5e7d-9b93-4404-8c7d-08f98bec6238` | Mass / kg | 25-70 kg | range | per 1,000 kg harvested seed crop | process_output | external_source | `unl-wheat-seeding-rate`, `umn-small-grain-seeding-rate` |
| 氮肥载体 | Urea | `3f8850c0-f718-4c4b-8fcb-8fd42e03aa8e` | Mass / kg | 按地点确定；同时记录 kg product 与 kg N | site_specific | per 1,000 kg harvested seed crop | process_output | foreground_data | `ipcc-2019-managed-soils-n2o` |
| 磷肥 | Phosphate fertilizer | `9c196b01-6aad-4252-a6e8-f853853a830c` | Mass / kg | 按地点确定 | site_specific | per 1,000 kg harvested seed crop | process_output | foreground_data |  |
| 钾肥 | Potassium fertilizer | `dd008d87-16e4-4e85-a048-b9949f6fbca6` | Mass / kg | 按地点确定 | site_specific | per 1,000 kg harvested seed crop | process_output | foreground_data |  |
| 作为产品投入的灌溉水 | Irrigation water | `4ad684b1-8e85-4dee-8d9c-55d1fa2d4432` | Mass / kg | 0-5,000 kg | range | per 1,000 kg harvested seed crop | process_output | foreground_data |  |
| 田间机械燃料 | Diesel, burned in agricultural machinery | `57e0b1a3-2d05-46b2-b61b-cf7b5b167c6f` | Mass / kg | 5-40 kg | range | per 1,000 kg harvested seed crop | process_output | foreground_data |  |
| 植保产品，除草剂 proxy | Herbicide | `c1370404-9e2b-4ed6-ba96-c094f74e0f2d` | Mass / kg | 按产品确定 | product_specific | per active ingredient or formulated product | process_output | foreground_data |  |
| 植保产品，杀菌剂 proxy | Azoxystrobin | `8a1f4968-6428-413f-a50b-b413bf9190cf` | Mass / kg | 按产品确定 | product_specific | per active ingredient or formulated product | process_output | foreground_data |  |
| 植保产品，杀虫剂 proxy | Insecticide | `ba2ec0c8-d5da-4ca8-bf9f-317478a1ce1b` | Mass / kg | 按产品确定 | product_specific | per active ingredient or formulated product | process_output | foreground_data |  |

##### 废物流

田间繁种过程通常不需要废物输入。只有当再利用有机物料或回收灌溉水以废物来源输入跨越过程边界时，才单独纳入。

##### 基本流

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 土地占用 | Select applicable elementary flow for land occupation |  | Area-time / ha a | 按地点确定 | site_specific | per crop cycle | crop_cycle | foreground_data |  |
| 取水 | water | `419682fe-60fb-4b43-be89-bf2824b51104` | Mass / kg | 与灌溉水输入对齐 | exact | per 1,000 kg harvested seed crop | process_output | foreground_data |  |

#### 输出

##### 产品流

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 收获小麦种子作物 | Wheat | `12da5e7d-9b93-4404-8c7d-08f98bec6238` | Mass / kg | 1,000 kg | exact | field subprocess quantitative reference | process_output | observed_dataset |  |
| 秸秆或田间残余 | Wheat straw | `bcaf0254-cdd3-43d1-823a-2f69df3801d8` | Mass / kg | 0-2,000 kg | range | per 1,000 kg harvested seed crop | process_output | foreground_data |  |

##### 废物流

若有离开田间边界并进入处理的田间废物，应单独声明。

##### 基本流

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 土壤直接 N2O，以空气排放记录 | nitrous oxide, emissions to air unspecified | `08a91e70-3ddc-11dd-94c3-0050c2490048` | Mass / kg | 根据 N 投入计算；IPCC EF1 默认值为施用 N 的 1 percent，以 N2O-N 计 | formula | per N input | n_input | method_formula | `ipcc-2019-managed-soils-n2o` |
| 氨挥发 | ammonia, emissions to air unspecified | `08a91e70-3ddc-11dd-a2a9-0050c2490048` | Mass / kg | 按地点或区域模型确定 | site_specific | per N input | n_input | method_formula | `ipcc-2019-managed-soils-n2o` |
| 硝酸盐淋失 | nitrate, emissions to fresh water | `4d9a8790-3ddd-11dd-8d68-0050c2490048` | Mass / kg | 按地点或区域模型确定 | site_specific | per N input | n_input | method_formula | `ipcc-2019-managed-soils-n2o` |
| 田间能源导致的化石二氧化碳 | carbon dioxide (fossil), emissions to air unspecified | `08a91e70-3ddc-11dd-923d-0050c2490048` | Mass / kg | 由燃料数据集派生 | formula | per fuel inventory | fuel_inventory | tiangong_default |  |

### 过程：seed_conditioning_and_treatment

#### 输入

##### 产品流

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 收获种子作物输入 | Wheat | `12da5e7d-9b93-4404-8c7d-08f98bec6238` | Mass / kg | 1,000-1,250 kg | range | per 1,000 kg cleaned seed output | process_output | external_source | `usda-seed-cleaning-handling` |
| 干燥、清选、分级、药剂处理和包装用电 | alternating current | `4d0361a3-56cc-45f9-aa42-bb9103285bf9` | Net calorific value / MJ or kWh | 按地点确定 | site_specific | per 1,000 kg cleaned seed output | process_output | foreground_data | `usda-seed-cleaning-handling` |
| 种子处理杀菌剂 proxy | Azoxystrobin | `8a1f4968-6428-413f-a50b-b413bf9190cf` | Mass / kg | 按产品确定 | product_specific | per kg treated seed | process_output | foreground_data |  |
| 种子处理杀虫剂 proxy | Insecticide | `ba2ec0c8-d5da-4ca8-bf9f-317478a1ce1b` | Mass / kg | 按产品确定 | product_specific | per kg treated seed | process_output | foreground_data |  |
| 包装单元 | Woven polypropylene bag | `9bfaad07-355e-467a-9bab-f95094e7c869` | Number of items / item | 20-50 bags | range | per 1,000 kg packaged seed, depending on bag size | process_output | foreground_data |  |

##### 废物流

种子加工通常不需要废物输入。只有当再利用包装或回收材料以废物来源输入跨越过程边界时，才单独纳入。

##### 基本流

只有当工厂过程直接排放粉尘、用水或燃烧排放，而不是由背景能源数据集承担时，才纳入直接基本流。

#### 输出

##### 产品流

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 清选后小麦播种种子 | Wheat | `12da5e7d-9b93-4404-8c7d-08f98bec6238` | Mass / kg | 1,000 kg | exact | PCR reference output | reference_flow | observed_dataset |  |
| 若种子加工厂拥有残余物，市场化秸秆 | Wheat straw | `bcaf0254-cdd3-43d1-823a-2f69df3801d8` | Mass / kg | 可选 | not_applicable | only if included in seed plant boundary | process_output | foreground_data |  |

##### 废物流

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 筛下物、不合格种子、粉尘和等外物 | Rejects | `e6d6aa78-105e-4acc-a84b-46f68765a1cc` | Mass / kg | 10-200 kg | range | per 1,000 kg cleaned seed output | process_output | external_source | `usda-seed-cleaning-handling` |
| 包装废弃物 | Select applicable packaging waste flow |  | Mass / kg | 按地点确定 | site_specific | per 1,000 kg packaged seed | process_output | foreground_data |  |

##### 基本流

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 清选粉尘排入空气 | Select applicable particulate flow |  | Mass / kg | 按地点确定 | site_specific | per 1,000 kg cleaned seed output | process_output | foreground_data | `usda-seed-cleaning-handling` |
| 加工能源导致的化石二氧化碳 | carbon dioxide (fossil), emissions to air unspecified | `08a91e70-3ddc-11dd-923d-0050c2490048` | Mass / kg | 由能源数据集派生 | formula | per process inventory | fuel_inventory | tiangong_default |  |

### 过程：storage_and_delivery

#### 输入

##### 产品流

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 储存用电 | alternating current | `4d0361a3-56cc-45f9-aa42-bb9103285bf9` | Net calorific value / MJ or kWh | 按地点确定 | site_specific | per storage duration | storage_duration | foreground_data |  |
| 交付运输燃料 | Diesel oil | `9d258d75-6792-4f1c-9856-81602ed8f816` | Mass / kg | 按路线确定 | route_specific | per tonne-km | transport_service | foreground_data |  |

##### 废物流

通常不需要废物输入。

##### 基本流

只有当研究目标要求或有测量数据时，才纳入直接储存排放。

#### 输出

##### 产品流

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 已声明交付边界产品 | Wheat | `12da5e7d-9b93-4404-8c7d-08f98bec6238` | Mass / kg | 1,000 kg | exact | if reference flow is delivered seed | reference_flow | observed_dataset |  |

##### 废物流

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 储存损耗或受损种子 | Rejects | `e6d6aa78-105e-4acc-a84b-46f68765a1cc` | Mass / kg | 0-20 kg | range | per 1,000 kg stored seed | process_output | foreground_data |  |

##### 基本流

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 储存或运输能源导致的化石二氧化碳 | carbon dioxide (fossil), emissions to air unspecified | `08a91e70-3ddc-11dd-923d-0050c2490048` | Mass / kg | 由燃料和能源数据集派生 | formula | per process inventory | fuel_inventory | tiangong_default |  |

## 7. 分配与共产品处理

按以下顺序决策：

1. 通过细分种子生产、筛下物、秸秆管理和不合格物处理过程来避免分配。
2. 只有在被替代产品和市场有证据时，才使用替代法。
3. 当种子、筛下物和秸秆均为市场产品且价格数据可靠时，使用经济分配。
4. 质量分配仅作为兜底方法，并披露敏感性。

不合格种子、筛下物、秸秆和包装废弃物必须有声明去向，可为产品输出、废物处理、还田、翻埋、饲料利用、露天焚烧或其他有证据的路线。

## 8. 数据质量与证据规则

最低前景数据要求：

- 地理范围和生产年份，或多年平均
- 种子等级和种批质量
- 田间产量和清选后种子产量
- 播种量和繁种世代
- 肥料类型和施用量
- 灌溉状态、水源，以及灌溉时的抽水能源
- 田间燃料用量或作业清单
- 干燥、清选、药剂处理和包装能源
- 种子处理有效成分和载量
- 筛下物、不合格物、秸秆和包装废弃物去向

优先数据质量：

- 天气敏感地区至少使用三年田间产量平均值
- 种子清选产率和不合格率使用一手数据
- 使用区域化氮和农药排放模型
- 加工能源显著时使用供应商或地点电力结构
- 明确收获和清选后种子的含水率基准

## 9. 校验规则

发布使用本 PCR 的 process 或 lifecyclemodel 前，应检查：

- 参考流包含质量、交付边界、种子处理状态和种子质量限定
- 模型区分种子产品和普通商品粮
- 数据允许时，将田间繁种和种子加工拆成独立过程
- 肥料、燃料、灌溉、加工能源、包装和种子处理投入均已处理
- 范围内已考虑 N2O、氨、硝酸盐、化石 CO2、取水和土地占用
- 筛下物、不合格种子、秸秆和包装废弃物有声明去向
- 分配方法已声明并给出理由
- 所有超出常见范围的值都有来源说明和建模理由

## 10. 数据源

| Source id | Type | Reference | 用途 |
| --- | --- | --- | --- |
| `fao-wheat-seed-production` | official guidance | <https://www.fao.org/4/y4011e/y4011e0v.htm> | 种子认证、质量控制、种子质量属性和过程边界 |
| `unl-wheat-seeding-rate` | extension guidance | <https://cropwatch.unl.edu/determining-seeding-rate-your-winter-wheat/> | 播种量和千粒重背景 |
| `umn-small-grain-seeding-rate` | extension guidance | <https://extension.umn.edu/planting-small-grains/seeding-rate-small-grains> | 播种量公式、成苗损失和发芽率背景 |
| `usda-seed-cleaning-handling` | official handbook | <https://www.govinfo.gov/content/pkg/GOVPUB-A-PURL-gpo20323/pdf/GOVPUB-A-PURL-gpo20323.pdf> | 种子清选过程拆分和筛下物或不合格物背景 |
| `ipcc-2019-managed-soils-n2o` | official method guidance | <https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch11_Soils_N2O_CO2.pdf> | N2O 直接排放因子和氮排放建模 |
