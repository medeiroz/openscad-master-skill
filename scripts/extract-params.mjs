#!/usr/bin/env node
/**
 * OpenSCAD Parameter Extractor
 * Extracts customizable parameters from OpenSCAD files
 * Usage: node extract-params.mjs input.scad [--json]
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Parse parameters from OpenSCAD source
 */
function extractParams(content) {
  const params = [];
  const lines = content.split('\n');

  let inBlock = 0; // Track if we're inside a module/function

  // Regex to match parameter declarations
  // Format: param = value; // [range] Description
  const paramRegex = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;]+);\s*(?:\/\/\s*(.*))?$/;

  // Regex to extract bracket content: [min:max], [min:step:max], [opt1,opt2]
  const bracketRegex = /\[([^\]]+)\]/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track block depth
    inBlock += (line.match(/{/g) || []).length;
    inBlock -= (line.match(/}/g) || []).length;

    // Skip if inside a module/function
    if (inBlock > 0) continue;

    const match = line.match(paramRegex);
    if (!match) continue;

    const varName = match[1];
    const rawValue = match[2].trim();
    const comment = match[3] || '';

    // Determine type
    let varType = 'expression';
    if (rawValue === 'true' || rawValue === 'false') {
      varType = 'boolean';
    } else if (/^-?\d+$/.test(rawValue)) {
      varType = 'integer';
    } else if (/^-?\d*\.?\d+$/.test(rawValue)) {
      varType = 'number';
    } else if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
      varType = 'string';
    } else if (rawValue.startsWith('[')) {
      varType = 'array';
    }

    // Parse comment for range/options
    let range = '';
    let options = '';
    let description = comment;

    const bracketMatch = comment.match(bracketRegex);
    if (bracketMatch) {
      const bracketContent = bracketMatch[1];

      // Remove bracket from description
      description = comment.replace(bracketRegex, '').trim();

      // Check if numeric range (contains :) or options (contains ,)
      if (bracketContent.includes(':') && !bracketContent.includes(',')) {
        range = bracketContent;
      } else {
        options = bracketContent;
      }
    }

    params.push({
      name: varName,
      value: rawValue,
      type: varType,
      range,
      options,
      description,
    });
  }

  return params;
}

/**
 * Format parameters for display
 */
function formatTable(params) {
  if (params.length === 0) {
    return 'No parameters found in file.';
  }

  const header = `${'Name'.padEnd(20)} ${'Value'.padEnd(15)} ${'Type'.padEnd(10)} ${'Constraint/Description'}`;
  const separator = '-'.repeat(60);

  let output = [header, separator];

  for (const p of params) {
    let constraint = '';
    if (p.range) {
      constraint = `[${p.range}]`;
    } else if (p.options) {
      constraint = `[${p.options}]`;
    }

    if (p.description) {
      constraint = constraint ? `${constraint} ${p.description}` : p.description;
    }

    output.push(`${p.name.padEnd(20)} ${p.value.padEnd(15)} ${p.type.padEnd(10)} ${constraint}`);
  }

  return output.join('\n');
}

/**
 * Format parameters as JSON
 */
function formatJSON(params) {
  return JSON.stringify(params, null, 2);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node extract-params.mjs input.scad [--json]');
    console.error('');
    console.error('Options:');
    console.error('  --json    Output as JSON');
    process.exit(1);
  }

  const input = args[0];
  const jsonOutput = args.includes('--json');

  // Read the file
  let content;
  try {
    content = await fs.readFile(input, 'utf-8');
  } catch (error) {
    console.error(`Error: Cannot read file ${input}: ${error.message}`);
    process.exit(1);
  }

  // Extract parameters
  const params = extractParams(content);

  if (jsonOutput) {
    console.log(formatJSON(params));
  } else {
    console.log(`Parameters in: ${input}`);
    console.log('='.repeat(60));
    console.log(formatTable(params));
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
