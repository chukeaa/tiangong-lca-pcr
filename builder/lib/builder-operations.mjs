import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MODULE_EN_FILE, MODULE_ZH_FILE, PCR_EN_FILE, PCR_ZH_FILE, pcrManifest, pcrMarkdown, structuredYaml } from "./scaffold-templates.mjs";
import { REQUIRED_DIRS } from "./builder-constants.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(__dirname, "../..");

function rootFromOptions(options) {
  return path.resolve(String(options.root ?? defaultRoot));
}

function ensureDir(root, relativePath) {
  mkdirSync(path.join(root, relativePath), { recursive: true });
}

function writeIfMissing(root, relativePath, content) {
  const target = path.join(root, relativePath);
  if (existsSync(target)) {
    return false;
  }
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
  return true;
}

function normalizeSlug(value) {
  return String(value ?? "")
    .trim()
    .replace(/^\/+|\/+$/gu, "")
    .replaceAll("\\", "/")
    .replace(/\/{2,}/gu, "/");
}

export function init(options) {
  const root = rootFromOptions(options);
  for (const dir of REQUIRED_DIRS) {
    ensureDir(root, dir);
  }

  writeIfMissing(
    root,
    "library/pcrs/README.md",
    `# PCR Records

Each canonical PCR is represented as a directory:

\`\`\`text
library/pcrs/<domain>/<subdomain>/<pcr-slug>/
  manifest.yaml
  ${PCR_EN_FILE}
  ${PCR_ZH_FILE}
  structured.yaml
\`\`\`

The PCR directory is the stable identity boundary. Classification systems map to PCR ids through \`classifications/mappings/\`.
`,
  );

  writeIfMissing(
    root,
    "library/modules/README.md",
    `# PCR Method Modules

Reusable modules use the same directory pattern when localized:

\`\`\`text
library/modules/<group>/<module-slug>/
  manifest.yaml
  ${MODULE_EN_FILE}
  ${MODULE_ZH_FILE}
  structured.yaml
\`\`\`
`,
  );

  writeIfMissing(
    root,
    "builder/README.md",
    `# PCR Library Builder

Human and agent documentation lives under \`builder/docs/\`. Machine-facing builder assets such as CLI, scripts, schemas, templates, and vocabularies stay directly under \`builder/\`.

## Builder CLI

\`\`\`bash
node builder/cli/index.mjs init
node builder/cli/index.mjs lint
\`\`\`

\`init\` creates the expected scaffold directories and optional PCR scaffold records. \`lint\` validates the repository structure.
`,
  );

  writeIfMissing(
    root,
    "builder/docs/index.md",
    `# Builder Documentation Index

Use this index to route to the smallest relevant builder documentation for the current task.

- \`workflows/\`: PCR create, update, translate, review, and publish workflows.
- \`contracts/\`: Markdown, manifest, structured projection, evidence, and UUID contracts.
- \`methods/\`: reusable modelling method notes.
- \`tools/\`: authoring-time tool and source guidance.
- \`prompts/\`: thin agent prompt entrypoints.
`,
  );

  if (options["sample-pcr"]) {
    const sampleSlug = normalizeSlug(options["sample-pcr"]);
    const sampleRoot = path.join("library/pcrs", sampleSlug);
    writeIfMissing(root, path.join(sampleRoot, "manifest.yaml"), pcrManifest(options));
    writeIfMissing(root, path.join(sampleRoot, PCR_EN_FILE), pcrMarkdown(options, "en-US"));
    writeIfMissing(root, path.join(sampleRoot, PCR_ZH_FILE), pcrMarkdown(options, "zh-CN"));
    writeIfMissing(root, path.join(sampleRoot, "structured.yaml"), structuredYaml());
  }

  return [`Initialized PCR library scaffold at ${root}`];
}
