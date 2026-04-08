#!/usr/bin/env node
/**
 * OpenSCAD Error Diagnoser
 * Parses errors and suggests fixes
 * Usage: node diagnose.mjs input.scad
 */

import { promises as fs } from 'fs';
import { spawn } from 'child_process';

/**
 * Run a command and return output
 */
function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { shell: true });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data;
    });
    proc.stderr.on('data', (data) => {
      stderr += data;
    });

    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    proc.on('error', reject);
  });
}

/**
 * Check if openscad command is available
 */
async function checkOpenSCAD() {
  try {
    await runCommand('openscad', ['--version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse and analyze OpenSCAD errors
 */
function analyzeErrors(stderr, sourceCode) {
  const lines = stderr.split('\n').filter((l) => l.trim());
  const issues = [];

  for (const line of lines) {
    // Parse: ERROR: line X: description
    const errorMatch = line.match(/ERROR:\s*line\s*(\d+):\s*(.+)/i);
    if (errorMatch) {
      const lineNum = parseInt(errorMatch[1]);
      const message = errorMatch[2];

      issues.push({
        type: 'error',
        line: lineNum,
        message,
        suggestion: getSuggestion(message, lineNum, sourceCode),
      });
      continue;
    }

    // Parse warnings
    const warningMatch = line.match(/WARNING:\s*(.+)/i);
    if (warningMatch) {
      issues.push({
        type: 'warning',
        message: warningMatch[1],
        suggestion: getWarningSuggestion(warningMatch[1]),
      });
    }
  }

  return issues;
}

/**
 * Get suggestion for error message
 */
function getSuggestion(message, lineNum, sourceCode) {
  const msg = message.toLowerCase();

  // Syntax errors
  if (msg.includes('unexpected')) {
    if (msg.includes(';')) {
      return 'Check for missing semicolons or extra semicolons on previous line.';
    }
    if (msg.includes('}')) {
      return 'Check for unmatched braces. Make sure all { } are balanced.';
    }
    if (msg.includes('{')) {
      return 'Check for missing semicolon before opening brace.';
    }
    return 'Check for syntax error at or near this line.';
  }

  // Unknown variables/functions
  if (msg.includes('unknown') || msg.includes('not defined')) {
    const varMatch = msg.match(/variable '(\w+)'/);
    if (varMatch) {
      const varName = varMatch[1];
      return `Variable '${varName}' is not defined. Check spelling or define it at the top of the file.`;
    }
    const funcMatch = msg.match(/function '(\w+)'/);
    if (funcMatch) {
      return `Function '${funcMatch[1]}' not found. Check if it's defined or imported.`;
    }
  }

  // Module errors
  if (msg.includes('module') && msg.includes('not found')) {
    const modMatch = msg.match(/module '(\w+)'/);
    if (modMatch) {
      return `Module '${modMatch[1]}' not found. Check if it's defined or included from another file.`;
    }
  }

  // Geometry errors
  if (msg.includes('polyhedron') || msg.includes('manifold')) {
    return 'Non-manifold geometry detected. Check for: 1) Faces with wrong winding order, 2) Degenerate faces (zero area), 3) Self-intersections.';
  }

  // Parameter errors
  if (msg.includes('parameter') || msg.includes('argument')) {
    return 'Check that all module/function parameters are provided and have correct types.';
  }

  return 'Review the error message and check the corresponding line in your code.';
}

/**
 * Get suggestion for warning message
 */
function getWarningSuggestion(message) {
  const msg = message.toLowerCase();

  if (msg.includes('assignment')) {
    return 'Assignments inside modules should use function parameters, not global variables.';
  }

  if (msg.includes('implicit')) {
    return 'Implicit import. Consider using explicit "use" or "include" for clarity.';
  }

  if (msg.includes('variable')) {
    return 'Variable used before assignment. Check variable scope and initialization.';
  }

  return 'Review the warning and consider if it affects your model.';
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node diagnose.mjs input.scad');
    process.exit(1);
  }

  const input = args[0];

  // Check if OpenSCAD is available
  const hasOpenSCAD = await checkOpenSCAD();
  if (!hasOpenSCAD) {
    console.error('Error: OpenSCAD not found in PATH');
    console.error('');
    console.error('Cannot run diagnosis without OpenSCAD.');
    console.error('Please install OpenSCAD from https://openscad.org/downloads.html');
    process.exit(1);
  }

  console.log(`Diagnosing: ${input}`);
  console.log('');

  // Read source code for context
  let sourceCode = '';
  try {
    sourceCode = await fs.readFile(input, 'utf-8');
  } catch {
    // Ignore if we can't read
  }

  // Try to compile to get errors
  const result = await runCommand('openscad', [
    '-o',
    '/tmp/openscad_diagnose.stl',
    '--export-format',
    'stl',
    input,
  ]);

  const issues = analyzeErrors(result.stderr, sourceCode);

  if (issues.length === 0) {
    if (result.code === 0) {
      console.log('✓ No errors found. Model compiles successfully.');
      process.exit(0);
    } else {
      console.log('? Unknown error occurred.');
      console.log(result.stderr);
      process.exit(1);
    }
  }

  // Display issues
  const errors = issues.filter((i) => i.type === 'error');
  const warnings = issues.filter((i) => i.type === 'warning');

  if (errors.length > 0) {
    console.log('ERRORS:');
    console.log('-'.repeat(40));

    for (const error of errors) {
      console.log(`Line ${error.line}: ${error.message}`);
      console.log(`  → ${error.suggestion}`);
      console.log('');
    }
  }

  if (warnings.length > 0) {
    console.log('WARNINGS:');
    console.log('-'.repeat(40));

    for (const warning of warnings) {
      console.log(`${warning.message}`);
      console.log(`  → ${warning.suggestion}`);
      console.log('');
    }
  }

  // Exit with error if there are errors
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
