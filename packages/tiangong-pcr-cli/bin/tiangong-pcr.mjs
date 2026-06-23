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

    if (options.help || command === "help" || !command) {
      process.stdout.write(helpText(command, positional));
      return;
    }
    if (command === "list") {
      writeOutput(paginateList(filterPcrs(listPcrs({ root }), options), options), format, formatListTable);
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
  return result;
}

function paginateList(pcrs, options) {
  const pageSize = positiveInteger(options["page-size"] ?? options.limit, 10);
  const page = positiveInteger(options.page, 1);
  const totalCount = pcrs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const boundedPage = Math.min(page, totalPages);
  const startIndex = (boundedPage - 1) * pageSize;
  const items = pcrs.slice(startIndex, startIndex + pageSize);
  const nextPage = boundedPage < totalPages ? boundedPage + 1 : null;
  const previousPage = boundedPage > 1 ? boundedPage - 1 : null;

  return {
    page: boundedPage,
    page_size: pageSize,
    total_count: totalCount,
    total_pages: totalPages,
    items,
    previous_command: previousPage ? buildListCommand({ ...options, page: previousPage }) : null,
    next_command: nextPage ? buildListCommand({ ...options, page: nextPage }) : null,
    next_steps: [
      "If you have a classification code, prefer resolve --classification <system>:<version>:<code>.",
      "If the correct PCR is unclear, inspect tree --depth 3 and then open candidate guidance.",
      "After selecting a PCR, run guidance --pcr <pcr-id> --format json.",
    ],
  };
}

function formatListTable(page) {
  const lines = ["PCR id | Status | Title", "--- | --- | ---"];
  for (const pcr of page.items) {
    lines.push(`${pcr.id} | ${pcr.status} | ${pcr.title["en-US"] ?? ""}`);
  }
  const start = page.total_count === 0 ? 0 : (page.page - 1) * page.page_size + 1;
  const end = Math.min(page.page * page.page_size, page.total_count);
  lines.push("");
  lines.push(`Showing ${start}-${end} of ${page.total_count} PCR records. Page ${page.page} of ${page.total_pages}.`);
  if (page.previous_command) {
    lines.push(`Previous page: ${page.previous_command}`);
  }
  if (page.next_command) {
    lines.push(`Next page: ${page.next_command}`);
  }
  lines.push("Next step: use `resolve` when you have a classification code, otherwise open candidate PCRs with `guidance --pcr <pcr-id> --format json`.");
  return lines.join("\n");
}

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function buildListCommand(options) {
  const parts = ["tiangong-pcr", "list"];
  if (options.status) {
    parts.push("--status", shellToken(String(options.status)));
  }
  if (options["content-maturity"]) {
    parts.push("--content-maturity", shellToken(String(options["content-maturity"])));
  }
  if (options["page-size"]) {
    parts.push("--page-size", shellToken(String(options["page-size"])));
  } else if (options.limit) {
    parts.push("--page-size", shellToken(String(options.limit)));
  }
  if (options.page) {
    parts.push("--page", shellToken(String(options.page)));
  }
  return parts.join(" ");
}

function shellToken(value) {
  return /^[A-Za-z0-9._:-]+$/u.test(value) ? value : JSON.stringify(value);
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

function helpText(command = "", positional = []) {
  if (command === "list") {
    return `Usage: tiangong-pcr list [options]

Browse PCR records explicitly. This is catalog browsing, not fuzzy search.

Options:
  --status <status>                 Filter by manifest status, for example candidate or scaffold.
  --content-maturity <state>        Filter by content maturity.
  --page <n>                        Page number. Defaults to 1.
  --page-size <n>                   Records per page. Defaults to 10 records per page.
  --format json|markdown|table      Output format. Defaults to table.
  --root <path>                     PCR repository root.

JSON output:
  {
    "page": 1,
    "page_size": 10,
    "total_count": 2877,
    "total_pages": 288,
    "items": [],
    "previous_command": null,
    "next_command": "tiangong-pcr list --page 2",
    "next_steps": []
  }

Agent next step:
  Follow next_command for more pages. After selecting a candidate PCR, run:
  tiangong-pcr guidance --pcr <pcr-id> --format json
`;
  }
  if (command === "tree") {
    return `Usage: tiangong-pcr tree [options]

Show the PCR directory hierarchy so an Agent can inspect available categories before selecting a PCR.

Options:
  --depth <n>                       Limit hierarchy depth.
  --format json|markdown            Output format. Defaults to table-style markdown.
  --root <path>                     PCR repository root.

Agent next step:
  Use tree to narrow the category area, then use list or guidance for concrete PCR records.
`;
  }
  if (command === "resolve") {
    return `Usage: tiangong-pcr resolve --classification <system>:<version>:<code> [options]

Resolve an external classification code through deterministic classification mapping files.
This command does not perform fuzzy search.

Options:
  --classification <value>          Example: cpc:3.0:01111.
  --format json                     Output format. JSON is recommended for Agents.
  --root <path>                     PCR repository root.

Example:
  tiangong-pcr resolve --classification cpc:3.0:01111 --format json

Agent next step:
  Use the returned mapping.pcr_id with guidance --pcr <pcr-id> --format json.
`;
  }
  if (command === "show") {
    return `Usage: tiangong-pcr show --pcr <pcr-id> [options]

Print the human-readable PCR Markdown.

Options:
  --pcr <pcr-id>                    PCR id to display.
  --lang en-US|zh-CN                Markdown language. Defaults to en-US.
  --root <path>                     PCR repository root.

Agent next step:
  Use show for human review. Use guidance for machine-readable model construction rules.
`;
  }
  if (command === "guidance") {
    return `Usage: tiangong-pcr guidance --pcr <pcr-id> [options]

Print Agent-facing structured PCR guidance from generated structured.yaml.

Options:
  --pcr <pcr-id>                    PCR id.
  --format json                     Output format. JSON is recommended for Agents.
  --root <path>                     PCR repository root.

JSON output includes:
  pcr, reference_flow, measurement_rules, process_map, process_inventory, data_sources, validation_notes.

Agent next step:
  Build the process or lifecyclemodel from the guidance, then run validate-model.
`;
  }
  if (command === "validate-model") {
    return `Usage: tiangong-pcr validate-model --pcr <pcr-id> --input <file> [options]

Check a process or lifecyclemodel draft against selected PCR guidance.

Options:
  --pcr <pcr-id>                    PCR id.
  --input <file>                    Model draft file.
  --format json                     Output format. JSON is recommended for Agents.
  --root <path>                     PCR repository root.

Agent next step:
  Address findings in the model. If the PCR guidance is missing or unclear, create feedback.
`;
  }
  if (command === "feedback" && positional[0] === "draft") {
    return `Usage: tiangong-pcr feedback draft --type <feedback-type> [options]

Create issue-ready Markdown for PCR maintainer feedback. Feedback is candidate evidence, not accepted PCR truth.

Options:
  --pcr <pcr-id>                    Affected PCR id when available.
  --type <feedback-type>            Feedback type.
  --affected-section <section>      Affected PCR section.
  --process-id <process_id>         Affected process_id.
  --flow-role <role>                Affected flow role.
  --summary <text>                  Short finding summary.
  --evidence <text>                 Evidence URLs, files, or notes.
  --proposed-change <text>          Suggested change.
  --format json|markdown            Output format. Defaults to markdown.

Feedback types:
  missing_pcr
  classification_mapping_gap
  unclear_reference_flow
  wrong_or_missing_uuid
  process_boundary_issue
  inventory_flow_gap
  range_evidence_update
  unit_or_flow_property_issue
  validation_rule_issue
  translation_mismatch
  source_update

Agent next step:
  Open a GitHub issue with the generated body, or hand it to a maintainer for intake.
`;
  }

  return `tiangong-pcr

Usage:
  tiangong-pcr <command> [options]
  tiangong-pcr <command> --help

Commands:
  list [--status <status>] [--content-maturity <state>] [--page <n>] [--page-size <n>] [--format json|markdown|table]
  tree [--depth <n>] [--format json|markdown]
  resolve --classification <system>:<version>:<code> [--format json]
  show --pcr <pcr-id> [--lang en-US|zh-CN]
  guidance --pcr <pcr-id> [--format json]
  validate-model --pcr <pcr-id> --input <file> [--format json]
  feedback draft --pcr <pcr-id> --type <type> [--summary <text>]

Agent workflow:
  1. If a classification code is available, run resolve --classification <system>:<version>:<code> --format json.
  2. If no code is available, use tree/list to browse explicit PCR hierarchy. list defaults to 10 records per page.
  3. After choosing a PCR, run guidance --pcr <pcr-id> --format json.
  4. Build the process or lifecyclemodel, then run validate-model.
  5. If PCR guidance is missing or ambiguous, run feedback draft instead of inventing local rules.
`;
}

main();
