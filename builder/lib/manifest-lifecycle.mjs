import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseYaml, renderYaml } from "../../packages/pcr-core/src/yaml-lite.mjs";
import { parsePcrMarkdownToStructured, structuredProjectionYaml } from "./markdown-projection.mjs";
import { PCR_EN_FILE } from "./scaffold-templates.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(__dirname, "../..");

function rootFromOptions(options) {
  return path.resolve(String(options.root ?? defaultRoot));
}

function normalizeSlug(value) {
  return String(value ?? "")
    .trim()
    .replace(/^\/+|\/+$/gu, "")
    .replaceAll("\\", "/")
    .replace(/\/{2,}/gu, "/");
}

function toRepoRelative(root, absolutePath) {
  return path.relative(root, absolutePath).replaceAll(path.sep, "/");
}

function pcrDirectoryFromOptions(root, options) {
  const pcr = options.pcr ? normalizeSlug(options.pcr) : null;
  if (!pcr) {
    throw new Error("Missing required --pcr <library/pcrs/...> option.");
  }
  const candidate = path.resolve(root, pcr);
  if (!existsSync(candidate)) {
    throw new Error(`PCR directory not found: ${candidate}`);
  }
  return candidate;
}

export function syncStructured(options) {
  const root = rootFromOptions(options);
  const pcrDir = pcrDirectoryFromOptions(root, options);
  const markdownPath = path.join(pcrDir, PCR_EN_FILE);
  if (!existsSync(markdownPath)) {
    throw new Error(`Missing canonical markdown file: ${markdownPath}`);
  }
  const markdown = readFileSync(markdownPath, "utf8");
  const projection = parsePcrMarkdownToStructured(markdown);
  writeFileSync(path.join(pcrDir, "structured.yaml"), structuredProjectionYaml(projection));
  return [`Synced structured PCR from ${toRepoRelative(root, markdownPath)}.`];
}

function readManifest(root, pcrDir) {
  const manifestPath = path.join(pcrDir, "manifest.yaml");
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing manifest file: ${toRepoRelative(root, manifestPath)}`);
  }
  return { manifestPath, text: readFileSync(manifestPath, "utf8") };
}

function topLevelValue(text, key) {
  const value = parseYaml(text)[key];
  return value === undefined || value === null ? null : String(value);
}

function setTopLevelValue(text, key, value) {
  const manifest = parseYaml(text);
  manifest[key] = String(value);
  return renderYaml(manifest);
}

function setTopLevelPlainValue(text, key, value) {
  return setTopLevelValue(text, key, value);
}

function incrementVersion(current, level) {
  const match = String(current ?? "0.0.0").match(/^(\d+)\.(\d+)\.(\d+)$/u);
  let [major, minor, patch] = match ? match.slice(1).map(Number) : [0, 0, 0];
  if (level === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (level === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
}

function updateManifest(options, updater) {
  const root = rootFromOptions(options);
  const pcrDir = pcrDirectoryFromOptions(root, options);
  const { manifestPath, text } = readManifest(root, pcrDir);
  writeFileSync(manifestPath, updater(text));
  return { root, manifestPath };
}

export function bump(options) {
  const level = String(options.level ?? "patch");
  if (!["major", "minor", "patch"].includes(level)) {
    throw new Error("--level must be one of major, minor, or patch.");
  }
  const now = new Date().toISOString();
  const result = updateManifest(options, (text) => {
    const nextVersion = incrementVersion(topLevelValue(text, "version"), level);
    let updated = setTopLevelValue(text, "version", nextVersion);
    updated = setTopLevelValue(updated, "updated_at_utc", now);
    return updated;
  });
  return [`Updated PCR manifest version at ${toRepoRelative(result.root, result.manifestPath)}.`];
}

export function publish(options) {
  const root = rootFromOptions(options);
  const pcrDir = pcrDirectoryFromOptions(root, options);
  const messages = syncStructured({ ...options, root, pcr: toRepoRelative(root, pcrDir) });
  const now = new Date().toISOString();
  const { manifestPath, text } = readManifest(root, pcrDir);
  const version = String(options.version ?? topLevelValue(text, "version") ?? "0.1.0");
  let updated = setTopLevelPlainValue(text, "status", "published");
  updated = setTopLevelValue(updated, "version", version);
  updated = setTopLevelValue(updated, "published_at_utc", now);
  updated = setTopLevelValue(updated, "updated_at_utc", now);
  writeFileSync(manifestPath, updated);
  return [...messages, `Published PCR manifest at ${toRepoRelative(root, manifestPath)}.`];
}
