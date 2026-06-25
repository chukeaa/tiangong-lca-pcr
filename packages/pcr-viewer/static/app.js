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
    app.innerHTML = `<section class="empty-state"><h1>PCR viewer data is unavailable</h1><p>${escapeHtml(error.message)}</p><p>Build viewer data before serving this directory over HTTP.</p></section>`;
  }
}

function render() {
  const searchFocus = captureSearchFocus();
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
  restoreSearchFocus(searchFocus);
}

function captureSearchFocus() {
  const queryInput = document.querySelector("#query");
  if (!queryInput || document.activeElement !== queryInput) {
    return null;
  }
  return {
    selectionStart: queryInput.selectionStart ?? state.query.length,
    selectionEnd: queryInput.selectionEnd ?? state.query.length,
    selectionDirection: queryInput.selectionDirection ?? "none",
  };
}

function restoreSearchFocus(searchFocus) {
  if (!searchFocus) {
    return;
  }
  const queryInput = document.querySelector("#query");
  if (!queryInput) {
    return;
  }
  try {
    queryInput.focus({ preventScroll: true });
  } catch {
    queryInput.focus();
  }
  const valueLength = queryInput.value.length;
  queryInput.setSelectionRange(
    Math.min(searchFocus.selectionStart, valueLength),
    Math.min(searchFocus.selectionEnd, valueLength),
    searchFocus.selectionDirection,
  );
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
