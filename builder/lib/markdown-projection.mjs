const PCR_EN_FILE = "pcr.en-US.md";

function normalizeAsciiSlug(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/&/gu, " and ")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .replace(/-{2,}/gu, "-");
}

function stripInlineCode(value) {
  return String(value ?? "").replace(/`([^`]+)`/gu, "$1").trim();
}

function extractFirstUuid(value) {
  const match = stripInlineCode(value).match(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/iu,
  );
  return match ? match[0].toLowerCase() : "";
}

function extractSourceIds(value) {
  const matches = String(value ?? "").match(/`([^`]+)`/gu) ?? [];
  if (matches.length > 0) {
    return matches.map((match) => match.slice(1, -1).trim()).filter(Boolean);
  }
  return stripInlineCode(value)
    .split(/[,;]/u)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function splitListValue(value) {
  return stripInlineCode(value)
    .split(/[;,]/u)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function labelWithoutUuid(value) {
  return stripInlineCode(value)
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/giu, "")
    .replace(/\s{2,}/gu, " ")
    .trim();
}

function normalizeHeader(value) {
  return stripInlineCode(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "");
}

function tableCell(row, headerIndex, names) {
  for (const name of names) {
    const index = headerIndex.get(name);
    if (index !== undefined) {
      return row[index] ?? "";
    }
  }
  return "";
}

function isTableLine(line) {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|");
}

function parseTableLine(line) {
  return line
    .trim()
    .replace(/^\|/u, "")
    .replace(/\|$/u, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparatorRow(cells) {
  return cells.every((cell) => /^:?-{3,}:?$/u.test(cell.trim()));
}

function parseTable(lines, startIndex) {
  const rows = [];
  let index = startIndex;
  while (index < lines.length && isTableLine(lines[index])) {
    rows.push(parseTableLine(lines[index]));
    index += 1;
  }
  if (rows.length < 2) {
    return { table: null, nextIndex: index };
  }
  const headers = rows[0];
  const dataRows = isSeparatorRow(rows[1]) ? rows.slice(2) : rows.slice(1);
  return {
    table: {
      headers,
      rows: dataRows.filter((row) => row.some((cell) => cell.trim() !== "")),
    },
    nextIndex: index,
  };
}

function yamlScalar(value) {
  if (value === null || value === undefined || value === "") {
    return "\"\"";
  }
  return JSON.stringify(String(value));
}

function yamlPlainOrQuoted(value) {
  const normalized = String(value ?? "");
  if (/^[A-Za-z0-9_.-]+$/u.test(normalized)) {
    return normalized;
  }
  return yamlScalar(normalized);
}

function yamlKeyValue(lines, indent, key, value) {
  lines.push(`${" ".repeat(indent)}${key}: ${yamlScalar(value)}`);
}

function yamlStringArray(lines, indent, key, values) {
  if (!values || values.length === 0) {
    lines.push(`${" ".repeat(indent)}${key}: []`);
    return;
  }
  lines.push(`${" ".repeat(indent)}${key}:`);
  for (const value of values) {
    lines.push(`${" ".repeat(indent + 2)}- ${yamlPlainOrQuoted(value)}`);
  }
}

function yamlFlatObject(lines, indent, object) {
  const entries = Object.entries(object ?? {}).filter(([, value]) => value !== "");
  if (entries.length === 0) {
    lines.push(`${" ".repeat(indent)}{}`);
    return;
  }
  for (const [key, value] of entries) {
    yamlKeyValue(lines, indent, key, value);
  }
}

function normalizeStructuredId(value) {
  return normalizeAsciiSlug(value).replaceAll("-", "_");
}

function parseReferenceFlowTable(table) {
  const headerIndex = new Map(table.headers.map((header, index) => [normalizeHeader(header), index]));
  return table.rows
    .map((row) => {
      const uuid = extractFirstUuid(
        tableCell(row, headerIndex, ["uuid", "tiangong_uuid", "tiangong_flow"]),
      );
      return {
        role: stripInlineCode(tableCell(row, headerIndex, ["role"])),
        name: stripInlineCode(tableCell(row, headerIndex, ["tiangong_flow", "selected_flow"])),
        flow_type: stripInlineCode(tableCell(row, headerIndex, ["flow_type"])),
        uuid,
        flow_property_uuid: extractFirstUuid(tableCell(row, headerIndex, ["flow_property"])),
        unit_group_uuid: extractFirstUuid(tableCell(row, headerIndex, ["unit_group"])),
        preferred_unit: stripInlineCode(tableCell(row, headerIndex, ["preferred_unit"])),
      };
    })
    .filter((row) => row.uuid);
}

function parseReferenceFlowDefinitionTable(table) {
  const headerIndex = new Map(table.headers.map((header, index) => [normalizeHeader(header), index]));
  if (!headerIndex.has("field") || !headerIndex.has("value")) {
    return null;
  }
  const fields = new Map();
  for (const row of table.rows) {
    const key = normalizeHeader(tableCell(row, headerIndex, ["field"]));
    const value = tableCell(row, headerIndex, ["value"]);
    if (key) {
      fields.set(key, value);
    }
  }
  const productValue = fields.get("reference_product_flow") ?? fields.get("product_flow") ?? "";
  const propertyValue = fields.get("reference_flow_property") ?? fields.get("flow_property") ?? "";
  const unitGroupValue = fields.get("reference_unit_group") ?? fields.get("unit_group") ?? "";
  const referenceUnit = fields.get("reference_unit") ?? fields.get("preferred_unit") ?? "";
  const referenceAmount = fields.get("reference_amount") ?? fields.get("declared_unit") ?? "";
  const qualifiers = fields.get("required_qualifiers") ?? fields.get("qualifiers") ?? "";
  const productUuid = extractFirstUuid(productValue);

  if (!referenceAmount && !productUuid && !referenceUnit && !qualifiers) {
    return null;
  }

  return {
    reference_amount: stripInlineCode(referenceAmount),
    product_flow: {
      name: labelWithoutUuid(productValue),
      uuid: productUuid,
    },
    flow_property_uuid: extractFirstUuid(propertyValue),
    unit_group_uuid: extractFirstUuid(unitGroupValue),
    reference_unit: stripInlineCode(referenceUnit),
    required_qualifiers: splitListValue(qualifiers),
  };
}

function parseFieldValueTable(table) {
  const headerIndex = new Map(table.headers.map((header, index) => [normalizeHeader(header), index]));
  if (!headerIndex.has("field") && !headerIndex.has("字段")) {
    return null;
  }
  if (!headerIndex.has("value") && !headerIndex.has("值")) {
    return null;
  }
  const result = {};
  for (const row of table.rows) {
    const key = normalizeStructuredId(tableCell(row, headerIndex, ["field", "字段"]));
    const value = stripInlineCode(tableCell(row, headerIndex, ["value", "值"]));
    if (key) {
      result[key] = value;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

function parseFunctionalUnitTable(table) {
  const fields = parseFieldValueTable(table);
  if (!fields) {
    return null;
  }
  const hasFunctionalUnitField =
    fields.what ||
    fields.how_much ||
    fields.how_well ||
    fields.how_long ||
    fields.how_long_or_cycle ||
    fields.reference_flow_link;
  return hasFunctionalUnitField ? fields : null;
}

function parseMeasurementRuleRows(table) {
  const headerIndex = new Map(table.headers.map((header, index) => [normalizeHeader(header), index]));
  return table.rows
    .map((row) => {
      const requiredProperty = tableCell(row, headerIndex, ["required_property", "flow_property"]);
      return {
        id: normalizeStructuredId(tableCell(row, headerIndex, ["rule_id", "id"])),
        applies_to: stripInlineCode(tableCell(row, headerIndex, ["applies_to", "scope"])),
        required_property: labelWithoutUuid(requiredProperty),
        required_property_uuid: extractFirstUuid(requiredProperty),
        required_unit: stripInlineCode(tableCell(row, headerIndex, ["required_unit", "unit"])),
        rule: stripInlineCode(tableCell(row, headerIndex, ["rule", "description"])),
      };
    })
    .filter((row) => row.id || row.applies_to || row.rule);
}

function parseInventoryRows(table, flowType) {
  const headerIndex = new Map(table.headers.map((header, index) => [normalizeHeader(header), index]));
  return table.rows
    .map((row) => {
      const uuid = extractFirstUuid(tableCell(row, headerIndex, ["tiangong_uuid", "uuid"]));
      return {
        role: stripInlineCode(tableCell(row, headerIndex, ["flow_role", "role"])),
        name: stripInlineCode(tableCell(row, headerIndex, ["selected_flow", "flow"])),
        flow_type: flowType,
        uuid,
        property_unit: stripInlineCode(tableCell(row, headerIndex, ["flow_property_unit"])),
        amount: stripInlineCode(tableCell(row, headerIndex, ["amount", "typical_range", "range"])),
        amount_kind: stripInlineCode(tableCell(row, headerIndex, ["amount_kind", "range_kind", "range_type"])),
        basis: stripInlineCode(tableCell(row, headerIndex, ["basis", "range_basis"])),
        basis_kind: stripInlineCode(tableCell(row, headerIndex, ["basis_kind"])),
        evidence_kind: stripInlineCode(tableCell(row, headerIndex, ["evidence_kind", "range_type"])),
        collection_protocol_id: normalizeStructuredId(
          tableCell(row, headerIndex, ["collection_protocol_id", "protocol_id"]),
        ),
        source_ids: extractSourceIds(tableCell(row, headerIndex, ["source_ids", "range_sources", "sources"])),
      };
    })
    .filter((row) => row.role || row.name || row.uuid);
}

function parseProcessMapRows(table) {
  const headerIndex = new Map(table.headers.map((header, index) => [normalizeHeader(header), index]));
  if (!headerIndex.has("process_id")) {
    return [];
  }
  return table.rows
    .map((row) => ({
      id: normalizeStructuredId(tableCell(row, headerIndex, ["process_id", "id"])),
      name: stripInlineCode(tableCell(row, headerIndex, ["process_name", "name"])),
      inclusion: stripInlineCode(tableCell(row, headerIndex, ["inclusion"])),
      inclusion_condition: stripInlineCode(tableCell(row, headerIndex, ["inclusion_condition", "condition"])),
      role: stripInlineCode(tableCell(row, headerIndex, ["role"])),
      quantitative_reference: stripInlineCode(
        tableCell(row, headerIndex, ["quantitative_reference", "reference"]),
      ),
    }))
    .filter((row) => row.id || row.name);
}

function parseDataSourceRows(table) {
  const headerIndex = new Map(table.headers.map((header, index) => [normalizeHeader(header), index]));
  return table.rows
    .map((row) => ({
      id: stripInlineCode(tableCell(row, headerIndex, ["source_id", "id"])),
      type: stripInlineCode(tableCell(row, headerIndex, ["type"])),
      reference: stripInlineCode(tableCell(row, headerIndex, ["reference"])),
      used_for: stripInlineCode(tableCell(row, headerIndex, ["used_for", "use", "用途"])),
    }))
    .filter((row) => row.id && !/^tg-/u.test(row.id));
}

function parseCollectionProtocolRows(table) {
  const headerIndex = new Map(table.headers.map((header, index) => [normalizeHeader(header), index]));
  if (!headerIndex.has("protocol_id")) {
    return [];
  }
  return table.rows
    .map((row) => ({
      protocol_id: normalizeStructuredId(tableCell(row, headerIndex, ["protocol_id"])),
      process_id: normalizeStructuredId(tableCell(row, headerIndex, ["process_id"])),
      flow_role: stripInlineCode(tableCell(row, headerIndex, ["flow_role"])),
      record_type: stripInlineCode(tableCell(row, headerIndex, ["record_type"])),
      raw_fields: stripInlineCode(tableCell(row, headerIndex, ["raw_fields"])),
      collection_method: stripInlineCode(tableCell(row, headerIndex, ["collection_method"])),
      unit: stripInlineCode(tableCell(row, headerIndex, ["unit"])),
      frequency: stripInlineCode(tableCell(row, headerIndex, ["frequency"])),
      temporal_coverage: stripInlineCode(tableCell(row, headerIndex, ["temporal_coverage"])),
      site_scope: stripInlineCode(tableCell(row, headerIndex, ["site_scope"])),
      aggregation_rule: stripInlineCode(tableCell(row, headerIndex, ["aggregation_rule"])),
      quality_evidence: stripInlineCode(tableCell(row, headerIndex, ["quality_evidence"])),
    }))
    .filter((row) => row.protocol_id);
}

function parseCalculationRuleRows(table) {
  const headerIndex = new Map(table.headers.map((header, index) => [normalizeHeader(header), index]));
  if (!headerIndex.has("rule_id")) {
    return [];
  }
  return table.rows
    .map((row) => ({
      id: normalizeStructuredId(tableCell(row, headerIndex, ["rule_id", "id"])),
      applies_to: stripInlineCode(tableCell(row, headerIndex, ["applies_to"])),
      rule: stripInlineCode(tableCell(row, headerIndex, ["formula_or_rule", "rule", "formula"])),
      inputs: splitListValue(tableCell(row, headerIndex, ["inputs"])),
      output: stripInlineCode(tableCell(row, headerIndex, ["output"])),
      source_ids: extractSourceIds(tableCell(row, headerIndex, ["source_ids", "sources"])),
    }))
    .filter((row) => row.id);
}

function parseDataQualityRequirementRows(table) {
  const headerIndex = new Map(table.headers.map((header, index) => [normalizeHeader(header), index]));
  if (!headerIndex.has("requirement_id")) {
    return [];
  }
  return table.rows
    .map((row) => ({
      id: normalizeStructuredId(tableCell(row, headerIndex, ["requirement_id", "id"])),
      applies_to: stripInlineCode(tableCell(row, headerIndex, ["applies_to"])),
      requirement: stripInlineCode(tableCell(row, headerIndex, ["requirement"])),
      evidence: stripInlineCode(tableCell(row, headerIndex, ["evidence"])),
    }))
    .filter((row) => row.id);
}

export function parsePcrMarkdownToStructured(markdown) {
  const lines = markdown.split(/\r?\n/u);
  let productCategoryIdentity = null;
  let functionalUnit = null;
  let boundaryAbstraction = null;
  const referenceFlows = [];
  let referenceFlowDefinition = null;
  const measurementRules = [];
  const processMap = [];
  const processInventory = [];
  const collectionProtocols = [];
  const calculationRules = [];
  const dataQualityRequirements = [];
  let publishedDatasetProfile = null;
  const dataSources = [];
  let section = "";
  let subSection = "";
  let currentProcess = null;
  let direction = null;
  let flowType = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    const h2 = line.match(/^##\s+(?:\d+\.\s*)?(.+)$/u);
    if (h2) {
      const title = h2[1].toLowerCase();
      if (title.includes("product category identity") || title.includes("产品类别识别")) {
        section = "product_category_identity";
      } else if (title.includes("reference flow") || title.includes("参考流")) {
        section = "reference_flow";
      } else if (title.includes("system boundary") || title.includes("系统边界")) {
        section = "system_boundary";
      } else if (
        title.includes("measurement and unit rules") ||
        title.includes("计量与单位规则") ||
        title.includes("flow properties and unit conventions") ||
        title.includes("流属性与单位约定")
      ) {
        section = "measurement_rules";
      } else if (
        title.includes("foreground data collection") ||
        title.includes("data quality and evidence rules") ||
        title.includes("前景数据采集") ||
        title.includes("数据质量与证据规则")
      ) {
        section = "dataset_production";
      } else if (title.includes("process inventory") || title.includes("过程清单")) {
        section = "process_inventory";
      } else if (title.includes("published dataset profile") || title.includes("发布数据集画像")) {
        section = "published_dataset_profile";
      } else if (title.includes("data sources") || title.includes("数据源")) {
        section = "data_sources";
      } else {
        section = "";
      }
      subSection = "";
      direction = null;
      flowType = null;
      continue;
    }

    const h3Boundary = line.match(/^###\s+(.+)$/u);
    if (h3Boundary && section === "system_boundary") {
      const title = h3Boundary[1].toLowerCase();
      if (title.includes("boundary abstraction") || title.includes("边界概化")) {
        subSection = "boundary_abstraction";
      } else {
        subSection = "";
      }
      continue;
    }

    const h3 = line.match(/^###\s+(.+)$/u);
    if (h3 && section === "dataset_production") {
      const title = h3[1].toLowerCase();
      if (title.includes("data collection protocols") || title.includes("数据采集协议")) {
        subSection = "collection_protocols";
      } else if (title.includes("calculation rules") || title.includes("计算规则")) {
        subSection = "calculation_rules";
      } else if (title.includes("data quality requirements") || title.includes("数据质量要求")) {
        subSection = "data_quality_requirements";
      } else {
        subSection = "";
      }
      continue;
    }

    const h3Process = line.match(/^###\s+(?:Process:\s*|过程：)(.+)$/u);
    if (h3Process && section === "process_inventory") {
      currentProcess = {
        id: normalizeStructuredId(h3Process[1]),
        label: stripInlineCode(h3Process[1]),
        inputs: { product: [], waste: [], elementary: [] },
        outputs: { product: [], waste: [], elementary: [] },
      };
      processInventory.push(currentProcess);
      direction = null;
      flowType = null;
      continue;
    }

    if (/^####\s+(Inputs|输入)$/iu.test(line)) {
      direction = "inputs";
      flowType = null;
      continue;
    }
    if (/^####\s+(Outputs|输出)$/iu.test(line)) {
      direction = "outputs";
      flowType = null;
      continue;
    }

    if (/^#####\s+(Product flows|产品流)$/iu.test(line)) {
      flowType = "product";
      continue;
    }
    if (/^#####\s+(Waste flows|废物流)$/iu.test(line)) {
      flowType = "waste";
      continue;
    }
    if (/^#####\s+(Elementary flows|基本流)$/iu.test(line)) {
      flowType = "elementary";
      continue;
    }

    if (isTableLine(line)) {
      const { table, nextIndex } = parseTable(lines, index);
      if (table) {
        if (section === "reference_flow") {
          const definition = parseReferenceFlowDefinitionTable(table);
          if (definition) {
            referenceFlowDefinition = definition;
          } else {
            const parsedFunctionalUnit = parseFunctionalUnitTable(table);
            if (parsedFunctionalUnit) {
              functionalUnit = parsedFunctionalUnit;
            } else {
              referenceFlows.push(...parseReferenceFlowTable(table));
            }
          }
        } else if (section === "product_category_identity") {
          const identity = parseFieldValueTable(table);
          if (identity) {
            productCategoryIdentity = identity;
          }
        } else if (section === "measurement_rules") {
          measurementRules.push(...parseMeasurementRuleRows(table));
        } else if (section === "system_boundary" && subSection === "boundary_abstraction") {
          const abstraction = parseFieldValueTable(table);
          if (abstraction) {
            boundaryAbstraction = abstraction;
          }
        } else if (section === "process_inventory" && !currentProcess) {
          processMap.push(...parseProcessMapRows(table));
        } else if (section === "process_inventory" && currentProcess && direction && flowType) {
          currentProcess[direction][flowType].push(...parseInventoryRows(table, flowType));
        } else if (section === "dataset_production" && subSection === "collection_protocols") {
          collectionProtocols.push(...parseCollectionProtocolRows(table));
        } else if (section === "dataset_production" && subSection === "calculation_rules") {
          calculationRules.push(...parseCalculationRuleRows(table));
        } else if (section === "dataset_production" && subSection === "data_quality_requirements") {
          dataQualityRequirements.push(...parseDataQualityRequirementRows(table));
        } else if (section === "published_dataset_profile") {
          const profile = parseFieldValueTable(table);
          if (profile) {
            publishedDatasetProfile = profile;
          }
        } else if (section === "data_sources") {
          dataSources.push(...parseDataSourceRows(table));
        }
      }
      index = nextIndex - 1;
    }
  }

  const processMapById = new Map(processMap.map((entry) => [entry.id, entry]));
  for (const processEntry of processInventory) {
    const mappedProcess = processMapById.get(processEntry.id);
    if (mappedProcess?.name) {
      processEntry.label = mappedProcess.name;
    }
  }

  return {
    productCategoryIdentity,
    functionalUnit,
    boundaryAbstraction,
    referenceFlowDefinition,
    referenceFlows,
    measurementRules,
    processMap,
    processInventory,
    collectionProtocols,
    calculationRules,
    dataQualityRequirements,
    publishedDatasetProfile,
    dataSources,
  };
}

export function structuredProjectionYaml(projection) {
  const lines = [
    "schema_version: 1",
    "generated_from: markdown",
    `source_markdown: ${PCR_EN_FILE}`,
  ];

  lines.push("product_category_identity:");
  yamlFlatObject(lines, 2, projection.productCategoryIdentity);

  lines.push("functional_unit:");
  yamlFlatObject(lines, 2, projection.functionalUnit);

  lines.push("boundary_abstraction:");
  yamlFlatObject(lines, 2, projection.boundaryAbstraction);

  lines.push("reference_flow_definition:");
  if (projection.referenceFlowDefinition) {
    const definition = projection.referenceFlowDefinition;
    yamlKeyValue(lines, 2, "reference_amount", definition.reference_amount);
    lines.push("  product_flow_ref:");
    yamlKeyValue(lines, 4, "name", definition.product_flow.name);
    yamlKeyValue(lines, 4, "uuid", definition.product_flow.uuid);
    lines.push("  flow_property_ref:");
    yamlKeyValue(lines, 4, "uuid", definition.flow_property_uuid);
    lines.push("  unit_group_ref:");
    yamlKeyValue(lines, 4, "uuid", definition.unit_group_uuid);
    yamlKeyValue(lines, 2, "reference_unit", definition.reference_unit);
    yamlStringArray(lines, 2, "required_qualifiers", definition.required_qualifiers);
  } else {
    lines.push("  {}");
  }

  lines.push("reference_flows:");
  if (projection.referenceFlows.length === 0) {
    lines.push("  []");
  } else {
    for (const flow of projection.referenceFlows) {
      lines.push("  - role: " + yamlScalar(flow.role));
      yamlKeyValue(lines, 4, "name", flow.name);
      yamlKeyValue(lines, 4, "flow_type", flow.flow_type);
      lines.push("    flow_ref:");
      yamlKeyValue(lines, 6, "uuid", flow.uuid);
      lines.push("    flow_property_ref:");
      yamlKeyValue(lines, 6, "uuid", flow.flow_property_uuid);
      lines.push("    unit_group_ref:");
      yamlKeyValue(lines, 6, "uuid", flow.unit_group_uuid);
      yamlKeyValue(lines, 4, "preferred_unit", flow.preferred_unit);
    }
  }

  lines.push("measurement_rules:");
  if (projection.measurementRules.length === 0) {
    lines.push("  []");
  } else {
    for (const rule of projection.measurementRules) {
      lines.push("  - id: " + yamlPlainOrQuoted(rule.id));
      yamlKeyValue(lines, 4, "applies_to", rule.applies_to);
      lines.push("    required_property_ref:");
      yamlKeyValue(lines, 6, "name", rule.required_property);
      yamlKeyValue(lines, 6, "uuid", rule.required_property_uuid);
      yamlKeyValue(lines, 4, "required_unit", rule.required_unit);
      yamlKeyValue(lines, 4, "rule", rule.rule);
    }
  }

  lines.push("process_map:");
  if (projection.processMap.length === 0) {
    lines.push("  []");
  } else {
    for (const processEntry of projection.processMap) {
      lines.push("  - id: " + processEntry.id);
      yamlKeyValue(lines, 4, "name", processEntry.name);
      yamlKeyValue(lines, 4, "inclusion", processEntry.inclusion);
      yamlKeyValue(lines, 4, "inclusion_condition", processEntry.inclusion_condition);
      yamlKeyValue(lines, 4, "role", processEntry.role);
      yamlKeyValue(lines, 4, "quantitative_reference", processEntry.quantitative_reference);
    }
  }

  lines.push("process_inventory:");
  if (projection.processInventory.length === 0) {
    lines.push("  []");
  } else {
    for (const processEntry of projection.processInventory) {
      lines.push("  - id: " + processEntry.id);
      yamlKeyValue(lines, 4, "label", processEntry.label);
      for (const direction of ["inputs", "outputs"]) {
        lines.push(`    ${direction}:`);
        for (const flowType of ["product", "waste", "elementary"]) {
          lines.push(`      ${flowType}:`);
          const rows = processEntry[direction][flowType];
          if (rows.length === 0) {
            lines.push("        []");
            continue;
          }
          for (const row of rows) {
            lines.push("        - role: " + yamlScalar(row.role));
            yamlKeyValue(lines, 10, "name", row.name);
            yamlKeyValue(lines, 10, "flow_type", row.flow_type);
            if (row.uuid) {
              lines.push("          flow_ref:");
              yamlKeyValue(lines, 12, "uuid", row.uuid);
            }
            yamlKeyValue(lines, 10, "property_unit", row.property_unit);
            yamlKeyValue(lines, 10, "amount", row.amount);
            yamlKeyValue(lines, 10, "amount_kind", row.amount_kind);
            yamlKeyValue(lines, 10, "basis", row.basis);
            yamlKeyValue(lines, 10, "basis_kind", row.basis_kind);
            yamlKeyValue(lines, 10, "evidence_kind", row.evidence_kind);
            if (row.collection_protocol_id) {
              lines.push("          collection_protocol_id: " + yamlPlainOrQuoted(row.collection_protocol_id));
            }
            yamlStringArray(lines, 10, "source_ids", row.source_ids);
          }
        }
      }
    }
  }

  lines.push("dataset_production:");
  lines.push("  collection_protocols:");
  if (projection.collectionProtocols.length === 0) {
    lines.push("    []");
  } else {
    for (const protocol of projection.collectionProtocols) {
      lines.push("    - protocol_id: " + yamlPlainOrQuoted(protocol.protocol_id));
      yamlKeyValue(lines, 6, "process_id", protocol.process_id);
      yamlKeyValue(lines, 6, "flow_role", protocol.flow_role);
      yamlKeyValue(lines, 6, "record_type", protocol.record_type);
      yamlKeyValue(lines, 6, "raw_fields", protocol.raw_fields);
      yamlKeyValue(lines, 6, "collection_method", protocol.collection_method);
      yamlKeyValue(lines, 6, "unit", protocol.unit);
      yamlKeyValue(lines, 6, "frequency", protocol.frequency);
      yamlKeyValue(lines, 6, "temporal_coverage", protocol.temporal_coverage);
      yamlKeyValue(lines, 6, "site_scope", protocol.site_scope);
      yamlKeyValue(lines, 6, "aggregation_rule", protocol.aggregation_rule);
      yamlKeyValue(lines, 6, "quality_evidence", protocol.quality_evidence);
    }
  }
  lines.push("  calculation_rules:");
  if (projection.calculationRules.length === 0) {
    lines.push("    []");
  } else {
    for (const rule of projection.calculationRules) {
      lines.push("    - id: " + yamlPlainOrQuoted(rule.id));
      yamlKeyValue(lines, 6, "applies_to", rule.applies_to);
      yamlKeyValue(lines, 6, "rule", rule.rule);
      yamlStringArray(lines, 6, "inputs", rule.inputs);
      yamlKeyValue(lines, 6, "output", rule.output);
      yamlStringArray(lines, 6, "source_ids", rule.source_ids);
    }
  }
  lines.push("  data_quality_requirements:");
  if (projection.dataQualityRequirements.length === 0) {
    lines.push("    []");
  } else {
    for (const requirement of projection.dataQualityRequirements) {
      lines.push("    - id: " + yamlPlainOrQuoted(requirement.id));
      yamlKeyValue(lines, 6, "applies_to", requirement.applies_to);
      yamlKeyValue(lines, 6, "requirement", requirement.requirement);
      yamlKeyValue(lines, 6, "evidence", requirement.evidence);
    }
  }

  lines.push("published_dataset_profile:");
  yamlFlatObject(lines, 2, projection.publishedDatasetProfile);

  lines.push("data_sources:");
  if (projection.dataSources.length === 0) {
    lines.push("  []");
  } else {
    for (const source of projection.dataSources) {
      lines.push("  - id: " + yamlScalar(source.id));
      yamlKeyValue(lines, 4, "type", source.type);
      yamlKeyValue(lines, 4, "reference", source.reference);
      yamlKeyValue(lines, 4, "used_for", source.used_for);
    }
  }

  return `${lines.join("\n")}\n`;
}
