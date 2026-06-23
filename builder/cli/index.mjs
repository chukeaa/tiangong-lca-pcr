#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(__dirname, "../..");

const REQUIRED_DIRS = [
  "library/pcrs",
  "library/modules",
  "library/indexes",
  "classifications/systems",
  "classifications/mappings",
  "builder/cli",
  "builder/method",
  "builder/templates",
  "builder/schemas",
  "builder/scripts",
  "docs",
];

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = { _: [] };

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) {
      options._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = rest[index + 1];
    if (next === undefined || next.startsWith("--")) {
      options[key] = true;
      continue;
    }
    options[key] = next;
    index += 1;
  }

  return { command, options };
}

function rootFromOptions(options) {
  return path.resolve(String(options.root ?? defaultRoot));
}

function ensureDir(root, relativePath) {
  mkdirSync(path.join(root, relativePath), { recursive: true });
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

function normalizeSlug(value) {
  return String(value ?? "")
    .trim()
    .replace(/^\/+|\/+$/gu, "")
    .replaceAll("\\", "/")
    .replace(/\/{2,}/gu, "/");
}

function pcrManifest(options) {
  const pcrId = String(options["pcr-id"] ?? "pcr.sample.placeholder");
  const titleEn = String(options["title-en"] ?? "Sample PCR Placeholder");
  const titleZh = String(options["title-zh-CN"] ?? "PCR 样例占位");

  return `schema_version: 1
id: ${pcrId}
title:
  en: ${JSON.stringify(titleEn)}
  zh-CN: ${JSON.stringify(titleZh)}
status: scaffold
pcr_kind: product_category_rule
content_maturity: empty_scaffold
languages:
  canonical: en
  available:
    - en
    - zh-CN
translation_status:
  zh-CN: scaffold
target_entities:
  - flow
  - process
  - lifecyclemodel
`;
}

function pcrMarkdown(options, language) {
  const pcrId = String(options["pcr-id"] ?? "pcr.sample.placeholder");
  const title =
    language === "zh-CN"
      ? String(options["title-zh-CN"] ?? "PCR 样例占位")
      : String(options["title-en"] ?? "Sample PCR Placeholder");
  const sections =
    language === "zh-CN"
      ? [
          "范围与适用性",
          "分析单位",
          "参考流模式",
          "清单流模式",
          "系统边界",
          "分配与计算规则",
          "数据质量与证据规则",
          "生命周期模型指导",
          "校验规则",
          "开放问题",
        ]
      : [
          "Scope and Applicability",
          "Unit of Analysis",
          "Reference Flow Patterns",
          "Inventory Flow Patterns",
          "System Boundary",
          "Allocation and Calculation Rules",
          "Data Quality and Evidence Rules",
          "Lifecycle Model Guidance",
          "Validation Rules",
          "Open Questions",
        ];

  return `---
pcr_id: ${pcrId}
language: ${language}
status: scaffold
sync_with: ${language === "zh-CN" ? "pcr.en.md" : "pcr.zh-CN.md"}
---

# ${title}

${sections.map((section) => `## ${section}\n`).join("\n")}`;
}

function structuredYaml() {
  return `schema_version: 1
status: scaffold
reference_flows: []
inventory_patterns: []
qa_rules: []
`;
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
  en: ${yamlString(leaf.title)}
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
languages:
  canonical: en
  available:
    - en
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
sync_with: ${language === "zh-CN" ? "pcr.en.md" : "pcr.zh-CN.md"}
---

# ${title}
`;
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
inventory_patterns: []
qa_rules: []
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

function scaffoldCpc(options) {
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
    console.error(`CPC source file not found: ${source}`);
    process.exit(1);
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
    writeIfMissing(root, path.join(pcrRoot, "pcr.en.md"), cpcLeafMarkdown(leaf, "en"));
    writeIfMissing(root, path.join(pcrRoot, "pcr.zh-CN.md"), cpcLeafMarkdown(leaf, "zh-CN"));
    writeIfMissing(root, path.join(pcrRoot, "structured.yaml"), cpcStructuredYaml(leaf, classificationVersion));
  }

  console.log(`Scaffolded ${leaves.length} CPC leaf PCR records from ${entries.length} CPC rows.`);
}

function init(options) {
  const root = rootFromOptions(options);
  for (const dir of REQUIRED_DIRS) {
    ensureDir(root, dir);
  }

  writeIfMissing(
    root,
    "library/pcrs/README.md",
    `# PCR Records

Each canonical PCR is represented as a directory:

\`\`\`text
library/pcrs/<domain>/<subdomain>/<pcr-slug>/
  manifest.yaml
  pcr.en.md
  pcr.zh-CN.md
  structured.yaml
\`\`\`

The PCR directory is the stable identity boundary. Classification systems map to PCR ids through \`classifications/mappings/\`.
`,
  );

  writeIfMissing(
    root,
    "library/modules/README.md",
    `# PCR Method Modules

Reusable modules use the same directory pattern when localized:

\`\`\`text
library/modules/<group>/<module-slug>/
  manifest.yaml
  module.en.md
  module.zh-CN.md
  structured.yaml
\`\`\`
`,
  );

  writeIfMissing(
    root,
    "builder/README.md",
    `# PCR Library Builder

## Builder CLI

\`\`\`bash
node builder/cli/index.mjs init
node builder/cli/index.mjs lint
\`\`\`

\`init\` creates the expected scaffold directories and optional sample PCR records. \`lint\` validates the repository structure.
`,
  );

  if (options["sample-pcr"]) {
    const sampleSlug = normalizeSlug(options["sample-pcr"]);
    const sampleRoot = path.join("library/pcrs", sampleSlug);
    writeIfMissing(root, path.join(sampleRoot, "manifest.yaml"), pcrManifest(options));
    writeIfMissing(root, path.join(sampleRoot, "pcr.en.md"), pcrMarkdown(options, "en"));
    writeIfMissing(root, path.join(sampleRoot, "pcr.zh-CN.md"), pcrMarkdown(options, "zh-CN"));
    writeIfMissing(root, path.join(sampleRoot, "structured.yaml"), structuredYaml());
  }

  console.log(`Initialized PCR library scaffold at ${root}`);
}

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

function lint(options) {
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
    for (const fileName of ["pcr.en.md", "pcr.zh-CN.md", "structured.yaml"]) {
      const candidate = path.join(directory, fileName);
      if (!existsSync(candidate)) {
        problems.push(`Missing PCR file: ${toRepoRelative(root, candidate)}`);
      }
    }
  }

  if (problems.length > 0) {
    console.error("PCR library lint failed.");
    for (const problem of problems) {
      console.error(`- ${problem}`);
    }
    process.exit(1);
  }

  console.log("PCR library lint passed.");
}

function printHelp() {
  console.log(`PCR Library Builder CLI

Usage:
  node builder/cli/index.mjs init [--root <path>] [--sample-pcr <domain/path/slug>]
  node builder/cli/index.mjs lint [--root <path>]
  node builder/cli/index.mjs scaffold-cpc --source <csv> [--classification-version 3.0]
`);
}

const { command, options } = parseArgs(process.argv.slice(2));

if (command === "init") {
  init(options);
} else if (command === "lint") {
  lint(options);
} else if (command === "scaffold-cpc") {
  scaffoldCpc(options);
} else {
  printHelp();
  process.exit(command ? 1 : 0);
}
