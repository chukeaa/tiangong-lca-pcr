import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { readYamlFile } from "./yaml-lite.mjs";

export const FEEDBACK_TYPES = [
  "missing_pcr",
  "classification_mapping_gap",
  "unclear_reference_flow",
  "wrong_or_missing_uuid",
  "process_boundary_issue",
  "inventory_flow_gap",
  "range_evidence_update",
  "unit_or_flow_property_issue",
  "validation_rule_issue",
  "translation_mismatch",
  "source_update",
];

export function listPcrs({ root }) {
  const pcrRoot = path.join(root, "library/pcrs");
  return findManifestFiles(pcrRoot)
    .map((manifestPath) => {
      const manifest = readYamlFile(manifestPath);
      const pcrDir = path.dirname(manifestPath);
      return {
        id: manifest.id,
        path: toPosix(path.relative(root, pcrDir)),
        title: manifest.title ?? {},
        status: manifest.status ?? "unknown",
        version: manifest.version ?? null,
        content_maturity: manifest.content_maturity ?? null,
        languages: manifest.languages ?? {},
        classification_refs: manifest.classification_refs ?? [],
      };
    })
    .filter((entry) => entry.id)
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function buildPcrTree({ root, depth = Infinity }) {
  const tree = {};
  for (const pcr of listPcrs({ root })) {
    const segments = pcr.path.replace(/^library\/pcrs\//u, "").split("/");
    let node = tree;
    for (const [index, segment] of segments.entries()) {
      if (index >= depth) {
        break;
      }
      node[segment] ??= { children: {}, pcrs: [] };
      if (index === segments.length - 1) {
        node[segment].pcrs.push(pcr);
      }
      node = node[segment].children;
    }
  }
  return tree;
}

export function resolveClassification({ root, system, version, code }) {
  const normalizedSystem = String(system).toLowerCase();
  const mappingPath = path.join(
    root,
    "classifications/mappings",
    `${normalizedSystem}-${version}-to-pcr.yaml`,
  );
  if (!existsSync(mappingPath)) {
    throw new Error(`Classification mapping not found: ${toPosix(path.relative(root, mappingPath))}`);
  }
  const mappingFile = readYamlFile(mappingPath);
  const mapping = (mappingFile.mappings ?? []).find((entry) => String(entry.code) === String(code));
  if (!mapping) {
    throw new Error(`No PCR mapping found for ${system}:${version}:${code}`);
  }
  const pcr = getPcrById({ root, pcrId: mapping.pcr_id });
  return {
    classification_system: mappingFile.classification_system,
    classification_version: mappingFile.classification_version,
    mapping,
    pcr,
  };
}

export function getPcrById({ root, pcrId }) {
  const pcr = listPcrs({ root }).find((entry) => entry.id === pcrId);
  if (!pcr) {
    throw new Error(`PCR not found: ${pcrId}`);
  }
  return pcr;
}

export function readPcrMarkdown({ root, pcrId, language = "en-US" }) {
  const pcr = getPcrById({ root, pcrId });
  const markdownPath = path.join(root, pcr.path, `pcr.${language}.md`);
  if (!existsSync(markdownPath)) {
    throw new Error(`PCR Markdown not found: ${toPosix(path.relative(root, markdownPath))}`);
  }
  return readFileSync(markdownPath, "utf8");
}

export function buildGuidance({ root, pcrId }) {
  const pcr = getPcrById({ root, pcrId });
  const structuredPath = path.join(root, pcr.path, "structured.yaml");
  if (!existsSync(structuredPath)) {
    throw new Error(`structured.yaml not found for ${pcrId}`);
  }
  const structured = readYamlFile(structuredPath);
  return {
    schema_version: 1,
    guidance_kind: "tiangong-pcr-agent-guidance",
    pcr,
    source_structured: toPosix(path.relative(root, structuredPath)),
    reference_flow: structured.reference_flow_definition ?? {},
    measurement_rules: structured.measurement_rules ?? structured.unit_conventions ?? [],
    process_map: structured.process_map ?? [],
    process_inventory: structured.process_inventory ?? [],
    data_quality_rules: structured.data_quality_rules ?? [],
    validation_rules: structured.validation_rules ?? [],
    data_sources: structured.data_sources ?? [],
    validation_notes: [
      "Use this guidance to construct process and lifecyclemodel records; do not invent PCR rules from memory.",
      "Preserve Tiangong UUIDs exactly and do not add dataset versions to PCR-derived UUID references.",
      "Run tiangong-pcr validate-model after constructing a model and draft feedback if PCR guidance is missing or ambiguous.",
    ],
  };
}

export function createFeedbackDraft({
  root,
  pcrId,
  type,
  affectedSection = "",
  processId = "",
  flowRole = "",
  summary = "",
  evidence = "",
  proposedChange = "",
  agent = "tiangong-pcr",
}) {
  if (!FEEDBACK_TYPES.includes(type)) {
    throw new Error(`Unsupported feedback type: ${type}`);
  }
  const pcr = pcrId ? getPcrById({ root, pcrId }) : null;
  const title = `PCR feedback: ${type}${pcrId ? ` for ${pcrId}` : ""}`;
  const body = `## Summary

${summary || "Describe the PCR issue or improvement."}

## Feedback metadata

| Field | Value |
| --- | --- |
| PCR id | ${pcrId || ""} |
| PCR version | ${pcr?.version ?? ""} |
| Feedback type | ${type} |
| Affected section | ${affectedSection} |
| Affected process_id | ${processId} |
| Affected flow role | ${flowRole} |
| Generated by | ${agent} |

## Current PCR text or rule excerpt


## Proposed change

${proposedChange}

## Evidence sources

${evidence}

## Impact on LCA model construction


## Maintainer intake checklist

- [ ] Classify the feedback as PCR content, classification mapping, UUID identity, translation, source evidence, or CLI/validator behavior.
- [ ] Verify cited evidence and Tiangong UUID references before changing PCR content.
- [ ] Update canonical \`pcr.en-US.md\` first when methodology changes.
- [ ] Align \`pcr.zh-CN.md\` when user-facing text changes.
- [ ] Run \`npm run pcr:sync-structured -- --pcr <library/pcrs/...>\` when canonical Markdown changes.
- [ ] Bump or publish the PCR manifest if lifecycle state changes.
`;

  return { title, body };
}

export function validateModelAgainstGuidance({ root, pcrId, model }) {
  const guidance = buildGuidance({ root, pcrId });
  const findings = [];
  const text = typeof model === "string" ? model : JSON.stringify(model ?? {});

  for (const qualifier of guidance.reference_flow.required_qualifiers ?? []) {
    if (!text.toLowerCase().includes(String(qualifier).toLowerCase())) {
      findings.push({
        severity: "warning",
        code: "missing_required_qualifier",
        message: `Model text does not mention required qualifier: ${qualifier}`,
      });
    }
  }

  return { pcr: guidance.pcr, finding_count: findings.length, findings };
}

function findManifestFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }
  const results = [];
  for (const entry of readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...findManifestFiles(fullPath));
      continue;
    }
    if (entry === "manifest.yaml") {
      results.push(fullPath);
    }
  }
  return results;
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}
