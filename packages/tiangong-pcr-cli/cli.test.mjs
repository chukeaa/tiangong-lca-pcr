import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

function runCliFailure(args) {
  return execFileSync(process.execPath, [cliPath, "--root", repoRoot, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("list prints PCR records as JSON", () => {
  const output = runCli(["list", "--status", "candidate", "--format", "json"]);
  const page = JSON.parse(output);

  assert.equal(page.page, 1);
  assert.equal(page.page_size, 10);
  assert.ok(page.items.some((entry) => entry.id === wheatSeedPcrId));
});

test("list paginates to 10 records by default and suggests the next page", () => {
  const output = runCli(["list"]);

  assert.match(output, /Showing 1-10 of /);
  assert.match(output, /Next page:/);
  assert.match(output, /tiangong-pcr list --page 2/);
});

test("help explains the Agent selection workflow", () => {
  const output = runCli(["--help"]);

  assert.match(output, /Usage:/);
  assert.match(output, /Agent workflow/);
  assert.match(output, /resolve --classification/);
  assert.match(output, /tree\/list/);
  assert.match(output, /guidance --pcr/);
  assert.match(output, /validate-dataset/);
});

test("list help explains pagination and JSON output", () => {
  const output = runCli(["list", "--help"]);

  assert.match(output, /Usage: tiangong-pcr list/);
  assert.match(output, /Defaults to 10 records per page/);
  assert.match(output, /JSON output/);
  assert.match(output, /next_command/);
});

test("resolve help explains deterministic mapping usage", () => {
  const output = runCli(["resolve", "--help"]);

  assert.match(output, /Usage: tiangong-pcr resolve/);
  assert.match(output, /deterministic classification mapping/);
  assert.match(output, /cpc:3.0:01111/);
});

test("feedback draft help lists feedback types", () => {
  const output = runCli(["feedback", "draft", "--help"]);

  assert.match(output, /Usage: tiangong-pcr feedback draft/);
  assert.match(output, /range_evidence_update/);
  assert.match(output, /translation_mismatch/);
});

test("resolve prints deterministic classification mapping as JSON", () => {
  const output = runCli(["resolve", "--classification", "cpc:3.0:01111", "--format", "json"]);
  const result = JSON.parse(output);

  assert.equal(result.mapping.pcr_id, wheatSeedPcrId);
  assert.equal(result.mapping.mapping_type, "exact");
});

test("guidance prints Agent-facing data-production PCR rules", () => {
  const output = runCli(["guidance", "--pcr", wheatSeedPcrId, "--format", "json"]);
  const guidance = JSON.parse(output);

  assert.equal(guidance.reference_flow.reference_unit, "kg");
  assert.equal(guidance.boundary_abstraction.declared_starting_condition, "source_seed_lot");
  assert.ok(guidance.process_map.length > 0);
  assert.ok(guidance.production_guidance.collection_protocols.length > 0);
  assert.equal(guidance.published_dataset_profile.downstream_use.includes("secondary_dataset"), true);
});

test("validate-dataset reports missing collection protocol records", () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "tiangong-pcr-dataset-"));
  try {
    const inputPath = path.join(tempDir, "dataset.json");
    writeFileSync(inputPath, JSON.stringify({ collection_records: [{ protocol_id: "cp_source_seed_lot_mass" }] }));

    const output = runCli(["validate-dataset", "--pcr", wheatSeedPcrId, "--input", inputPath, "--format", "json"]);
    const result = JSON.parse(output);

    assert.ok(result.findings.some((finding) => finding.code === "missing_collection_protocol_record"));
    assert.ok(result.findings.some((finding) => finding.message.includes("cp_harvested_seed_mass")));
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
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

test("unknown command fails explicitly", () => {
  assert.throws(
    () => runCliFailure(["nope"]),
    (error) => {
      assert.notEqual(error.status, 0);
      assert.match(String(error.stderr), /Unknown command: nope/);
      return true;
    },
  );
});

test("invalid output format fails explicitly", () => {
  assert.throws(
    () => runCliFailure(["list", "--format", "xml"]),
    (error) => {
      assert.notEqual(error.status, 0);
      assert.match(String(error.stderr), /Invalid --format "xml"/);
      return true;
    },
  );
});

test("invalid numeric options fail explicitly", () => {
  assert.throws(
    () => runCliFailure(["tree", "--depth", "abc"]),
    (error) => {
      assert.notEqual(error.status, 0);
      assert.match(String(error.stderr), /Invalid --depth "abc"/);
      return true;
    },
  );

  assert.throws(
    () => runCliFailure(["list", "--page-size", "0"]),
    (error) => {
      assert.notEqual(error.status, 0);
      assert.match(String(error.stderr), /Invalid --page-size "0"/);
      return true;
    },
  );
});
