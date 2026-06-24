import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseYaml } from "../../packages/pcr-core/src/yaml-lite.mjs";
import { parsePcrMarkdownToStructured } from "./markdown-projection.mjs";
import { PCR_EN_FILE, PCR_ZH_FILE } from "./scaffold-templates.mjs";
import { REQUIRED_DIRS } from "./builder-constants.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(__dirname, "../..");

function rootFromOptions(options) {
  return path.resolve(String(options.root ?? defaultRoot));
}

const PROCESS_INCLUSION_VALUES = new Set(["required", "conditional", "optional", "excluded_by_default"]);
const AMOUNT_KIND_VALUES = new Set([
  "exact",
  "range",
  "formula",
  "site_specific",
  "product_specific",
  "route_specific",
  "not_applicable",
]);
const BASIS_KIND_VALUES = new Set([
  "reference_flow",
  "process_output",
  "n_input",
  "fuel_inventory",
  "transport_service",
  "storage_duration",
  "crop_cycle",
]);
const EVIDENCE_KIND_VALUES = new Set([
  "external_source",
  "observed_dataset",
  "method_formula",
  "foreground_data",
  "tiangong_default",
  "collected_record",
  "calculated_from_collection",
  "identity_reference",
  "source_rule",
]);
const BOUNDARY_ABSTRACTION_REQUIRED_FIELDS = [
  "declared_starting_condition",
  "starting_condition_role",
  "product_classification_scope",
  "recursive_input_rule",
  "upstream_dataset_requirement",
  "disclosure",
];
const RECURSIVE_ORIGIN_TERM_PATTERN =
  /\b(first[- ]generation|previous[- ]generation)\b|第一代|上一代/giu;

function walkDirectories(root) {
  if (!existsSync(root)) {
    return [];
  }
  const results = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    results.push(current);
    for (const entry of readdirSync(current)) {
      const child = path.join(current, entry);
      if (statSync(child).isDirectory()) {
        stack.push(child);
      }
    }
  }
  return results;
}

function toRepoRelative(root, absolutePath) {
  return path.relative(root, absolutePath).replaceAll(path.sep, "/");
}

function inventoryRows(processInventory) {
  const rows = [];
  for (const processEntry of processInventory) {
    for (const direction of ["inputs", "outputs"]) {
      for (const flowType of ["product", "waste", "elementary"]) {
        for (const row of processEntry[direction][flowType]) {
          rows.push({ processEntry, direction, flowType, row });
        }
      }
    }
  }
  return rows;
}

function topLevelValue(text, key) {
  const value = parseYaml(text)[key];
  return value === undefined || value === null ? null : String(value);
}

function isMaterialManifest(text) {
  const status = topLevelValue(text, "status");
  const maturity = topLevelValue(text, "content_maturity");
  return (
    ["candidate", "active", "published"].includes(status) ||
    ["authored_methodology", "reviewed_methodology"].includes(maturity)
  );
}

function validatePcrProjection(markdownPath, projection, problems, root, material = false, markdown = "") {
  const relativePath = toRepoRelative(root, markdownPath);
  const rows = inventoryRows(projection.processInventory);
  if (rows.length === 0 && projection.processMap.length === 0) {
    return;
  }

  const processMapById = new Map(projection.processMap.map((entry) => [entry.id, entry]));
  const processInventoryById = new Map(projection.processInventory.map((entry) => [entry.id, entry]));

  if (projection.processMap.length === 0) {
    problems.push(`${relativePath}: missing Process Map table in section 6`);
  }

  for (const entry of projection.processMap) {
    if (!entry.id) {
      problems.push(`${relativePath}: Process Map row is missing process_id`);
    }
    if (!PROCESS_INCLUSION_VALUES.has(entry.inclusion)) {
      problems.push(`${relativePath}: Process Map ${entry.id || "(missing id)"} has invalid inclusion "${entry.inclusion}"`);
    }
    if (entry.inclusion === "conditional" && !entry.inclusion_condition) {
      problems.push(`${relativePath}: conditional process ${entry.id} is missing inclusion_condition`);
    }
    if (entry.inclusion === "required" && !processInventoryById.has(entry.id)) {
      problems.push(`${relativePath}: required process ${entry.id} has no detailed inventory section`);
    }
  }

  for (const entry of projection.processInventory) {
    if (projection.processMap.length > 0 && !processMapById.has(entry.id)) {
      problems.push(`${relativePath}: detailed process ${entry.id} is not declared in Process Map`);
    }
  }

  const sourceIds = new Set(projection.dataSources.map((source) => source.id));
  const collectionProtocolIds = new Set(
    projection.collectionProtocols.map((protocol) => protocol.protocol_id).filter(Boolean),
  );
  for (const { processEntry, row } of rows) {
    const context = `${relativePath}: process ${processEntry.id} flow "${row.role || row.name}"`;
    if (!AMOUNT_KIND_VALUES.has(row.amount_kind)) {
      problems.push(`${context} has invalid amount_kind "${row.amount_kind}"`);
    }
    if (!BASIS_KIND_VALUES.has(row.basis_kind)) {
      problems.push(`${context} has invalid basis_kind "${row.basis_kind}"`);
    }
    if (!EVIDENCE_KIND_VALUES.has(row.evidence_kind)) {
      problems.push(`${context} has invalid evidence_kind "${row.evidence_kind}"`);
    }
    if ((row.evidence_kind === "external_source" || row.evidence_kind === "method_formula") && row.source_ids.length === 0) {
      problems.push(`${context} requires source_ids for evidence_kind ${row.evidence_kind}`);
    }
    if (
      material &&
      ["foreground_data", "collected_record", "calculated_from_collection"].includes(row.evidence_kind) &&
      row.amount_kind !== "not_applicable"
    ) {
      if (!row.collection_protocol_id) {
        problems.push(`${context} requires collection_protocol_id for evidence_kind ${row.evidence_kind}`);
      } else if (!collectionProtocolIds.has(row.collection_protocol_id)) {
        problems.push(`${context} references unknown collection_protocol_id ${row.collection_protocol_id}`);
      }
    }
    for (const sourceId of row.source_ids) {
      if (!sourceIds.has(sourceId)) {
        problems.push(`${context} references unknown source_id ${sourceId}`);
      }
    }
  }

  if (!material) {
    return;
  }

  for (const match of String(markdown).matchAll(RECURSIVE_ORIGIN_TERM_PATTERN)) {
    problems.push(`${relativePath}: contains prohibited recursive-origin term "${match[0]}"`);
  }

  const boundaryAbstraction = projection.boundaryAbstraction ?? {};
  for (const key of BOUNDARY_ABSTRACTION_REQUIRED_FIELDS) {
    if (!boundaryAbstraction[key]) {
      problems.push(`${relativePath}: Boundary Abstraction is missing ${key}`);
    }
  }

  for (const protocol of projection.collectionProtocols) {
    const context = `${relativePath}: collection protocol ${protocol.protocol_id}`;
    for (const key of [
      "process_id",
      "flow_role",
      "record_type",
      "raw_fields",
      "collection_method",
      "unit",
      "frequency",
      "temporal_coverage",
      "site_scope",
      "aggregation_rule",
      "quality_evidence",
    ]) {
      if (!protocol[key]) {
        problems.push(`${context} is missing ${key}`);
      }
    }
  }

  const profile = projection.publishedDatasetProfile ?? {};
  for (const key of [
    "dataset_role",
    "downstream_use",
    "allowed_use",
    "excluded_use",
    "required_metadata",
    "required_quality_disclosure",
    "update_trigger",
  ]) {
    if (!profile[key]) {
      problems.push(`${relativePath}: Published Dataset Profile is missing ${key}`);
    }
  }
}

export function lint(options) {
  const root = rootFromOptions(options);
  const problems = [];

  for (const dir of REQUIRED_DIRS) {
    if (!existsSync(path.join(root, dir))) {
      problems.push(`Missing required directory: ${dir}`);
    }
  }

  const pcrRoot = path.join(root, "library/pcrs");
  for (const directory of walkDirectories(pcrRoot)) {
    const manifest = path.join(directory, "manifest.yaml");
    if (!existsSync(manifest)) {
      continue;
    }
    for (const fileName of [PCR_EN_FILE, PCR_ZH_FILE, "structured.yaml"]) {
      const candidate = path.join(directory, fileName);
      if (!existsSync(candidate)) {
        problems.push(`Missing PCR file: ${toRepoRelative(root, candidate)}`);
      }
    }
    const canonicalMarkdown = path.join(directory, PCR_EN_FILE);
    if (existsSync(canonicalMarkdown)) {
      const manifestText = readFileSync(manifest, "utf8");
      const markdownText = readFileSync(canonicalMarkdown, "utf8");
      validatePcrProjection(
        canonicalMarkdown,
        parsePcrMarkdownToStructured(markdownText),
        problems,
        root,
        isMaterialManifest(manifestText),
        markdownText,
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(`PCR library lint failed.\n${problems.map((problem) => `- ${problem}`).join("\n")}`);
  }

  return ["PCR library lint passed."];
}
