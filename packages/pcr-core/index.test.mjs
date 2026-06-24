import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  buildGuidance,
  createFeedbackDraft,
  listPcrs,
  resolveClassification,
  validateDatasetAgainstGuidance,
} from "./src/index.mjs";
import { parseYaml, renderYaml } from "./src/yaml-lite.mjs";

const repoRoot = path.resolve(".");
const wheatSeedPcrId =
  "pcr.agriculture-forestry-and-fishery-products.products-of-agriculture-horticulture-and-market-gardening.wheat-seed";

test("listPcrs exposes canonical PCR records without relying on search", () => {
  const pcrs = listPcrs({ root: repoRoot });
  const wheatSeed = pcrs.find((entry) => entry.id === wheatSeedPcrId);

  assert.ok(wheatSeed);
  assert.equal(wheatSeed.title["en-US"], "Wheat seed for sowing");
  assert.equal(wheatSeed.title["zh-CN"], "小麦播种种子");
  assert.equal(wheatSeed.status, "candidate");
  assert.equal(wheatSeed.path.includes("/01111"), false);
});

test("resolveClassification uses deterministic mapping files", () => {
  const result = resolveClassification({
    root: repoRoot,
    system: "cpc",
    version: "3.0",
    code: "01111",
  });

  assert.equal(result.mapping.pcr_id, wheatSeedPcrId);
  assert.equal(result.mapping.mapping_type, "exact");
  assert.equal(result.pcr.title["en-US"], "Wheat seed for sowing");
});

test("buildGuidance returns structured rules for Agent data package construction", () => {
  const guidance = buildGuidance({ root: repoRoot, pcrId: wheatSeedPcrId });

  assert.equal(guidance.pcr.id, wheatSeedPcrId);
  assert.equal(guidance.reference_flow.reference_unit, "kg");
  assert.equal(guidance.reference_flow.product_flow_ref.uuid, "12da5e7d-9b93-4404-8c7d-08f98bec6238");
  assert.equal(guidance.boundary_abstraction.declared_starting_condition, "source_seed_lot");
  assert.ok(guidance.process_map.some((entry) => entry.id === "field_seed_multiplication"));
  assert.ok(guidance.production_guidance.collection_protocols.length > 0);
  assert.equal(guidance.published_dataset_profile.dataset_role, "unit_process");
  assert.ok(guidance.validation_notes.some((note) => note.includes("validate-dataset")));
});

test("createFeedbackDraft produces issue-ready PCR feedback content", () => {
  const draft = createFeedbackDraft({
    root: repoRoot,
    pcrId: wheatSeedPcrId,
    type: "range_evidence_update",
    affectedSection: "Process Inventory",
    processId: "field_seed_multiplication",
    summary: "Observed a narrower seeding-rate range for a regional dataset.",
  });

  assert.match(draft.title, /PCR feedback: range_evidence_update/);
  assert.match(draft.body, new RegExp(wheatSeedPcrId));
  assert.match(draft.body, /field_seed_multiplication/);
  assert.match(draft.body, /Observed a narrower seeding-rate range/);
});

test("validateDatasetAgainstGuidance reports missing collection protocol records", () => {
  const result = validateDatasetAgainstGuidance({
    root: repoRoot,
    pcrId: wheatSeedPcrId,
    dataset: { collection_records: [{ protocol_id: "cp_source_seed_lot_mass" }] },
  });

  assert.ok(result.findings.some((finding) => finding.code === "missing_collection_protocol_record"));
  assert.ok(result.findings.some((finding) => finding.message.includes("cp_harvested_seed_mass")));
});

test("yaml-lite renders parseable structured YAML", () => {
  const source = {
    schema_version: "1",
    id: "pcr.example",
    title: {
      "en-US": "Example PCR",
      "zh-CN": null,
    },
    status: "published",
    target_entities: ["flow", "process", "dataset"],
    classification_refs: [
      {
        system: "CPC",
        version: "3.0",
        code: "01111",
      },
    ],
  };

  assert.deepEqual(parseYaml(renderYaml(source)), source);
});
