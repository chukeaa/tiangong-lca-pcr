#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildGuidance,
  buildPcrTree,
  createFeedbackDraft,
  listPcrs,
  readPcrMarkdown,
  resolveClassification,
  validateModelAgainstGuidance,
} from "../../pcr-core/src/index.mjs";

const defaultRoot = path.resolve(new URL("../../..", import.meta.url).pathname);

function main() {
  try {
    const { command, positional, options } = parseArgs(process.argv.slice(2));
    const root = path.resolve(String(options.root ?? defaultRoot));
    const format = String(options.format ?? "table");

    if (command === "list") {
      writeOutput(filterPcrs(listPcrs({ root }), options), format, formatListTable);
      return;
    }
    if (command === "tree") {
      const depth = options.depth ? Number(options.depth) : Infinity;
      const tree = buildPcrTree({ root, depth });
      writeOutput(tree, format, formatTreeMarkdown);
      return;
    }
    if (command === "resolve") {
      const classification = String(options.classification ?? "");
      const [system, version, code] = classification.split(":");
      if (!system || !version || !code) {
        throw new Error("Use --classification <system>:<version>:<code>, for example cpc:3.0:01111");
      }
      writeOutput(resolveClassification({ root, system, version, code }), format, JSON.stringify);
      return;
    }
    if (command === "show") {
      requireOption(options, "pcr");
      process.stdout.write(readPcrMarkdown({ root, pcrId: String(options.pcr), language: String(options.lang ?? "en-US") }));
      return;
    }
    if (command === "guidance") {
      requireOption(options, "pcr");
      writeOutput(buildGuidance({ root, pcrId: String(options.pcr) }), format, JSON.stringify);
      return;
    }
    if (command === "validate-model") {
      requireOption(options, "pcr");
      requireOption(options, "input");
      const modelText = readFileSync(path.resolve(String(options.input)), "utf8");
      writeOutput(
        validateModelAgainstGuidance({ root, pcrId: String(options.pcr), model: modelText }),
        format,
        JSON.stringify,
      );
      return;
    }
    if (command === "feedback" && positional[0] === "draft") {
      requireOption(options, "type");
      const draft = createFeedbackDraft({
        root,
        pcrId: options.pcr ? String(options.pcr) : "",
        type: String(options.type),
        affectedSection: String(options["affected-section"] ?? ""),
        processId: String(options["process-id"] ?? ""),
        flowRole: String(options["flow-role"] ?? ""),
        summary: String(options.summary ?? ""),
        evidence: String(options.evidence ?? ""),
        proposedChange: String(options["proposed-change"] ?? ""),
      });
      if (format === "json") {
        process.stdout.write(`${JSON.stringify(draft, null, 2)}\n`);
        return;
      }
      process.stdout.write(`# ${draft.title}\n\n${draft.body}`);
      return;
    }

    process.stdout.write(helpText());
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

function parseArgs(argv) {
  const options = {};
  const positional = [];
  let command = "";

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) {
        options[key] = true;
        continue;
      }
      options[key] = next;
      index += 1;
      continue;
    }
    if (!command) {
      command = token;
      continue;
    }
    positional.push(token);
  }

  return { command, positional, options };
}

function writeOutput(value, format, tableFormatter) {
  if (format === "json") {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
    return;
  }
  if (format === "markdown") {
    process.stdout.write(`${tableFormatter(value)}\n`);
    return;
  }
  process.stdout.write(`${tableFormatter(value)}\n`);
}

function filterPcrs(pcrs, options) {
  let result = pcrs;
  if (options.status) {
    result = result.filter((entry) => entry.status === String(options.status));
  }
  if (options["content-maturity"]) {
    result = result.filter((entry) => entry.content_maturity === String(options["content-maturity"]));
  }
  if (options.limit) {
    result = result.slice(0, Number(options.limit));
  }
  return result;
}

function formatListTable(pcrs) {
  const lines = ["PCR id | Status | Title", "--- | --- | ---"];
  for (const pcr of pcrs) {
    lines.push(`${pcr.id} | ${pcr.status} | ${pcr.title["en-US"] ?? ""}`);
  }
  return lines.join("\n");
}

function formatTreeMarkdown(tree) {
  const lines = [];
  renderTreeNode(tree, lines, 0);
  return lines.join("\n");
}

function renderTreeNode(node, lines, depth) {
  for (const [segment, value] of Object.entries(node).sort(([left], [right]) => left.localeCompare(right))) {
    lines.push(`${"  ".repeat(depth)}- ${segment}`);
    for (const pcr of value.pcrs ?? []) {
      lines.push(`${"  ".repeat(depth + 1)}- ${pcr.id}`);
    }
    renderTreeNode(value.children ?? {}, lines, depth + 1);
  }
}

function requireOption(options, key) {
  if (!options[key]) {
    throw new Error(`Missing required option --${key}`);
  }
}

function helpText() {
  return `tiangong-pcr

Commands:
  list [--status <status>] [--content-maturity <state>] [--limit <n>] [--format json|markdown|table]
  tree [--depth <n>] [--format json|markdown]
  resolve --classification <system>:<version>:<code> [--format json]
  show --pcr <pcr-id> [--lang en-US|zh-CN]
  guidance --pcr <pcr-id> [--format json]
  validate-model --pcr <pcr-id> --input <file> [--format json]
  feedback draft --pcr <pcr-id> --type <type> [--summary <text>]
`;
}

main();
