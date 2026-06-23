import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test from "node:test";

const cliPath = path.resolve("packages/tiangong-pcr-cli/bin/tiangong-pcr.mjs");
const repoRoot = path.resolve(".");
const wheatSeedPcrId =
  "pcr.agriculture-forestry-and-fishery-products.products-of-agriculture-horticulture-and-market-gardening.wheat-seed";

function runCli(args) {
  return execFileSync(process.execPath, [cliPath, "--root", repoRoot, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("list prints PCR records as JSON", () => {
  const output = runCli(["list", "--status", "candidate", "--format", "json"]);
  const pcrs = JSON.parse(output);

  assert.ok(pcrs.some((entry) => entry.id === wheatSeedPcrId));
});

test("resolve prints deterministic classification mapping as JSON", () => {
  const output = runCli(["resolve", "--classification", "cpc:3.0:01111", "--format", "json"]);
  const result = JSON.parse(output);

  assert.equal(result.mapping.pcr_id, wheatSeedPcrId);
  assert.equal(result.mapping.mapping_type, "exact");
});

test("guidance prints Agent-facing structured PCR rules", () => {
  const output = runCli(["guidance", "--pcr", wheatSeedPcrId, "--format", "json"]);
  const guidance = JSON.parse(output);

  assert.equal(guidance.reference_flow.reference_unit, "kg");
  assert.ok(guidance.process_map.length > 0);
});

test("feedback draft prints issue-ready Markdown", () => {
  const output = runCli([
    "feedback",
    "draft",
    "--pcr",
    wheatSeedPcrId,
    "--type",
    "translation_mismatch",
    "--summary",
    "Chinese and English process names diverge.",
  ]);

  assert.match(output, /PCR feedback: translation_mismatch/);
  assert.match(output, /Chinese and English process names diverge/);
});
