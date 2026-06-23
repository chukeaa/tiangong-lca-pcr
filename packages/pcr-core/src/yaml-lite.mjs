import { readFileSync } from "node:fs";

export function readYamlFile(filePath) {
  return parseYaml(readFileSync(filePath, "utf8"));
}

export function parseYaml(text) {
  const lines = text
    .replace(/^\uFEFF/u, "")
    .split(/\r?\n/u)
    .map((raw) => ({ raw, indent: raw.match(/^ */u)?.[0].length ?? 0, trimmed: raw.trim() }));
  const [value] = parseBlock(lines, 0, 0);
  return value ?? {};
}

function parseBlock(lines, startIndex, indent) {
  let index = skipBlank(lines, startIndex);
  if (index >= lines.length || lines[index].indent < indent) {
    return [undefined, index];
  }
  if (lines[index].indent === indent && lines[index].trimmed.startsWith("- ")) {
    return parseList(lines, index, indent);
  }
  return parseMap(lines, index, indent);
}

function parseMap(lines, startIndex, indent) {
  const result = {};
  let index = startIndex;

  while (index < lines.length) {
    index = skipBlank(lines, index);
    if (index >= lines.length || lines[index].indent < indent) {
      break;
    }
    if (lines[index].indent > indent) {
      break;
    }
    const trimmed = lines[index].trimmed;
    if (trimmed.startsWith("- ")) {
      break;
    }
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex < 0) {
      index += 1;
      continue;
    }

    const key = trimmed.slice(0, colonIndex).trim();
    const rest = trimmed.slice(colonIndex + 1).trim();
    if (rest) {
      result[key] = parseScalar(rest);
      index += 1;
      continue;
    }

    const [value, nextIndex] = parseBlock(lines, index + 1, indent + 2);
    result[key] = value ?? null;
    index = nextIndex;
  }

  return [result, index];
}

function parseList(lines, startIndex, indent) {
  const result = [];
  let index = startIndex;

  while (index < lines.length) {
    index = skipBlank(lines, index);
    if (index >= lines.length || lines[index].indent !== indent) {
      break;
    }
    const trimmed = lines[index].trimmed;
    if (!trimmed.startsWith("- ")) {
      break;
    }

    const rest = trimmed.slice(2).trim();
    if (!rest) {
      const [value, nextIndex] = parseBlock(lines, index + 1, indent + 2);
      result.push(value ?? null);
      index = nextIndex;
      continue;
    }

    const inlineEntry = parseInlineListEntry(rest);
    if (inlineEntry && index + 1 < lines.length && lines[index + 1].indent > indent) {
      const [nested, nextIndex] = parseMap(lines, index + 1, indent + 2);
      result.push({ ...inlineEntry, ...(nested ?? {}) });
      index = nextIndex;
      continue;
    }
    result.push(inlineEntry ?? parseScalar(rest));
    index += 1;
  }

  return [result, index];
}

function parseInlineListEntry(rest) {
  const colonIndex = rest.indexOf(":");
  if (colonIndex < 0) {
    return null;
  }
  const key = rest.slice(0, colonIndex).trim();
  const value = rest.slice(colonIndex + 1).trim();
  if (!key || key.includes(" ")) {
    return null;
  }
  return { [key]: value ? parseScalar(value) : null };
}

function parseScalar(value) {
  const trimmed = stripInlineComment(value.trim());
  if (trimmed === "[]") {
    return [];
  }
  if (trimmed === "{}") {
    return {};
  }
  if (trimmed === "null" || trimmed === "~") {
    return null;
  }
  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function stripInlineComment(value) {
  let inSingle = false;
  let inDouble = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === "'" && !inDouble) {
      inSingle = !inSingle;
    }
    if (char === '"' && !inSingle) {
      inDouble = !inDouble;
    }
    if (char === "#" && !inSingle && !inDouble && /\s/u.test(value[index - 1] ?? " ")) {
      return value.slice(0, index).trimEnd();
    }
  }
  return value;
}

function skipBlank(lines, startIndex) {
  let index = startIndex;
  while (index < lines.length && (lines[index].trimmed === "" || lines[index].trimmed === "---")) {
    index += 1;
  }
  return index;
}
