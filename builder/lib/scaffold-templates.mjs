export const PCR_EN_FILE = "pcr.en-US.md";
export const PCR_ZH_FILE = "pcr.zh-CN.md";
export const MODULE_EN_FILE = "module.en-US.md";
export const MODULE_ZH_FILE = "module.zh-CN.md";

export function pcrManifest(options) {
  const pcrId = String(options["pcr-id"] ?? "pcr.placeholder");
  const titleEn = String(options["title-en-US"] ?? options["title-en"] ?? "PCR Placeholder");
  const titleZh = String(options["title-zh-CN"] ?? "PCR 占位");

  return `schema_version: 1
id: ${pcrId}
title:
  en-US: ${JSON.stringify(titleEn)}
  zh-CN: ${JSON.stringify(titleZh)}
status: scaffold
pcr_kind: product_category_rule
content_maturity: empty_scaffold
languages:
  canonical: en-US
  available:
    - en-US
    - zh-CN
translation_status:
  zh-CN: scaffold
target_entities:
  - flow
  - process
  - lifecyclemodel
  - dataset
`;
}

export function pcrMarkdown(options, language) {
  const pcrId = String(options["pcr-id"] ?? "pcr.placeholder");
  const title =
    language === "zh-CN"
      ? String(options["title-zh-CN"] ?? "PCR 占位")
      : String(options["title-en-US"] ?? options["title-en"] ?? "PCR Placeholder");

  return `---
pcr_id: ${pcrId}
language: ${language}
status: scaffold
sync_with: ${language === "zh-CN" ? PCR_EN_FILE : PCR_ZH_FILE}
---

# ${title}

${language === "zh-CN" ? zhPcrBody() : enPcrBody()}`;
}

export function structuredYaml() {
  return `schema_version: 1
status: scaffold
product_category_identity: {}
functional_unit: {}
reference_flows: []
flow_properties: []
unit_conventions: []
system_boundary: {}
boundary_abstraction: {}
process_map: []
process_inventory: []
dataset_production:
  collection_protocols: []
  calculation_rules: []
  data_quality_requirements: []
published_dataset_profile: {}
allocation_rules: []
data_quality_rules: []
validation_rules: []
data_sources: []
`;
}

export function enPcrBody() {
  return `## 1. Scope and Applicability

## 2. Product Category Identity

| Field | Value |
| --- | --- |
| canonical_pcr_id |  |
| classification_refs |  |
| covered_products |  |
| excluded_products |  |
| representative_product |  |
| production_route |  |
| market_state |  |

## 3. Reference Flow

| Field | Value |
| --- | --- |
| What |  |
| How much |  |
| How well |  |
| How long or cycle |  |
| reference_flow_link |  |

| Field | Value |
| --- | --- |
| Reference amount |  |
| Reference product flow |  |
| Reference flow property |  |
| Reference unit group |  |
| Reference unit |  |
| Required qualifiers |  |

When constructing a foreground data package, the items listed in \`Required qualifiers\` must be declared in dataset metadata, process notes, reference flow comment, product description, or an equivalent data package field. Missing required qualifiers make the reference flow definition incomplete for that data package.

## 4. Measurement and Unit Rules

| rule_id | Applies to | Required property | Required unit | Rule |
| --- | --- | --- | --- | --- |

## 5. System Boundary

### Boundary Abstraction

| Field | Value |
| --- | --- |
| declared_starting_condition |  |
| starting_condition_role |  |
| product_classification_scope |  |
| recursive_input_rule |  |
| upstream_dataset_requirement |  |
| disclosure |  |

## 6. Process Inventory Structure

### Process Map

| process_id | process_name | inclusion | inclusion_condition | role | quantitative_reference |
| --- | --- | --- | --- | --- | --- |

### Process: <process_id>

#### Inputs

##### Product flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | collection_protocol_id | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

##### Waste flows

##### Elementary flows

#### Outputs

##### Product flows

##### Waste flows

##### Elementary flows

## 7. Allocation and Co-product Handling

## 8. Foreground Data Collection, Calculation, and Quality Rules

### Data Collection Protocols

| protocol_id | process_id | flow_role | record_type | raw_fields | collection_method | unit | frequency | temporal_coverage | site_scope | aggregation_rule | quality_evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### Calculation Rules

| rule_id | Applies to | Formula or rule | Inputs | Output | source_ids |
| --- | --- | --- | --- | --- | --- |

### Data Quality Requirements

| requirement_id | Applies to | Requirement | Evidence |
| --- | --- | --- | --- |

## 9. Validation Rules

## 10. Published Dataset Profile

| Field | Value |
| --- | --- |
| dataset_role |  |
| downstream_use |  |
| allowed_use |  |
| excluded_use |  |
| required_metadata |  |
| required_quality_disclosure |  |
| update_trigger |  |

## 11. Data Sources
`;
}

export function zhPcrBody() {
  return `## 1. 范围与适用性

## 2. 产品类别识别

| 字段 | 值 |
| --- | --- |
| canonical_pcr_id |  |
| classification_refs |  |
| covered_products |  |
| excluded_products |  |
| representative_product |  |
| production_route |  |
| market_state |  |

## 3. 参考流

| 字段 | 值 |
| --- | --- |
| What |  |
| How much |  |
| How well |  |
| How long or cycle |  |
| reference_flow_link |  |

| 字段 | 值 |
| --- | --- |
| 参考数量 |  |
| 参考产品流 |  |
| 参考流属性 |  |
| 参考单位组 |  |
| 参考单位 |  |
| 必需限定信息 |  |

构建前景数据包时，\`必需限定信息\` 中列出的信息应在数据集元数据、过程说明、参考流备注、产品说明或等效数据包字段中明确声明。缺失必需限定信息的数据包视为参考流定义不完整。

## 4. 计量与单位规则

| rule_id | 适用对象 | 必需流属性 | 必需单位 | 规则 |
| --- | --- | --- | --- | --- |

## 5. 系统边界

### 边界概化

| 字段 | 值 |
| --- | --- |
| declared_starting_condition |  |
| starting_condition_role |  |
| product_classification_scope |  |
| recursive_input_rule |  |
| upstream_dataset_requirement |  |
| disclosure |  |

## 6. 过程清单结构

### 过程图

| process_id | 过程名称 | 纳入状态 | 纳入条件 | 建模角色 | 定量参考 |
| --- | --- | --- | --- | --- | --- |

### 过程：<process_id>

#### 输入

##### 产品流

| 流角色 | 选定流 | 天工 UUID | 流属性/单位 | 数量 | amount_kind | 基准 | basis_kind | evidence_kind | collection_protocol_id | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

##### 废物流

##### 基本流

#### 输出

##### 产品流

##### 废物流

##### 基本流

## 7. 分配与共产品处理

## 8. 前景数据采集、计算与质量规则

### 数据采集协议

| protocol_id | process_id | flow_role | record_type | raw_fields | collection_method | unit | frequency | temporal_coverage | site_scope | aggregation_rule | quality_evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### 计算规则

| rule_id | Applies to | Formula or rule | Inputs | Output | source_ids |
| --- | --- | --- | --- | --- | --- |

### 数据质量要求

| requirement_id | Applies to | Requirement | Evidence |
| --- | --- | --- | --- |

## 9. 校验规则

## 10. 发布数据集画像

| 字段 | 值 |
| --- | --- |
| dataset_role |  |
| downstream_use |  |
| allowed_use |  |
| excluded_use |  |
| required_metadata |  |
| required_quality_disclosure |  |
| update_trigger |  |

## 11. 数据源
`;
}
