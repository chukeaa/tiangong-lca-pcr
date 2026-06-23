import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  buildGuidance,
  createFeedbackDraft,
  listPcrs,
  resolveClassification,
} from "./src/index.mjs";

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

test("buildGuidance returns structured rules for Agent model construction", () => {
  const guidance = buildGuidance({ root: repoRoot, pcrId: wheatSeedPcrId });

  assert.equal(guidance.pcr.id, wheatSeedPcrId);
  assert.equal(guidance.reference_flow.reference_unit, "kg");
  assert.equal(guidance.reference_flow.product_flow_ref.uuid, "12da5e7d-9b93-4404-8c7d-08f98bec6238");
  assert.ok(guidance.process_map.some((entry) => entry.id === "field_seed_multiplication"));
  assert.ok(guidance.validation_notes.some((note) => note.includes("validate-model")));
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
