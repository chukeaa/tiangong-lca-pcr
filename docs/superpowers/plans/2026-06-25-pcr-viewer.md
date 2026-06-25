# PCR Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a read-only static frontend for browsing PCR records, bilingual Markdown, structured guidance, and source records from the local PCR repository.

**Architecture:** Add `packages/pcr-viewer/` as a small static viewer package. A Node build script reads existing PCR truth through `packages/pcr-core`, writes `dist/data/pcr-viewer-data.json`, and copies static browser assets into `dist/`; a tiny Node server serves the built folder locally.

**Tech Stack:** Node ESM, `node:test`, existing `packages/pcr-core` APIs, plain HTML/CSS/JavaScript, no React/Vite/runtime API server.

---

## File Structure

- Create `packages/pcr-viewer/viewer-build.test.mjs`
  - Tests viewer data generation, static asset copy, and front-end helper behavior.
- Create `packages/pcr-viewer/scripts/build-viewer-data.mjs`
  - Exports `buildViewerData()` and `buildViewer()`.
  - Reuses `listPcrs`, `readPcrMarkdown`, and `buildGuidance` from `packages/pcr-core`.
  - Copies static assets and writes generated JSON into an output directory.
- Create `packages/pcr-viewer/scripts/serve-viewer.mjs`
  - Serves `packages/pcr-viewer/dist/` over HTTP for local browser use.
- Create `packages/pcr-viewer/static/index.html`
  - Browser shell for the viewer; first screen is the working application.
- Create `packages/pcr-viewer/static/styles.css`
  - Dense, utilitarian PCR-review UI styling.
- Create `packages/pcr-viewer/static/viewer-core.js`
  - Pure browser-safe helpers for filtering PCRs, escaping HTML, rendering simple Markdown, and summarizing guidance.
- Create `packages/pcr-viewer/static/app.js`
  - Browser orchestration: fetch data, manage selected PCR/language/tab/filter state, render the UI.
- Modify `package.json`
  - Add `viewer:build`, `viewer:serve`.
  - Include `packages/pcr-viewer/*.test.mjs` in `npm test`.
- Modify `README.md`
  - Document local viewer commands.
- Modify `docs/architecture.md`
  - Add the viewer as a read-only public consumption surface.

## Task 1: Viewer Data Build Test

**Files:**
- Create: `packages/pcr-viewer/viewer-build.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `packages/pcr-viewer/viewer-build.test.mjs` with:

```js
import assert from "node:assert/strict";
import { existsSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { buildViewer } from "./scripts/build-viewer-data.mjs";
import { filterPcrs, renderMarkdown, summarizeGuidance } from "./static/viewer-core.js";

const repoRoot = path.resolve(".");
const abalonePcrId =
  "pcr.agriculture-forestry-and-fishery-products.fish-crustaceans-molluscs-and-other-aquatic-invertebrates-products.farmed-abalone-live-fresh-or-chilled";

test("buildViewer writes viewer data and static assets", () => {
  const outDir = mkdtempSync(path.join(tmpdir(), "tiangong-pcr-viewer-"));
  try {
    const data = buildViewer({ root: repoRoot, outDir });
    const dataPath = path.join(outDir, "data", "pcr-viewer-data.json");

    assert.equal(data.schema_version, 1);
    assert.equal(data.viewer_kind, "tiangong-pcr-static-viewer-data");
    assert.ok(data.pcr_count > 0);
    assert.ok(existsSync(dataPath));
    assert.ok(existsSync(path.join(outDir, "index.html")));
    assert.ok(existsSync(path.join(outDir, "styles.css")));
    assert.ok(existsSync(path.join(outDir, "app.js")));
    assert.ok(existsSync(path.join(outDir, "viewer-core.js")));

    const parsed = JSON.parse(readFileSync(dataPath, "utf8"));
    const abalone = parsed.pcrs.find((entry) => entry.id === abalonePcrId);

    assert.ok(abalone);
    assert.equal(abalone.title["en-US"], "Farmed abalone, live, fresh or chilled");
    assert.equal(abalone.markdown["en-US"].includes("# Farmed abalone"), true);
    assert.equal(abalone.markdown["zh-CN"].includes("# 养殖鲍鱼"), true);
    assert.equal(abalone.guidance.reference_flow.reference_unit, "kg");
    assert.ok(abalone.guidance.data_sources.length > 0);
    assert.match(abalone.search_text, /abalone/i);
    assert.match(abalone.search_text, /04412/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("viewer-core filters PCRs and renders safe Markdown", () => {
  const records = [
    {
      id: "pcr.example.wheat",
      path: "library/pcrs/example/wheat",
      status: "candidate",
      content_maturity: "authored_methodology",
      title: { "en-US": "Wheat seed", "zh-CN": "小麦种子" },
      search_text: "pcr.example.wheat wheat seed cpc 01111",
    },
    {
      id: "pcr.example.abalone",
      path: "library/pcrs/example/abalone",
      status: "scaffold",
      content_maturity: "empty_scaffold",
      title: { "en-US": "Farmed abalone" },
      search_text: "pcr.example.abalone farmed abalone cpc 04412",
    },
  ];

  assert.deepEqual(filterPcrs(records, { query: "04412", status: "", maturity: "" }).map((pcr) => pcr.id), [
    "pcr.example.abalone",
  ]);
  assert.deepEqual(filterPcrs(records, { query: "", status: "candidate", maturity: "" }).map((pcr) => pcr.id), [
    "pcr.example.wheat",
  ]);
  assert.deepEqual(
    filterPcrs(records, { query: "seed", status: "candidate", maturity: "authored_methodology" }).map((pcr) => pcr.id),
    ["pcr.example.wheat"],
  );

  const html = renderMarkdown("# Title\n\n- <unsafe>\n\n| Field | Value |\n| --- | --- |\n| A | B |");
  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /&lt;unsafe&gt;/);
  assert.match(html, /<table>/);
});

test("viewer-core summarizes guidance counts", () => {
  const summary = summarizeGuidance({
    reference_flow: { reference_unit: "kg", required_qualifiers: ["species", "gate"] },
    process_map: [{ id: "growout" }],
    process_inventory: [{ id: "growout" }, { id: "packout" }],
    production_guidance: {
      collection_protocols: [{ protocol_id: "cp_feed" }],
      calculation_rules: [{ id: "normalize" }],
      data_quality_requirements: [{ id: "scope" }],
    },
    data_sources: [{ id: "source-1" }, { id: "source-2" }],
  });

  assert.deepEqual(summary, {
    reference_unit: "kg",
    required_qualifier_count: 2,
    process_count: 1,
    inventory_process_count: 2,
    collection_protocol_count: 1,
    calculation_rule_count: 1,
    data_quality_requirement_count: 1,
    data_source_count: 2,
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test packages/pcr-viewer/*.test.mjs
```

Expected: fail with `ERR_MODULE_NOT_FOUND` for `packages/pcr-viewer/scripts/build-viewer-data.mjs` or `packages/pcr-viewer/static/viewer-core.js`.

## Task 2: Viewer Data Builder

**Files:**
- Create: `packages/pcr-viewer/scripts/build-viewer-data.mjs`
- Create: `packages/pcr-viewer/static/index.html`
- Create: `packages/pcr-viewer/static/styles.css`
- Create: `packages/pcr-viewer/static/app.js`
- Create: `packages/pcr-viewer/static/viewer-core.js`

- [ ] **Step 1: Add the minimal static asset files**

Create `packages/pcr-viewer/static/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>TianGong PCR Viewer</title>
    <link rel="stylesheet" href="./styles.css">
  </head>
  <body>
    <main id="app" class="app-shell" aria-live="polite"></main>
    <script type="module" src="./app.js"></script>
  </body>
</html>
```

Create `packages/pcr-viewer/static/styles.css`:

```css
:root {
  color-scheme: light;
  --ink: #18211d;
  --muted: #65746d;
  --line: #d7dfda;
  --paper: #f7faf7;
  --panel: #ffffff;
  --accent: #0f6f5c;
  --accent-ink: #ffffff;
  --warn: #8a5a00;
  --code: #13241f;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: var(--ink);
  background: var(--paper);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.app-shell {
  min-height: 100vh;
}
```

Create `packages/pcr-viewer/static/app.js`:

```js
import { filterPcrs, renderMarkdown, summarizeGuidance } from "./viewer-core.js";

void filterPcrs;
void renderMarkdown;
void summarizeGuidance;

document.querySelector("#app").innerHTML = "<p>Loading PCR viewer...</p>";
```

- [ ] **Step 2: Add the front-end pure helpers**

Create `packages/pcr-viewer/static/viewer-core.js`:

```js
export function filterPcrs(pcrs, { query = "", status = "", maturity = "" } = {}) {
  const normalizedQuery = normalize(query);
  return pcrs.filter((pcr) => {
    if (status && pcr.status !== status) {
      return false;
    }
    if (maturity && pcr.content_maturity !== maturity) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return normalize(pcr.search_text).includes(normalizedQuery);
  });
}

export function summarizeGuidance(guidance = {}) {
  return {
    reference_unit: guidance.reference_flow?.reference_unit ?? "",
    required_qualifier_count: guidance.reference_flow?.required_qualifiers?.length ?? 0,
    process_count: guidance.process_map?.length ?? 0,
    inventory_process_count: guidance.process_inventory?.length ?? 0,
    collection_protocol_count: guidance.production_guidance?.collection_protocols?.length ?? 0,
    calculation_rule_count: guidance.production_guidance?.calculation_rules?.length ?? 0,
    data_quality_requirement_count: guidance.production_guidance?.data_quality_requirements?.length ?? 0,
    data_source_count: guidance.data_sources?.length ?? 0,
  };
}

export function renderMarkdown(markdown = "") {
  const lines = markdown.split(/\r?\n/u);
  const html = [];
  let paragraph = [];
  let listItems = [];
  let codeLines = [];
  let tableRows = [];
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      html.push(`<p>${paragraph.map(escapeHtml).join(" ")}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (listItems.length > 0) {
      html.push(`<ul>${listItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
      listItems = [];
    }
  };
  const flushCode = () => {
    if (codeLines.length > 0) {
      html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      codeLines = [];
    }
  };
  const flushTable = () => {
    if (tableRows.length > 0) {
      html.push(renderTable(tableRows));
      tableRows = [];
    }
  };
  const flushBlocks = () => {
    flushParagraph();
    flushList();
    flushTable();
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        inCode = false;
        flushCode();
      } else {
        flushBlocks();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    if (!line.trim()) {
      flushBlocks();
      continue;
    }
    if (/^\|.*\|$/u.test(line.trim())) {
      flushParagraph();
      flushList();
      tableRows.push(line);
      continue;
    }
    flushTable();
    const heading = /^(#{1,4})\s+(.+)$/u.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${escapeHtml(heading[2])}</h${level}>`);
      continue;
    }
    const list = /^-\s+(.+)$/u.exec(line);
    if (list) {
      flushParagraph();
      listItems.push(list[1]);
      continue;
    }
    paragraph.push(line.trim());
  }

  if (inCode) {
    flushCode();
  }
  flushBlocks();
  return html.join("\n");
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderTable(rows) {
  const parsed = rows
    .filter((row) => !/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/u.test(row))
    .map((row) => row.split("|").slice(1, -1).map((cell) => cell.trim()));
  if (parsed.length === 0) {
    return "";
  }
  const [header, ...body] = parsed;
  return `<table><thead><tr>${header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead><tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function normalize(value = "") {
  return String(value).toLowerCase().trim();
}
```

- [ ] **Step 3: Add the viewer data build script**

Create `packages/pcr-viewer/scripts/build-viewer-data.mjs`:

```js
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { buildGuidance, listPcrs, readPcrMarkdown } from "../../pcr-core/src/index.mjs";

const repoRoot = path.resolve(new URL("../../..", import.meta.url).pathname);
const packageRoot = path.resolve(new URL("..", import.meta.url).pathname);
const defaultOutDir = path.join(packageRoot, "dist");
const staticDir = path.join(packageRoot, "static");
const languages = ["en-US", "zh-CN"];

export function buildViewer({ root = repoRoot, outDir = defaultOutDir } = {}) {
  const data = buildViewerData({ root });

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(staticDir, outDir, { recursive: true });

  const dataDir = path.join(outDir, "data");
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(path.join(dataDir, "pcr-viewer-data.json"), `${JSON.stringify(data, null, 2)}\n`);

  return data;
}

export function buildViewerData({ root = repoRoot } = {}) {
  const pcrs = listPcrs({ root }).map((pcr) => {
    const markdown = Object.fromEntries(
      languages.map((language) => [language, readOptionalMarkdown({ root, pcrId: pcr.id, language })]),
    );
    const guidance = readOptionalGuidance({ root, pcrId: pcr.id });
    const classificationText = (pcr.classification_refs ?? [])
      .map((ref) => `${ref.system ?? ""} ${ref.version ?? ""} ${ref.code ?? ""} ${ref.title ?? ""}`)
      .join(" ");

    return {
      ...pcr,
      markdown,
      guidance,
      search_text: [
        pcr.id,
        pcr.path,
        pcr.title?.["en-US"],
        pcr.title?.["zh-CN"],
        pcr.status,
        pcr.content_maturity,
        classificationText,
      ]
        .filter(Boolean)
        .join(" "),
    };
  });

  return {
    schema_version: 1,
    viewer_kind: "tiangong-pcr-static-viewer-data",
    generated_at_utc: new Date().toISOString(),
    pcr_count: pcrs.length,
    pcrs,
  };
}

function readOptionalMarkdown({ root, pcrId, language }) {
  try {
    return readPcrMarkdown({ root, pcrId, language });
  } catch {
    return "";
  }
}

function readOptionalGuidance({ root, pcrId }) {
  try {
    return buildGuidance({ root, pcrId });
  } catch (error) {
    return { guidance_error: error.message };
  }
}

function cliOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--root") {
      options.root = path.resolve(argv[index + 1]);
      index += 1;
    } else if (token === "--out-dir") {
      options.outDir = path.resolve(argv[index + 1]);
      index += 1;
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }
  return options;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const data = buildViewer(cliOptions(process.argv.slice(2)));
  console.log(`Built PCR viewer data for ${data.pcr_count} PCR records.`);
}
```

- [ ] **Step 4: Run the targeted test**

Run:

```bash
node --test packages/pcr-viewer/*.test.mjs
```

Expected: pass all viewer tests.

## Task 3: Viewer UI

**Files:**
- Modify: `packages/pcr-viewer/static/index.html`
- Modify: `packages/pcr-viewer/static/styles.css`
- Modify: `packages/pcr-viewer/static/app.js`

- [ ] **Step 1: Expand the browser shell**

Replace `packages/pcr-viewer/static/index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>TianGong PCR Viewer</title>
    <link rel="stylesheet" href="./styles.css">
  </head>
  <body>
    <main id="app" class="app-shell">
      <section class="loading-state">
        <p>Loading PCR viewer...</p>
      </section>
    </main>
    <script type="module" src="./app.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Implement the UI orchestration**

Replace `packages/pcr-viewer/static/app.js` with:

```js
import { escapeHtml, filterPcrs, renderMarkdown, summarizeGuidance } from "./viewer-core.js";

const state = {
  data: null,
  selectedId: "",
  query: "",
  status: "",
  maturity: "",
  language: "en-US",
  tab: "markdown",
};

const app = document.querySelector("#app");

async function boot() {
  try {
    const response = await fetch("./data/pcr-viewer-data.json");
    if (!response.ok) {
      throw new Error(`Unable to load viewer data: HTTP ${response.status}`);
    }
    state.data = await response.json();
    state.selectedId = state.data.pcrs[0]?.id ?? "";
    render();
  } catch (error) {
    app.innerHTML = `<section class="empty-state"><h1>PCR viewer data is unavailable</h1><p>${escapeHtml(error.message)}</p><p>Run <code>npm run viewer:build</code> and open the viewer through <code>npm run viewer:serve</code>.</p></section>`;
  }
}

function render() {
  const pcrs = state.data?.pcrs ?? [];
  const filtered = filterPcrs(pcrs, state);
  if (!filtered.some((pcr) => pcr.id === state.selectedId)) {
    state.selectedId = filtered[0]?.id ?? "";
  }
  const selected = pcrs.find((pcr) => pcr.id === state.selectedId);

  app.innerHTML = `
    <aside class="sidebar">
      <header class="brand">
        <div>
          <p class="eyebrow">TianGong LCA</p>
          <h1>PCR Viewer</h1>
        </div>
        <span class="count">${filtered.length}/${pcrs.length}</span>
      </header>
      ${renderFilters(pcrs)}
      <nav class="pcr-list" aria-label="PCR records">
        ${filtered.map((pcr) => renderPcrListItem(pcr, pcr.id === state.selectedId)).join("") || "<p class=\"empty-copy\">No PCR records match the current filters.</p>"}
      </nav>
    </aside>
    <section class="viewer">
      ${selected ? renderSelectedPcr(selected) : "<div class=\"empty-state\"><h2>No PCR selected</h2><p>Adjust filters to select a PCR record.</p></div>"}
    </section>
  `;
  bindEvents();
}

function renderFilters(pcrs) {
  const statuses = unique(pcrs.map((pcr) => pcr.status).filter(Boolean));
  const maturities = unique(pcrs.map((pcr) => pcr.content_maturity).filter(Boolean));
  return `
    <div class="filters">
      <label>
        <span>Search</span>
        <input id="query" value="${escapeHtml(state.query)}" placeholder="PCR id, title, CPC code">
      </label>
      <label>
        <span>Status</span>
        <select id="status">
          <option value="">All statuses</option>
          ${statuses.map((status) => `<option value="${escapeHtml(status)}"${status === state.status ? " selected" : ""}>${escapeHtml(status)}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Maturity</span>
        <select id="maturity">
          <option value="">All maturity states</option>
          ${maturities.map((maturity) => `<option value="${escapeHtml(maturity)}"${maturity === state.maturity ? " selected" : ""}>${escapeHtml(maturity)}</option>`).join("")}
        </select>
      </label>
    </div>
  `;
}

function renderPcrListItem(pcr, selected) {
  return `
    <button class="pcr-list-item${selected ? " selected" : ""}" data-pcr-id="${escapeHtml(pcr.id)}">
      <span class="pcr-title">${escapeHtml(pcr.title?.["en-US"] ?? pcr.id)}</span>
      <span class="pcr-meta">${escapeHtml(pcr.status)} · ${escapeHtml(pcr.content_maturity ?? "")}</span>
    </button>
  `;
}

function renderSelectedPcr(pcr) {
  return `
    <header class="viewer-header">
      <div>
        <p class="eyebrow">${escapeHtml(pcr.status)} · ${escapeHtml(pcr.version ?? "unversioned")}</p>
        <h2>${escapeHtml(pcr.title?.[state.language] || pcr.title?.["en-US"] || pcr.id)}</h2>
        <p class="identifier">${escapeHtml(pcr.id)}</p>
      </div>
      <div class="header-actions">
        <select id="language" aria-label="PCR language">
          <option value="en-US"${state.language === "en-US" ? " selected" : ""}>en-US</option>
          <option value="zh-CN"${state.language === "zh-CN" ? " selected" : ""}>zh-CN</option>
        </select>
      </div>
    </header>
    <section class="metadata-strip">
      <div><span>Path</span><strong>${escapeHtml(pcr.path)}</strong></div>
      <div><span>Content maturity</span><strong>${escapeHtml(pcr.content_maturity ?? "")}</strong></div>
      <div><span>Classification refs</span><strong>${escapeHtml(formatClassificationRefs(pcr.classification_refs))}</strong></div>
    </section>
    <div class="tabs" role="tablist">
      ${["markdown", "guidance", "sources"].map((tab) => `<button class="tab${state.tab === tab ? " active" : ""}" data-tab="${tab}">${tabLabel(tab)}</button>`).join("")}
    </div>
    <article class="content-panel">
      ${renderTabContent(pcr)}
    </article>
  `;
}

function renderTabContent(pcr) {
  if (state.tab === "guidance") {
    return renderGuidance(pcr.guidance);
  }
  if (state.tab === "sources") {
    return renderSources(pcr.guidance?.data_sources ?? []);
  }
  const markdown = pcr.markdown?.[state.language] ?? "";
  return markdown
    ? `<div class="markdown-body">${renderMarkdown(markdown)}</div>`
    : `<div class="empty-state"><h3>No ${escapeHtml(state.language)} Markdown</h3><p>This PCR does not have a readable Markdown file for the selected language.</p></div>`;
}

function renderGuidance(guidance = {}) {
  if (guidance.guidance_error) {
    return `<div class="empty-state"><h3>Guidance unavailable</h3><p>${escapeHtml(guidance.guidance_error)}</p></div>`;
  }
  const summary = summarizeGuidance(guidance);
  return `
    <div class="summary-grid">
      ${Object.entries(summary).map(([key, value]) => `<div><span>${escapeHtml(key.replaceAll("_", " "))}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
    </div>
    <details open>
      <summary>Structured guidance JSON</summary>
      <pre><code>${escapeHtml(JSON.stringify(guidance, null, 2))}</code></pre>
    </details>
  `;
}

function renderSources(sources) {
  if (sources.length === 0) {
    return "<div class=\"empty-state\"><h3>No sources listed</h3><p>This PCR guidance does not include data source records.</p></div>";
  }
  return `
    <div class="source-list">
      ${sources.map((source) => `
        <section class="source-item">
          <h3>${escapeHtml(source.id ?? "source")}</h3>
          <p><strong>${escapeHtml(source.type ?? "")}</strong></p>
          <p>${escapeHtml(source.used_for ?? "")}</p>
          <p class="source-ref">${escapeHtml(source.reference ?? "")}</p>
        </section>
      `).join("")}
    </div>
  `;
}

function bindEvents() {
  document.querySelector("#query")?.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });
  document.querySelector("#status")?.addEventListener("change", (event) => {
    state.status = event.target.value;
    render();
  });
  document.querySelector("#maturity")?.addEventListener("change", (event) => {
    state.maturity = event.target.value;
    render();
  });
  document.querySelector("#language")?.addEventListener("change", (event) => {
    state.language = event.target.value;
    render();
  });
  for (const button of document.querySelectorAll("[data-pcr-id]")) {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.pcrId;
      render();
    });
  }
  for (const tab of document.querySelectorAll("[data-tab]")) {
    tab.addEventListener("click", () => {
      state.tab = tab.dataset.tab;
      render();
    });
  }
}

function unique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function formatClassificationRefs(refs = []) {
  return refs.map((ref) => `${ref.system ?? ""} ${ref.version ?? ""} ${ref.code ?? ""}`.trim()).join("; ");
}

function tabLabel(tab) {
  return {
    markdown: "Markdown",
    guidance: "Guidance",
    sources: "Sources",
  }[tab];
}

await boot();
```

- [ ] **Step 3: Replace the stylesheet**

Replace `packages/pcr-viewer/static/styles.css` with the complete stylesheet:

```css
:root {
  color-scheme: light;
  --ink: #18211d;
  --muted: #65746d;
  --line: #d7dfda;
  --paper: #f7faf7;
  --panel: #ffffff;
  --panel-soft: #edf4ef;
  --accent: #0f6f5c;
  --accent-ink: #ffffff;
  --warn: #8a5a00;
  --code: #13241f;
  --shadow: 0 16px 40px rgba(24, 33, 29, 0.08);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: var(--ink);
  background:
    linear-gradient(90deg, rgba(15, 111, 92, 0.05) 1px, transparent 1px),
    linear-gradient(180deg, rgba(15, 111, 92, 0.04) 1px, transparent 1px),
    var(--paper);
  background-size: 28px 28px;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  display: grid;
  grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--line);
  background: rgba(247, 250, 247, 0.94);
  backdrop-filter: blur(12px);
}

.brand {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid var(--line);
}

.brand h1,
.viewer-header h2 {
  margin: 0;
  letter-spacing: 0;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.count {
  align-self: flex-start;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px 9px;
  color: var(--muted);
  background: var(--panel);
  font-size: 12px;
  font-weight: 700;
}

.filters {
  display: grid;
  gap: 12px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--line);
}

label span {
  display: block;
  margin-bottom: 5px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

input,
select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 9px 10px;
  color: var(--ink);
  background: var(--panel);
}

.pcr-list {
  flex: 1;
  overflow: auto;
  padding: 12px;
}

.pcr-list-item {
  width: 100%;
  display: grid;
  gap: 5px;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 11px 12px;
  color: var(--ink);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.pcr-list-item:hover,
.pcr-list-item.selected {
  border-color: var(--accent);
  background: var(--panel);
  box-shadow: 0 8px 20px rgba(15, 111, 92, 0.08);
}

.pcr-title {
  font-weight: 800;
}

.pcr-meta,
.identifier,
.empty-copy {
  color: var(--muted);
  font-size: 13px;
}

.viewer {
  min-width: 0;
  padding: 28px;
}

.viewer-header,
.metadata-strip,
.content-panel {
  max-width: 1100px;
  margin: 0 auto;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.metadata-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.metadata-strip div,
.summary-grid div {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 12px;
  background: var(--panel);
}

.metadata-strip span,
.summary-grid span {
  display: block;
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.metadata-strip strong {
  overflow-wrap: anywhere;
}

.tabs {
  max-width: 1100px;
  display: flex;
  gap: 8px;
  margin: 18px auto 0;
}

.tab {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--ink);
  background: var(--panel);
  cursor: pointer;
}

.tab.active {
  border-color: var(--accent);
  color: var(--accent-ink);
  background: var(--accent);
}

.content-panel {
  margin-top: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 24px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.markdown-body {
  line-height: 1.62;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  margin-top: 1.2em;
  letter-spacing: 0;
}

.markdown-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 14px;
}

.markdown-body th,
.markdown-body td {
  border: 1px solid var(--line);
  padding: 8px;
  vertical-align: top;
}

.markdown-body th {
  background: var(--panel-soft);
  text-align: left;
}

pre {
  overflow: auto;
  border-radius: 6px;
  padding: 14px;
  color: #dfeee8;
  background: var(--code);
}

code {
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  font-size: 13px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.source-list {
  display: grid;
  gap: 12px;
}

.source-item {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 14px;
  background: var(--panel-soft);
}

.source-item h3,
.source-item p {
  margin: 0 0 8px;
}

.source-ref {
  color: var(--muted);
  overflow-wrap: anywhere;
}

.empty-state,
.loading-state {
  max-width: 760px;
  margin: 20vh auto;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 24px;
  background: var(--panel);
}

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    height: auto;
  }

  .pcr-list {
    max-height: 320px;
  }

  .viewer {
    padding: 16px;
  }

  .viewer-header,
  .metadata-strip,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .viewer-header {
    display: grid;
  }
}
```

- [ ] **Step 4: Build viewer and inspect data**

Run:

```bash
node packages/pcr-viewer/scripts/build-viewer-data.mjs --out-dir .tmp/pcr-viewer-dist
```

Expected output: `Built PCR viewer data for <n> PCR records.`

Then run:

```bash
test -f .tmp/pcr-viewer-dist/index.html
test -f .tmp/pcr-viewer-dist/data/pcr-viewer-data.json
```

Expected: both commands exit 0.

- [ ] **Step 5: Run targeted tests again**

Run:

```bash
node --test packages/pcr-viewer/*.test.mjs
```

Expected: pass all viewer tests.

## Task 4: Root Scripts And Local Server

**Files:**
- Create: `packages/pcr-viewer/scripts/serve-viewer.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add failing CLI script test coverage**

Append this test to `packages/pcr-viewer/viewer-build.test.mjs`:

```js
import { execFileSync, spawn } from "node:child_process";

test("root viewer scripts can build and serve the static viewer", async () => {
  const outDir = mkdtempSync(path.join(tmpdir(), "tiangong-pcr-viewer-cli-"));
  try {
    const buildOutput = execFileSync(process.execPath, [
      "packages/pcr-viewer/scripts/build-viewer-data.mjs",
      "--root",
      repoRoot,
      "--out-dir",
      outDir,
    ], {
      cwd: repoRoot,
      encoding: "utf8",
    });

    assert.match(buildOutput, /Built PCR viewer data for \d+ PCR records/);

    const server = spawn(process.execPath, [
      "packages/pcr-viewer/scripts/serve-viewer.mjs",
      "--root",
      outDir,
      "--port",
      "0",
    ], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });

    try {
      const ready = await readUntil(server.stdout, /PCR viewer available at http:\/\/127\.0\.0\.1:\d+/u);
      assert.match(ready, /PCR viewer available/);
    } finally {
      server.kill("SIGTERM");
    }
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

function readUntil(stream, pattern) {
  return new Promise((resolve, reject) => {
    let text = "";
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${pattern}`)), 3000);
    stream.on("data", (chunk) => {
      text += chunk.toString("utf8");
      if (pattern.test(text)) {
        clearTimeout(timer);
        resolve(text);
      }
    });
    stream.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test packages/pcr-viewer/*.test.mjs
```

Expected: fail with `ERR_MODULE_NOT_FOUND` for `packages/pcr-viewer/scripts/serve-viewer.mjs`.

- [ ] **Step 3: Implement the local static server**

Create `packages/pcr-viewer/scripts/serve-viewer.mjs`:

```js
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";

const packageRoot = path.resolve(new URL("..", import.meta.url).pathname);
const defaultRoot = path.join(packageRoot, "dist");

function cliOptions(argv) {
  const options = { root: defaultRoot, port: 4173, host: "127.0.0.1" };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--root") {
      options.root = path.resolve(argv[index + 1]);
      index += 1;
    } else if (token === "--port") {
      options.port = Number(argv[index + 1]);
      index += 1;
    } else if (token === "--host") {
      options.host = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }
  return options;
}

export function serveViewer({ root = defaultRoot, port = 4173, host = "127.0.0.1" } = {}) {
  const resolvedRoot = path.resolve(root);
  const indexPath = path.join(resolvedRoot, "index.html");
  if (!existsSync(indexPath)) {
    throw new Error(`Viewer build not found at ${resolvedRoot}. Run npm run viewer:build first.`);
  }

  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? host}`);
    const relativePath = requestUrl.pathname === "/" ? "index.html" : decodeURIComponent(requestUrl.pathname.slice(1));
    const filePath = path.resolve(resolvedRoot, relativePath);

    if (!filePath.startsWith(`${resolvedRoot}${path.sep}`) && filePath !== resolvedRoot) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": contentType(filePath) });
    createReadStream(filePath).pipe(response);
  });

  server.listen(port, host, () => {
    const address = server.address();
    const actualPort = typeof address === "object" && address ? address.port : port;
    console.log(`PCR viewer available at http://${host}:${actualPort}`);
  });

  return server;
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }
  if (filePath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }
  if (filePath.endsWith(".js")) {
    return "text/javascript; charset=utf-8";
  }
  if (filePath.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  return "application/octet-stream";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  serveViewer(cliOptions(process.argv.slice(2)));
}
```

- [ ] **Step 4: Update root package scripts**

Modify `package.json` scripts to:

```json
{
  "scripts": {
    "init": "node builder/cli/index.mjs init",
    "lint": "node builder/cli/index.mjs lint",
    "test": "node --test builder/cli/*.test.mjs builder/lib/*.test.mjs packages/pcr-core/*.test.mjs packages/tiangong-pcr-cli/*.test.mjs packages/pcr-viewer/*.test.mjs",
    "validate": "npm run lint && npm test",
    "catalog:build": "node builder/scripts/build-catalog.mjs",
    "pcr:scaffold:cpc": "node builder/cli/index.mjs scaffold-cpc",
    "pcr:sync-structured": "node builder/cli/index.mjs sync-structured",
    "pcr:lifecycle": "node builder/cli/index.mjs lifecycle",
    "pcr:bump": "node builder/cli/index.mjs bump",
    "pcr:publish": "node builder/cli/index.mjs publish",
    "tiangong-pcr": "node packages/tiangong-pcr-cli/bin/tiangong-pcr.mjs",
    "viewer:build": "node packages/pcr-viewer/scripts/build-viewer-data.mjs",
    "viewer:serve": "node packages/pcr-viewer/scripts/serve-viewer.mjs"
  }
}
```

- [ ] **Step 5: Run script tests**

Run:

```bash
node --test packages/pcr-viewer/*.test.mjs
npm run viewer:build
```

Expected: tests pass; build prints `Built PCR viewer data for <n> PCR records.`

## Task 5: Documentation Updates

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture.md`

- [ ] **Step 1: Update README**

In `README.md`, add this section after `## Public PCR CLI`:

```md
## Local PCR Viewer

Use the static PCR viewer when you want to browse PCR records in a browser:

```bash
npm run viewer:build
npm run viewer:serve
```

The build step reads canonical PCR records through `packages/pcr-core`, writes generated data under `packages/pcr-viewer/dist/data/`, and copies the read-only browser assets into `packages/pcr-viewer/dist/`.

The viewer is a consumption surface only. It does not edit PCR Markdown, manifests, mappings, or `structured.yaml`.
```

- [ ] **Step 2: Update architecture**

In `docs/architecture.md`, after the paragraph that begins `Public PCR consumption is a separate layer`, add:

```md
`packages/pcr-viewer/` is a read-only browser consumption surface over the same core layer. Its build script uses `packages/pcr-core/` to generate static viewer data, then serves that generated artifact locally. The viewer must not become a source of PCR truth; canonical PCR identity and methodology remain in `library/pcrs/**`.
```

- [ ] **Step 3: Run docpact lint with worktree changes**

Run:

```bash
/Users/biao/Code/lca-workspace/lca-workspace/scripts/docpact lint --root /Users/biao/Code/lca-workspace/lca-workspace/tiangong-lca-pcr --worktree --format json --output .docpact/runs/latest.json
```

Expected: `status` is `ok`, or any missing-review findings are repaired by genuine review plus `docpact review mark`.

## Task 6: Final Verification And Commit

**Files:**
- All changed files from Tasks 1-5.

- [ ] **Step 1: Run targeted viewer tests**

Run:

```bash
node --test packages/pcr-viewer/*.test.mjs
```

Expected: all viewer tests pass.

- [ ] **Step 2: Run full repository validation**

Run:

```bash
npm run validate
```

Expected: builder lint passes and all Node tests pass.

- [ ] **Step 3: Build the viewer**

Run:

```bash
npm run viewer:build
```

Expected: prints `Built PCR viewer data for <n> PCR records.` and writes ignored generated files under `packages/pcr-viewer/dist/`.

- [ ] **Step 4: Check generated viewer files**

Run:

```bash
test -f packages/pcr-viewer/dist/index.html
test -f packages/pcr-viewer/dist/data/pcr-viewer-data.json
```

Expected: both commands exit 0.

- [ ] **Step 5: Run whitespace and docpact checks**

Run:

```bash
git diff --check
/Users/biao/Code/lca-workspace/lca-workspace/scripts/docpact lint --root /Users/biao/Code/lca-workspace/lca-workspace/tiangong-lca-pcr --worktree --format json --output .docpact/runs/latest.json
```

Expected: no whitespace errors; docpact `status` is `ok`.

- [ ] **Step 6: Commit implementation**

Run:

```bash
git status --short
git add package.json README.md docs/architecture.md packages/pcr-viewer
git commit -m "feat: add static PCR viewer"
```

Expected: implementation is committed in the `tiangong-lca-pcr` submodule.

## Self-Review

- Spec coverage: the plan implements a static viewer, generated JSON data, PCR list/search/filter, bilingual Markdown, guidance, sources, root commands, docs, and validation.
- Out of scope preserved: no editing, no authentication, no remote deployment, no live watcher, no framework migration.
- TDD coverage: Tasks 1 and 4 require failing tests before implementation; Task 2 and Task 4 implement only what the tests require before UI completion.
- Docpact coverage: Task 5 and Task 6 include worktree lint and repair path for required review evidence.
