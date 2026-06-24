import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { parseYaml } from "../../packages/pcr-core/src/yaml-lite.mjs";

const cliPath = path.resolve("builder/cli/index.mjs");
const sampleCpcPath = path.resolve("builder/fixtures/cpc-structure.sample.csv");

function makeTempRoot() {
  return mkdtempSync(path.join(tmpdir(), "tiangong-pcr-cli-test-"));
}

function runCli(args, options = {}) {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: path.resolve("."),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

function runCliFailure(args, options = {}) {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: path.resolve("."),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

test("init creates the bilingual PCR repository scaffold", () => {
  const root = makeTempRoot();
  try {
    const output = runCli(["init", "--root", root]);

    assert.match(output, /initialized PCR library scaffold/i);
    assert.match(
      readFileSync(path.join(root, "library/pcrs/README.md"), "utf8"),
      /pcr.en-US.md/,
    );
    assert.match(
      readFileSync(path.join(root, "library/modules/README.md"), "utf8"),
      /module.en-US.md/,
    );
    assert.match(
      readFileSync(path.join(root, "builder/README.md"), "utf8"),
      /Builder CLI/,
    );
    assert.match(
      readFileSync(path.join(root, "builder/docs/index.md"), "utf8"),
      /Builder Documentation Index/,
    );
    assert.ok(existsSync(path.join(root, "builder/docs/workflows")));
    assert.ok(existsSync(path.join(root, "builder/docs/contracts")));
    assert.ok(existsSync(path.join(root, "builder/docs/methods")));
    assert.ok(existsSync(path.join(root, "builder/docs/tools")));
    assert.ok(existsSync(path.join(root, "builder/docs/prompts")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("lint passes for initialized scaffold", () => {
  const root = makeTempRoot();
  try {
    runCli(["init", "--root", root]);
    const output = runCli(["lint", "--root", root]);

    assert.match(output, /PCR library lint passed/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("lint rejects PCR directories missing the Chinese markdown file", () => {
  const root = makeTempRoot();
  try {
    runCli(["init", "--root", root]);
    const pcrDir = path.join(root, "library/pcrs/agriculture/crops/wheat-seed");
    runCli([
      "init",
      "--root",
      root,
      "--sample-pcr",
      "agriculture/crops/wheat-seed",
      "--pcr-id",
      "pcr.agriculture.crops.wheat-seed",
      "--title-en",
      "Wheat seed production",
      "--title-zh-CN",
      "小麦种子生产",
    ]);
    unlinkSync(path.join(pcrDir, "pcr.en-US.md"));

    assert.throws(
      () => runCli(["lint", "--root", root]),
      (error) =>
        String(error.stderr).includes("library/pcrs/agriculture/crops/wheat-seed/pcr.en-US.md"),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("optional PCR scaffold uses process inventory without construction trace sections", () => {
  const root = makeTempRoot();
  try {
    runCli(["init", "--root", root]);
    const pcrDir = path.join(root, "library/pcrs/agriculture/crops/wheat-seed");
    runCli([
      "init",
      "--root",
      root,
      "--sample-pcr",
      "agriculture/crops/wheat-seed",
      "--pcr-id",
      "pcr.agriculture.crops.wheat-seed",
      "--title-en",
      "Wheat seed production",
      "--title-zh-CN",
      "小麦种子生产",
    ]);

    const enMarkdown = readFileSync(path.join(pcrDir, "pcr.en-US.md"), "utf8");
    const zhMarkdown = readFileSync(path.join(pcrDir, "pcr.zh-CN.md"), "utf8");
    const manifest = readFileSync(path.join(pcrDir, "manifest.yaml"), "utf8");
    const structured = readFileSync(path.join(pcrDir, "structured.yaml"), "utf8");

    assert.match(manifest, /target_entities:\n  - flow\n  - process\n  - lifecyclemodel\n  - dataset/);
    assert.match(enMarkdown, /canonical_pcr_id/);
    assert.match(enMarkdown, /How much/);
    assert.match(enMarkdown, /### Boundary Abstraction/);
    assert.match(enMarkdown, /declared_starting_condition/);
    assert.match(enMarkdown, /## 6\. Process Inventory Structure/);
    assert.match(enMarkdown, /### Process Map/);
    assert.match(enMarkdown, /process_id/);
    assert.match(enMarkdown, /### Process: <process_id>/);
    assert.match(enMarkdown, /#### Inputs/);
    assert.match(enMarkdown, /##### Product flows/);
    assert.match(enMarkdown, /##### Waste flows/);
    assert.match(enMarkdown, /##### Elementary flows/);
    assert.match(enMarkdown, /#### Outputs/);
    assert.match(enMarkdown, /collection_protocol_id/);
    assert.match(enMarkdown, /## 8\. Foreground Data Collection, Calculation, and Quality Rules/);
    assert.match(enMarkdown, /### Data Collection Protocols/);
    assert.match(enMarkdown, /### Calculation Rules/);
    assert.match(enMarkdown, /### Data Quality Requirements/);
    assert.match(enMarkdown, /## 10\. Published Dataset Profile/);
    assert.match(enMarkdown, /## 11\. Data Sources/);
    assert.doesNotMatch(enMarkdown, /CLI Lookup Trace|Agent Modelling Instructions|Open Questions|Review Status/);

    assert.match(zhMarkdown, /## 6\. 过程清单结构/);
    assert.match(zhMarkdown, /\| 字段 \| 值 \|/);
    assert.match(zhMarkdown, /### 边界概化/);
    assert.match(zhMarkdown, /declared_starting_condition/);
    assert.match(zhMarkdown, /\| rule_id \| 适用对象 \| 必需流属性 \| 必需单位 \| 规则 \|/);
    assert.match(zhMarkdown, /### 过程图/);
    assert.match(zhMarkdown, /process_id/);
    assert.match(zhMarkdown, /过程名称/);
    assert.match(zhMarkdown, /### 过程：<process_id>/);
    assert.match(zhMarkdown, /#### 输入/);
    assert.match(zhMarkdown, /##### 产品流/);
    assert.match(zhMarkdown, /##### 废物流/);
    assert.match(zhMarkdown, /##### 基本流/);
    assert.match(zhMarkdown, /#### 输出/);
    assert.match(zhMarkdown, /collection_protocol_id/);
    assert.match(zhMarkdown, /## 8\. 前景数据采集、计算与质量规则/);
    assert.match(zhMarkdown, /### 数据采集协议/);
    assert.match(zhMarkdown, /### 计算规则/);
    assert.match(zhMarkdown, /### 数据质量要求/);
    assert.match(zhMarkdown, /## 10\. 发布数据集画像/);
    assert.match(zhMarkdown, /## 11\. 数据源/);
    assert.doesNotMatch(
      zhMarkdown,
      /\| Field \| Value \||\| Reference amount|### Process Map|\| process_id \| process_name/,
    );
    assert.doesNotMatch(zhMarkdown, /CLI 查询记录|Agent 建模指令|待复核问题|审核状态/);

    assert.match(structured, /process_inventory: \[\]/);
    assert.match(structured, /boundary_abstraction: \{\}/);
    assert.match(structured, /data_sources: \[\]/);
    assert.doesNotMatch(structured, /cli_lookup_trace/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("sync-structured projects normative markdown tables to UUID-only structured YAML", () => {
  const root = makeTempRoot();
  try {
    runCli(["init", "--root", root]);
    const pcrDir = path.join(root, "library/pcrs/agriculture/crops/wheat-seed");
    runCli([
      "init",
      "--root",
      root,
      "--sample-pcr",
      "agriculture/crops/wheat-seed",
      "--pcr-id",
      "pcr.agriculture.crops.wheat-seed",
      "--title-en",
      "Wheat seed production",
      "--title-zh-CN",
      "小麦种子生产",
    ]);
    writeFileSync(
      path.join(pcrDir, "pcr.en-US.md"),
      `---
pcr_id: pcr.agriculture.crops.wheat-seed
language: en-US
status: active
sync_with: pcr.zh-CN.md
---

# Wheat Seed Production

## 3. Reference Flow

| Field | Value |
| --- | --- |
| Reference amount | 1 kg |
| Reference product flow | Wheat \`12da5e7d-9b93-4404-8c7d-08f98bec6238\` |
| Reference flow property | Mass \`93a60a56-a3c8-11da-a746-0800200b9a66\` |
| Reference unit group | Units of mass \`93a60a57-a4c8-11da-a746-0800200c9a66\` |
| Reference unit | kg |
| Required qualifiers | seed class; treatment status; moisture basis; purity; germination rate; declared gate |

## 4. Measurement and Unit Rules

| rule_id | Applies to | Required property | Required unit | Rule |
| --- | --- | --- | --- | --- |
| \`reference_mass\` | reference product | Mass \`93a60a56-a3c8-11da-a746-0800200b9a66\` | kg | Reference flow must be expressed as kg cleaned wheat seed. |
| \`seed_count_conversion\` | optional seed-count data | Mass \`93a60a56-a3c8-11da-a746-0800200b9a66\` | kg | Seed count data must include thousand-kernel weight for conversion to mass. |

## 5. System Boundary

### Boundary Abstraction

| Field | Value |
| --- | --- |
| declared_starting_condition | source_seed_lot |
| starting_condition_role | identity_and_reproduction_condition |
| product_classification_scope | current CPC product category \`01111\`, \`Wheat, seed\` |
| recursive_input_rule | input flow in same product category is recorded as declared starting condition |
| upstream_dataset_requirement | declared starting condition disclosure and collection record |
| disclosure | record source seed lot identity, propagation class, mass, moisture basis, treatment status, and evidence |

## 6. Process Inventory Structure

### Process Map

| process_id | process_name | inclusion | inclusion_condition | role | quantitative_reference |
| --- | --- | --- | --- | --- | --- |
| field_seed_multiplication | Field Seed Multiplication | required |  | foreground | harvested seed crop |

### Process: field_seed_multiplication

#### Inputs

##### Product flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | collection_protocol_id | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Source seed lot used for multiplication | Wheat | \`12da5e7d-9b93-4404-8c7d-08f98bec6238\` | Mass / kg | site-specific measured mass | site_specific | per 1,000 kg harvested seed crop | process_output | collected_record | cp_source_seed_lot_mass | \`unl-wheat-seeding-rate\` |

#### Outputs

##### Product flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | collection_protocol_id | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Harvested wheat seed crop | Wheat | \`12da5e7d-9b93-4404-8c7d-08f98bec6238\` | Mass / kg | measured harvested mass | site_specific | process reference | process_output | collected_record | cp_harvested_seed_mass |  |

## 8. Foreground Data Collection, Calculation, and Quality Rules

### Data Collection Protocols

| protocol_id | process_id | flow_role | record_type | raw_fields | collection_method | unit | frequency | temporal_coverage | site_scope | aggregation_rule | quality_evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cp_source_seed_lot_mass | field_seed_multiplication | Source seed lot used for multiplication | seed lot receiving record | lot id; mass; moisture basis | weighbridge or calibrated scale | kg | per seed lot | crop cycle | seed multiplication site | sum lots and normalize to harvested seed output | scale calibration and lot record |
| cp_harvested_seed_mass | field_seed_multiplication | Harvested wheat seed crop | harvest record | field id; harvested mass; moisture basis | weighbridge or calibrated scale | kg | per harvest event | crop cycle | seed multiplication site | sum harvest records at declared moisture basis | scale calibration and harvest record |

### Calculation Rules

| rule_id | Applies to | Formula or rule | Inputs | Output | source_ids |
| --- | --- | --- | --- | --- | --- |
| normalize_source_seed_lot_input | source seed lot input | source seed lot kg / harvested seed kg * reference output | cp_source_seed_lot_mass; cp_harvested_seed_mass | kg source seed lot per reference output |  |

### Data Quality Requirements

| requirement_id | Applies to | Requirement | Evidence |
| --- | --- | --- | --- |
| dq_seed_mass | seed mass records | Weighing records must identify lot, mass, date, and moisture basis. | scale calibration and lot records |

## 10. Published Dataset Profile

| Field | Value |
| --- | --- |
| dataset_role | unit_process |
| downstream_use | secondary_dataset; background_dataset |
| allowed_use | wheat seed production datasets with matching seed class, treatment status, geography, and declared gate |
| excluded_use | commodity wheat grain and seed production routes outside the declared boundary |
| required_metadata | reference flow; geography; crop cycle; moisture basis; seed class; treatment status; DQR |
| required_quality_disclosure | collected record coverage, calculation rules, and data quality scores |
| update_trigger | material process, geography, seed treatment, or data quality change |

## 11. Data Sources

| Source id | Type | Reference | Used for |
| --- | --- | --- | --- |
| \`unl-wheat-seeding-rate\` | extension-guidance | https://cropwatch.unl.edu/determining-seeding-rate-your-winter-wheat/ | source seed lot context |
`,
    );

    const output = runCli([
      "sync-structured",
      "--root",
      root,
      "--pcr",
      "library/pcrs/agriculture/crops/wheat-seed",
    ]);
    const structured = readFileSync(path.join(pcrDir, "structured.yaml"), "utf8");

    assert.match(output, /synced structured PCR/i);
    assert.match(structured, /source_markdown: pcr\.en-US\.md/);
    assert.match(structured, /reference_flow_definition:/);
    assert.match(structured, /reference_amount: "1 kg"/);
    assert.match(structured, /required_qualifiers:/);
    assert.match(structured, /- "seed class"/);
    assert.match(structured, /uuid: "12da5e7d-9b93-4404-8c7d-08f98bec6238"/);
    assert.match(structured, /measurement_rules:/);
    assert.match(structured, /id: reference_mass/);
    assert.match(structured, /required_unit: "kg"/);
    assert.match(structured, /boundary_abstraction:/);
    assert.match(structured, /declared_starting_condition: "source_seed_lot"/);
    assert.match(
      structured,
      /recursive_input_rule: "input flow in same product category is recorded as declared starting condition"/,
    );
    assert.match(structured, /process_map:/);
    assert.match(structured, /inclusion: "required"/);
    assert.match(structured, /process_inventory:/);
    assert.match(structured, /id: field_seed_multiplication/);
    assert.match(structured, /amount_kind: "site_specific"/);
    assert.match(structured, /basis_kind: "process_output"/);
    assert.match(structured, /evidence_kind: "collected_record"/);
    assert.match(structured, /collection_protocol_id: cp_source_seed_lot_mass/);
    assert.match(structured, /dataset_production:/);
    assert.match(structured, /collection_protocols:/);
    assert.match(structured, /protocol_id: cp_source_seed_lot_mass/);
    assert.match(structured, /calculation_rules:/);
    assert.match(structured, /id: normalize_source_seed_lot_input/);
    assert.match(structured, /data_quality_requirements:/);
    assert.match(structured, /id: dq_seed_mass/);
    assert.match(structured, /published_dataset_profile:/);
    assert.match(structured, /dataset_role: "unit_process"/);
    assert.match(structured, /source_ids:/);
    assert.match(structured, /- unl-wheat-seeding-rate/);
    assert.doesNotMatch(structured, /01\.01\.002|@01|version: "01|cli_lookup_trace|review_status/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("lint requires collection protocols for authored foreground flow rows", () => {
  const root = makeTempRoot();
  try {
    runCli(["init", "--root", root]);
    const pcrDir = path.join(root, "library/pcrs/agriculture/crops/wheat-seed");
    runCli([
      "init",
      "--root",
      root,
      "--sample-pcr",
      "agriculture/crops/wheat-seed",
      "--pcr-id",
      "pcr.agriculture.crops.wheat-seed",
      "--title-en",
      "Wheat seed production",
      "--title-zh-CN",
      "小麦种子生产",
    ]);
    writeFileSync(
      path.join(pcrDir, "manifest.yaml"),
      `schema_version: 1
id: pcr.agriculture.crops.wheat-seed
title:
  en-US: "Wheat seed production"
  zh-CN: "小麦种子生产"
status: candidate
pcr_kind: product_category_rule
content_maturity: authored_methodology
languages:
  canonical: en-US
  available:
    - en-US
    - zh-CN
`,
    );
    writeFileSync(
      path.join(pcrDir, "pcr.en-US.md"),
      `---
pcr_id: pcr.agriculture.crops.wheat-seed
language: en-US
status: candidate
sync_with: pcr.zh-CN.md
---

# Wheat Seed Production

## 6. Process Inventory Structure

### Process Map

| process_id | process_name | inclusion | inclusion_condition | role | quantitative_reference |
| --- | --- | --- | --- | --- | --- |
| field_seed_multiplication | Field Seed Multiplication | required |  | foreground | harvested seed crop |

### Process: field_seed_multiplication

#### Inputs

##### Product flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | collection_protocol_id | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Source seed lot used for multiplication | Wheat | \`12da5e7d-9b93-4404-8c7d-08f98bec6238\` | Mass / kg | site-specific measured mass | site_specific | per 1,000 kg harvested seed crop | process_output | collected_record | cp_missing |  |
| Fertilizer input | Urea | \`3f8850c0-f718-4c4b-8fcb-8fd42e03aa8e\` | Mass / kg | site-specific | site_specific | per output | process_output | foreground_data |  |  |
`,
    );

    assert.throws(
      () => runCli(["lint", "--root", root]),
      (error) =>
        String(error.stderr).includes("references unknown collection_protocol_id cp_missing") &&
        String(error.stderr).includes("requires collection_protocol_id for evidence_kind foreground_data"),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("lint rejects recursive origin wording in material PCR markdown", () => {
  const root = makeTempRoot();
  try {
    runCli(["init", "--root", root]);
    const pcrDir = path.join(root, "library/pcrs/agriculture/crops/wheat-seed");
    runCli([
      "init",
      "--root",
      root,
      "--sample-pcr",
      "agriculture/crops/wheat-seed",
      "--pcr-id",
      "pcr.agriculture.crops.wheat-seed",
      "--title-en",
      "Wheat seed production",
      "--title-zh-CN",
      "小麦种子生产",
    ]);
    writeFileSync(
      path.join(pcrDir, "manifest.yaml"),
      `schema_version: 1
id: pcr.agriculture.crops.wheat-seed
title:
  en-US: "Wheat seed production"
  zh-CN: "小麦种子生产"
status: candidate
pcr_kind: product_category_rule
content_maturity: authored_methodology
languages:
  canonical: en-US
  available:
    - en-US
    - zh-CN
`,
    );
    writeFileSync(
      path.join(pcrDir, "pcr.en-US.md"),
      `---
pcr_id: pcr.agriculture.crops.wheat-seed
language: en-US
status: candidate
sync_with: pcr.zh-CN.md
---

# Wheat Seed Production

## 5. System Boundary

Previous-generation wheat seed is the starting point.

### Boundary Abstraction

| Field | Value |
| --- | --- |
| declared_starting_condition | source_seed_lot |
| starting_condition_role | identity_and_reproduction_condition |
| product_classification_scope | current CPC product category \`01111\`, \`Wheat, seed\` |
| recursive_input_rule | input flow in same product category is recorded as declared starting condition |
| upstream_dataset_requirement | declared starting condition disclosure and collection record |
| disclosure | record source seed lot identity, propagation class, mass, moisture basis, treatment status, and evidence |

## 6. Process Inventory Structure

### Process Map

| process_id | process_name | inclusion | inclusion_condition | role | quantitative_reference |
| --- | --- | --- | --- | --- | --- |
| field_seed_multiplication | Field Seed Multiplication | required |  | foreground | harvested seed crop |

### Process: field_seed_multiplication

#### Inputs

##### Product flows

| Flow role | Selected flow | Tiangong UUID | Flow property / unit | Amount | amount_kind | Basis | basis_kind | evidence_kind | collection_protocol_id | source_ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Source seed lot used for multiplication | Wheat | \`12da5e7d-9b93-4404-8c7d-08f98bec6238\` | Mass / kg | site-specific measured mass | site_specific | per 1,000 kg harvested seed crop | process_output | collected_record | cp_source_seed_lot_mass |  |

## 8. Foreground Data Collection, Calculation, and Quality Rules

### Data Collection Protocols

| protocol_id | process_id | flow_role | record_type | raw_fields | collection_method | unit | frequency | temporal_coverage | site_scope | aggregation_rule | quality_evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cp_source_seed_lot_mass | field_seed_multiplication | Source seed lot used for multiplication | seed lot receiving record | lot id; mass; moisture basis | weighbridge or calibrated scale | kg | per seed lot | crop cycle | seed multiplication site | sum lots and normalize to harvested seed output | scale calibration and lot record |

## 10. Published Dataset Profile

| Field | Value |
| --- | --- |
| dataset_role | unit_process |
| downstream_use | secondary_dataset; background_dataset |
| allowed_use | wheat seed production datasets with matching seed class, treatment status, geography, and declared gate |
| excluded_use | commodity wheat grain and seed production routes outside the declared boundary |
| required_metadata | reference flow; geography; crop cycle; moisture basis; seed class; treatment status; DQR |
| required_quality_disclosure | collected record coverage, calculation rules, and data quality scores |
| update_trigger | material process, geography, seed treatment, or data quality change |
`,
    );

    assert.throws(
      () => runCli(["lint", "--root", root]),
      (error) => String(error.stderr).includes('contains prohibited recursive-origin term "Previous-generation"'),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("bump and publish update PCR manifest lifecycle fields", () => {
  const root = makeTempRoot();
  try {
    runCli(["init", "--root", root]);
    const pcrDir = path.join(root, "library/pcrs/agriculture/crops/wheat-seed");
    runCli([
      "init",
      "--root",
      root,
      "--sample-pcr",
      "agriculture/crops/wheat-seed",
      "--pcr-id",
      "pcr.agriculture.crops.wheat-seed",
      "--title-en",
      "Wheat seed production",
      "--title-zh-CN",
      "小麦种子生产",
    ]);

    const bumpOutput = runCli([
      "bump",
      "--root",
      root,
      "--pcr",
      "library/pcrs/agriculture/crops/wheat-seed",
      "--level",
      "minor",
    ]);
    assert.match(bumpOutput, /Updated PCR manifest version at library\/pcrs\/agriculture\/crops\/wheat-seed\/manifest.yaml/);
    let manifest = readFileSync(path.join(pcrDir, "manifest.yaml"), "utf8");
    let parsedManifest = parseYaml(manifest);
    assert.equal(parsedManifest.version, "0.1.0");
    assert.ok(parsedManifest.updated_at_utc);
    assert.equal(parsedManifest.title["en-US"], "Wheat seed production");
    assert.deepEqual(parsedManifest.target_entities, ["flow", "process", "lifecyclemodel", "dataset"]);

    const publishOutput = runCli([
      "publish",
      "--root",
      root,
      "--pcr",
      "library/pcrs/agriculture/crops/wheat-seed",
      "--version",
      "1.0.0",
    ]);
    assert.match(publishOutput, /Synced structured PCR from library\/pcrs\/agriculture\/crops\/wheat-seed\/pcr.en-US.md/);
    assert.match(publishOutput, /Published PCR manifest at library\/pcrs\/agriculture\/crops\/wheat-seed\/manifest.yaml/);
    manifest = readFileSync(path.join(pcrDir, "manifest.yaml"), "utf8");
    parsedManifest = parseYaml(manifest);
    assert.equal(parsedManifest.status, "published");
    assert.equal(parsedManifest.version, "1.0.0");
    assert.ok(parsedManifest.published_at_utc);
    assert.equal(parsedManifest.title["zh-CN"], "小麦种子生产");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("unknown builder command fails explicitly", () => {
  assert.throws(
    () => runCliFailure(["nope"]),
    (error) => {
      assert.notEqual(error.status, 0);
      assert.match(String(error.stderr), /Unknown command: nope/);
      return true;
    },
  );
});

test("builder mutation commands report actionable missing target errors", () => {
  const root = makeTempRoot();
  try {
    runCli(["init", "--root", root]);

    assert.throws(
      () => runCliFailure(["bump", "--root", root, "--level", "patch"]),
      (error) => {
        assert.notEqual(error.status, 0);
        assert.match(String(error.stderr), /Missing required --pcr <library\/pcrs\/\.\.\.> option/);
        return true;
      },
    );

    assert.throws(
      () => runCliFailure(["sync-structured", "--root", root, "--pcr", "library/pcrs/missing"]),
      (error) => {
        assert.notEqual(error.status, 0);
        assert.match(String(error.stderr), /PCR directory not found:/);
        return true;
      },
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scaffold-cpc creates PCR directories only for CPC leaf classes", () => {
  const root = makeTempRoot();
  try {
    runCli(["init", "--root", root]);
    const output = runCli([
      "scaffold-cpc",
      "--root",
      root,
      "--source",
      sampleCpcPath,
      "--classification-version",
      "3.0",
    ]);

    assert.match(output, /scaffolded 3 CPC leaf PCR records/i);

    const wheatSeedDir = path.join(
      root,
      "library/pcrs/agriculture-forestry-and-fishery-products/products-of-agriculture-horticulture-and-market-gardening/wheat-seed",
    );
    const codedWheatSeedDir = path.join(
      root,
      "library/pcrs/agriculture-forestry-and-fishery-products/products-of-agriculture-horticulture-and-market-gardening/01111-wheat-seed",
    );
    const wheatDir = path.join(
      root,
      "library/pcrs/agriculture-forestry-and-fishery-products/products-of-agriculture-horticulture-and-market-gardening/0111-wheat",
    );

    assert.equal(existsSync(path.join(wheatSeedDir, "manifest.yaml")), true);
    assert.equal(existsSync(path.join(wheatSeedDir, "pcr.en-US.md")), true);
    assert.equal(existsSync(path.join(wheatSeedDir, "pcr.zh-CN.md")), true);
    assert.equal(existsSync(path.join(wheatSeedDir, "structured.yaml")), true);
    assert.equal(existsSync(codedWheatSeedDir), false);
    assert.equal(existsSync(wheatDir), false);

    const leaves = JSON.parse(
      readFileSync(
        path.join(root, "classifications/systems/cpc/3.0/normalized/leaves.json"),
        "utf8",
      ),
    );
    assert.deepEqual(
      leaves.leaves.map((entry) => entry.code),
      ["01111", "01112", "01121"],
    );

    const slugs = JSON.parse(
      readFileSync(
        path.join(root, "classifications/systems/cpc/3.0/normalized/leaf-slugs.json"),
        "utf8",
      ),
    );
    const wheatSeedSlug = slugs.leaves.find((entry) => entry.code === "01111");
    assert.equal(
      wheatSeedSlug.pcr_dir,
      "library/pcrs/agriculture-forestry-and-fishery-products/products-of-agriculture-horticulture-and-market-gardening/wheat-seed",
    );
    assert.doesNotMatch(wheatSeedSlug.pcr_dir, /\/01111-/);

    const mapping = readFileSync(
      path.join(root, "classifications/mappings/cpc-3.0-to-pcr.yaml"),
      "utf8",
    );
    assert.match(mapping, /code: "01111"/);
    assert.match(mapping, /pcr_id: "pcr\.agriculture-forestry-and-fishery-products\.products-of-agriculture-horticulture-and-market-gardening\.wheat-seed"/);
    assert.doesNotMatch(mapping, /pcr_id: ".*\.01111-wheat-seed"/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scaffold-cpc keeps generated PCR directory segments short for long CPC titles", () => {
  const root = makeTempRoot();
  try {
    const csvPath = path.join(root, "long-cpc.csv");
    writeFileSync(
      csvPath,
      `CPC Ver. 3.0  Code,CPC Ver. 3.0 Title
2,"Food products, beverages and tobacco; textiles, apparel and leather products"
26,"Yarn and thread; woven and tufted textile fabrics"
267,"Woven fabrics of man-made filament yarn"
2671,"Woven fabrics of man-made filament yarn"
26710,"Woven fabrics of man-made filament yarn obtained from high tenacity yarn of nylon or other polyamides, of polyesters or of viscose rayon; woven fabrics of synthetic filament yarn obtained from strip or the like; woven fabrics of synthetic filament yarn consisting of layers of parallel yarns superimposed on each other at angles, the layers being bonded at the intersections of the yarns, including mesh scrims"
`,
    );
    runCli(["init", "--root", root]);
    runCli([
      "scaffold-cpc",
      "--root",
      root,
      "--source",
      csvPath,
      "--classification-version",
      "3.0",
    ]);

    const slugs = JSON.parse(
      readFileSync(
        path.join(root, "classifications/systems/cpc/3.0/normalized/leaf-slugs.json"),
        "utf8",
      ),
    );
    const pcrDir = slugs.leaves[0].pcr_dir;
    const maxSegmentLength = Math.max(...pcrDir.split("/").map((segment) => segment.length));

    assert.equal(slugs.leaves.length, 1);
    assert.equal(maxSegmentLength <= 120, true);
    assert.doesNotMatch(pcrDir, /\/26710-/);
    assert.match(pcrDir, /woven-fabrics-of-man-made-filament-yarn-obtained-from-high-tenacity-yarn/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
