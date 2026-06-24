import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { init } from "./builder-operations.mjs";
import { PCR_EN_FILE, PCR_ZH_FILE, enPcrBody, zhPcrBody } from "./scaffold-templates.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(__dirname, "../..");

function rootFromOptions(options) {
  return path.resolve(String(options.root ?? defaultRoot));
}

function writeIfMissing(root, relativePath, content) {
  const target = path.join(root, relativePath);
  if (existsSync(target)) {
    return false;
  }
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
  return true;
}

function parseCsvRows(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;
  const normalized = text.replace(/^\uFEFF/u, "");

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }
    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function readCpcCsv(sourcePath) {
  const rows = parseCsvRows(readFileSync(sourcePath, "utf8"));
  const entries = [];
  for (const [index, row] of rows.entries()) {
    if (index === 0) {
      continue;
    }
    const [codeRaw, titleRaw] = row;
    const code = String(codeRaw ?? "").trim();
    const title = String(titleRaw ?? "").trim();
    if (!code || !title) {
      continue;
    }
    entries.push({ code, title, level: code.length - 1 });
  }
  return entries;
}

function parentCodeFor(code) {
  return code.length > 1 ? code.slice(0, code.length - 1) : null;
}

function normalizeAsciiSlug(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/&/gu, " and ")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .replace(/-{2,}/gu, "-");
}

function stableHash(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 8);
}

function boundedSlug(value, maxLength = 96) {
  const slug = normalizeAsciiSlug(value) || "untitled";
  if (slug.length <= maxLength) {
    return slug;
  }
  const hash = stableHash(value);
  const prefix = slug.slice(0, maxLength - hash.length - 1).replace(/-+$/gu, "");
  return `${prefix}-${hash}`;
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function buildCpcModel(entries) {
  const byCode = new Map(entries.map((entry) => [entry.code, { ...entry }]));
  const childCodesByParent = new Map();

  for (const entry of byCode.values()) {
    const parentCode = parentCodeFor(entry.code);
    entry.parent_code = parentCode;
    if (parentCode && byCode.has(parentCode)) {
      const childCodes = childCodesByParent.get(parentCode) ?? [];
      childCodes.push(entry.code);
      childCodesByParent.set(parentCode, childCodes);
    }
  }

  function pathFor(code) {
    const pathEntries = [];
    let current = byCode.get(code);
    while (current) {
      pathEntries.push(current);
      current = current.parent_code ? byCode.get(current.parent_code) : null;
    }
    return pathEntries.reverse();
  }

  const nodes = Array.from(byCode.values()).map((entry) => {
    const pathEntries = pathFor(entry.code);
    const children = childCodesByParent.get(entry.code) ?? [];
    return {
      code: entry.code,
      title: entry.title,
      level: entry.level,
      parent_code: entry.parent_code,
      path_codes: pathEntries.map((pathEntry) => pathEntry.code),
      path_titles: pathEntries.map((pathEntry) => pathEntry.title),
      child_codes: children,
      is_leaf: children.length === 0,
    };
  });

  const leaves = nodes.filter((node) => node.is_leaf);
  return { nodes, leaves };
}

function basePcrDirectoryForLeaf(leaf) {
  const section = leaf.path_titles[0] ?? "unclassified";
  const division = leaf.path_titles[1] ?? section;
  return path.join(
    boundedSlug(section, 80),
    boundedSlug(division, 80),
    boundedSlug(leaf.title, 96),
  );
}

function pcrIdForLeaf(leaf) {
  const pcrDirectory = leaf.pcr_directory ?? basePcrDirectoryForLeaf(leaf);
  return `pcr.${pcrDirectory.replaceAll(path.sep, ".")}`;
}

function withPcrIdentity(leaves) {
  const leavesByBaseDirectory = new Map();
  for (const leaf of leaves) {
    const baseDirectory = basePcrDirectoryForLeaf(leaf);
    const entries = leavesByBaseDirectory.get(baseDirectory) ?? [];
    entries.push(leaf);
    leavesByBaseDirectory.set(baseDirectory, entries);
  }

  const directoryByCode = new Map();
  for (const [baseDirectory, entries] of leavesByBaseDirectory.entries()) {
    if (entries.length === 1) {
      directoryByCode.set(entries[0].code, baseDirectory);
      continue;
    }
    for (const leaf of entries) {
      directoryByCode.set(leaf.code, `${baseDirectory}-${stableHash(`${leaf.code}:${leaf.title}`)}`);
    }
  }

  return leaves.map((leaf) => {
    const pcrDirectory = directoryByCode.get(leaf.code);
    return {
      ...leaf,
      pcr_directory: pcrDirectory,
      pcr_dir: `library/pcrs/${pcrDirectory.replaceAll(path.sep, "/")}`,
      pcr_id: `pcr.${pcrDirectory.replaceAll(path.sep, ".")}`,
    };
  });
}

function cpcLeafManifest(leaf, classificationVersion) {
  const pcrId = pcrIdForLeaf(leaf);
  return `schema_version: 1
id: ${pcrId}
title:
  en-US: ${yamlString(leaf.title)}
  zh-CN: null
status: scaffold
pcr_kind: product_category_rule
content_maturity: empty_scaffold
domains:
  - ${yamlString(normalizeAsciiSlug(leaf.path_titles[0] ?? "unclassified"))}
modules:
  core:
    - pcr-minimum-content
    - unit-of-analysis
    - reference-flow
    - inventory-flow-taxonomy
    - system-boundary
    - allocation
    - data-quality
    - validation-rules
target_entities:
  - flow
  - process
  - lifecyclemodel
  - dataset
languages:
  canonical: en-US
  available:
    - en-US
    - zh-CN
translation_status:
  zh-CN: scaffold_pending_translation
classification_refs:
  - system: CPC
    version: ${yamlString(classificationVersion)}
    code: ${yamlString(leaf.code)}
    title: ${yamlString(leaf.title)}
    mapping_type: exact
`;
}

function cpcLeafMarkdown(leaf, language) {
  const pcrId = pcrIdForLeaf(leaf);
  const title = language === "zh-CN" ? "待补充" : leaf.title;
  return `---
pcr_id: ${pcrId}
language: ${language}
status: scaffold
sync_with: ${language === "zh-CN" ? PCR_EN_FILE : PCR_ZH_FILE}
---

# ${title}

${language === "zh-CN" ? zhPcrBody() : enPcrBody()}`;
}

function cpcStructuredYaml(leaf, classificationVersion) {
  return `schema_version: 1
status: scaffold
classification_seed:
  system: CPC
  version: ${yamlString(classificationVersion)}
  code: ${yamlString(leaf.code)}
  title: ${yamlString(leaf.title)}
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

function writeJson(root, relativePath, payload) {
  const target = path.join(root, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
}

function writeText(root, relativePath, content) {
  const target = path.join(root, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function mappingYaml(classificationVersion, leaves) {
  const lines = [
    "schema_version: 1",
    "classification_system: CPC",
    `classification_version: ${yamlString(classificationVersion)}`,
    "status: scaffold",
    "mappings:",
  ];
  for (const leaf of leaves) {
    lines.push(
      `  - code: ${yamlString(leaf.code)}`,
      `    label: ${yamlString(leaf.title)}`,
      `    pcr_id: ${yamlString(pcrIdForLeaf(leaf))}`,
      "    mapping_type: exact",
      "    confidence: scaffold",
    );
  }
  return `${lines.join("\n")}\n`;
}

export function scaffoldCpc(options) {
  const root = rootFromOptions(options);
  init({ root });
  const classificationVersion = String(options["classification-version"] ?? "3.0");
  const source = options.source
    ? path.resolve(String(options.source))
    : path.join(
        root,
        "classifications/systems/cpc",
        classificationVersion,
        "raw/CPC_Ver_3.0_Structure_30Jun2025.csv",
      );
  if (!existsSync(source)) {
    throw new Error(`CPC source file not found: ${source}`);
  }

  const entries = readCpcCsv(source);
  const { nodes, leaves } = buildCpcModel(entries);
  const pcrLeaves = withPcrIdentity(leaves);
  const rawDir = path.join(root, "classifications/systems/cpc", classificationVersion, "raw");
  mkdirSync(rawDir, { recursive: true });
  const rawTarget = path.join(rawDir, path.basename(source));
  if (path.resolve(source) !== path.resolve(rawTarget)) {
    copyFileSync(source, rawTarget);
  }

  writeText(
    root,
    `classifications/systems/cpc/${classificationVersion}/raw/source-metadata.yaml`,
    `schema_version: 1
classification_system: CPC
classification_version: ${yamlString(classificationVersion)}
source_file: ${yamlString(path.basename(source))}
source_url: ${yamlString(options["source-url"] ?? "")}
sha256: ${yamlString(sha256File(source))}
retrieved_at_utc: ${yamlString(new Date().toISOString())}
`,
  );

  writeJson(root, `classifications/systems/cpc/${classificationVersion}/normalized/hierarchy.json`, {
    schema_version: 1,
    classification_system: "CPC",
    classification_version: classificationVersion,
    status: "scaffold",
    nodes,
  });
  writeJson(root, `classifications/systems/cpc/${classificationVersion}/normalized/leaves.json`, {
    schema_version: 1,
    classification_system: "CPC",
    classification_version: classificationVersion,
    status: "scaffold",
    leaves,
  });
  writeJson(root, `classifications/systems/cpc/${classificationVersion}/normalized/paths.json`, {
    schema_version: 1,
    classification_system: "CPC",
    classification_version: classificationVersion,
    status: "scaffold",
    paths: nodes.map((node) => ({
      code: node.code,
      title: node.title,
      path_codes: node.path_codes,
      path_titles: node.path_titles,
      is_leaf: node.is_leaf,
    })),
  });
  writeJson(root, `classifications/systems/cpc/${classificationVersion}/normalized/leaf-slugs.json`, {
    schema_version: 1,
    classification_system: "CPC",
    classification_version: classificationVersion,
    status: "scaffold",
    leaves: pcrLeaves.map((leaf) => ({
      code: leaf.code,
      title: leaf.title,
      pcr_dir: leaf.pcr_dir,
      pcr_id: pcrIdForLeaf(leaf),
    })),
  });
  writeText(
    root,
    `classifications/mappings/cpc-${classificationVersion}-to-pcr.yaml`,
    mappingYaml(classificationVersion, pcrLeaves),
  );

  for (const leaf of pcrLeaves) {
    const pcrRoot = path.join("library/pcrs", leaf.pcr_directory);
    writeIfMissing(root, path.join(pcrRoot, "manifest.yaml"), cpcLeafManifest(leaf, classificationVersion));
    writeIfMissing(root, path.join(pcrRoot, PCR_EN_FILE), cpcLeafMarkdown(leaf, "en-US"));
    writeIfMissing(root, path.join(pcrRoot, PCR_ZH_FILE), cpcLeafMarkdown(leaf, "zh-CN"));
    writeIfMissing(root, path.join(pcrRoot, "structured.yaml"), cpcStructuredYaml(leaf, classificationVersion));
  }

  return [`Scaffolded ${leaves.length} CPC leaf PCR records from ${entries.length} CPC rows.`];
}
