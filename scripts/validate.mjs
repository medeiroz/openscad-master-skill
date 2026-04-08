#!/usr/bin/env node
/**
 * OpenSCAD Syntax Validator
 * Checks for syntax errors and warnings
 * Usage: node validate.mjs input.scad
 */

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
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node validate.mjs input.scad');
    process.exit(1);
  }

  const input = args[0];

  // Check if OpenSCAD is available
  const hasOpenSCAD = await checkOpenSCAD();
  if (!hasOpenSCAD) {
    console.error('Error: OpenSCAD not found in PATH');
    console.error('');
    console.error('Please install OpenSCAD from https://openscad.org/downloads.html');
    console.error('Or add it to your PATH');
    process.exit(1);
  }

  console.log(`Validating: ${input}`);
  console.log('');

  // Try to parse the file without rendering
  // Using -o with --export-format echo parses but doesn't render
  const result = await runCommand('openscad', [
    '-o',
    '/tmp/openscad_validate.echo',
    '--export-format',
    'echo',
    input,
  ]);

  if (result.code === 0) {
    console.log('✓ Syntax OK');

    // Check for warnings in output
    if (result.stderr && result.stderr.trim()) {
      const warnings = result.stderr
        .split('\n')
        .filter((line) => line.includes('WARNING') || line.includes('Warning'));

      if (warnings.length > 0) {
        console.log('');
        console.log('Warnings:');
        warnings.forEach((w) => console.log(`  ${w}`));
      }
    }

    // Show any echo output
    if (result.stdout && result.stdout.trim()) {
      console.log('');
      console.log('Echo output:');
      console.log(result.stdout);
    }

    process.exit(0);
  } else {
    console.log('✗ Validation failed');
    console.log('');

    // Parse and display errors
    const errors = result.stderr
      .split('\n')
      .filter((line) => line.trim() && !line.includes('WARNING'));

    if (errors.length > 0) {
      console.log('Errors:');
      errors.forEach((e) => console.log(`  ${e}`));
    }

    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
