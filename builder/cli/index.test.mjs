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

test("init creates the bilingual PCR repository scaffold", () => {
  const root = makeTempRoot();
  try {
    const output = runCli(["init", "--root", root]);

    assert.match(output, /initialized PCR library scaffold/i);
    assert.match(
      readFileSync(path.join(root, "library/pcrs/README.md"), "utf8"),
      /manifest.yaml/,
    );
    assert.match(
      readFileSync(path.join(root, "library/modules/README.md"), "utf8"),
      /module.en.md/,
    );
    assert.match(
      readFileSync(path.join(root, "builder/README.md"), "utf8"),
      /Builder CLI/,
    );
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
    unlinkSync(path.join(pcrDir, "pcr.zh-CN.md"));

    assert.throws(
      () => runCli(["lint", "--root", root]),
      (error) =>
        String(error.stderr).includes("library/pcrs/agriculture/crops/wheat-seed/pcr.zh-CN.md"),
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
    assert.equal(existsSync(path.join(wheatSeedDir, "pcr.en.md")), true);
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
