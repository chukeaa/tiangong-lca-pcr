#!/usr/bin/env node
import { init } from "../lib/builder-operations.mjs";
import { scaffoldCpc } from "../lib/cpc-scaffold.mjs";
import { lint } from "../lib/lint-rules.mjs";
import { bump, publish, syncStructured } from "../lib/manifest-lifecycle.mjs";

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

function printHelp() {
  return `PCR Library Builder CLI

Usage:
  node builder/cli/index.mjs init [--root <path>] [--sample-pcr <domain/path/slug>]
  node builder/cli/index.mjs lint [--root <path>]
  node builder/cli/index.mjs scaffold-cpc --source <csv> [--classification-version 3.0]
  node builder/cli/index.mjs sync-structured --pcr <library/pcrs/...> [--root <path>]
  node builder/cli/index.mjs bump --pcr <library/pcrs/...> [--level patch|minor|major] [--root <path>]
  node builder/cli/index.mjs publish --pcr <library/pcrs/...> [--version <semver>] [--root <path>]
`;
}

function runCommand(command, options) {
  if (!command || command === "help" || command === "--help") {
    return { messages: [printHelp()], exitCode: 0 };
  }
  if (command === "init") {
    return { messages: init(options), exitCode: 0 };
  }
  if (command === "lint") {
    return { messages: lint(options), exitCode: 0 };
  }
  if (command === "scaffold-cpc") {
    return { messages: scaffoldCpc(options), exitCode: 0 };
  }
  if (command === "sync-structured") {
    return { messages: syncStructured(options), exitCode: 0 };
  }
  if (command === "bump") {
    return { messages: bump(options), exitCode: 0 };
  }
  if (command === "publish") {
    return { messages: publish(options), exitCode: 0 };
  }
  throw new Error(`Unknown command: ${command}`);
}

function main(argv) {
  try {
    const { command, options } = parseArgs(argv);
    const { messages, exitCode } = runCommand(command, options);
    if (messages.length > 0) {
      process.stdout.write(`${messages.join("\n")}\n`);
    }
    process.exitCode = exitCode;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

main(process.argv.slice(2));
