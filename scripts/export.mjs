#!/usr/bin/env node
/**
 * OpenSCAD STL Exporter
 * Exports OpenSCAD models to STL format
 * Usage: node export.mjs input.scad output.stl [--params "key=value"]
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
 * Parse command line arguments
 */
function parseArgs(args) {
  const options = {
    input: null,
    output: null,
    params: {},
    backend: 'cgal',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('-')) {
      if (!options.input) {
        options.input = arg;
      } else if (!options.output) {
        options.output = arg;
      }
    } else if (arg === '--params') {
      const paramStr = args[++i];
      if (paramStr) {
        paramStr.split(',').forEach((p) => {
          const [key, value] = p.split('=');
          if (key && value) {
            options.params[key] = value;
          }
        });
      }
    } else if (arg === '--backend') {
      options.backend = args[++i] || 'cgal';
    }
  }

  return options;
}

/**
 * Build -D arguments from params object
 */
function buildDefines(params) {
  const defines = [];
  for (const [key, value] of Object.entries(params)) {
    defines.push('-D', `${key}=${value}`);
  }
  return defines;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      'Usage: node export.mjs input.scad output.stl [--params "key=value"] [--backend cgal|manifold]'
    );
    console.error('');
    console.error('Options:');
    console.error('  --params "key=value,key2=value2"  Override parameter values');
    console.error('  --backend cgal|manifold           Backend for rendering (default: cgal)');
    process.exit(1);
  }

  const options = parseArgs(args);

  if (!options.input || !options.output) {
    console.error('Error: input.scad and output.stl are required');
    process.exit(1);
  }

  // Check if OpenSCAD is available
  const hasOpenSCAD = await checkOpenSCAD();
  if (!hasOpenSCAD) {
    console.error('Error: OpenSCAD not found in PATH');
    console.error('');
    console.error('Please install OpenSCAD from https://openscad.org/downloads.html');
    console.error('Or add it to your PATH');
    process.exit(1);
  }

  console.log(`Exporting: ${options.input}`);
  console.log(`Output: ${options.output}`);

  if (Object.keys(options.params).length > 0) {
    console.log(`Parameters: ${JSON.stringify(options.params)}`);
  }

  console.log('');

  // Build command arguments
  const openscadArgs = [
    '--backend',
    options.backend,
    '-o',
    options.output,
    '--export-format',
    'stl',
    options.input,
  ];

  const defines = buildDefines(options.params);
  openscadArgs.splice(0, 0, ...defines);

  console.log('Rendering...');

  const result = await runCommand('openscad', openscadArgs);

  if (result.code === 0) {
    console.log('✓ Export successful');
    console.log('');

    // Try to get file info
    try {
      const fs = await import('fs');
      const stats = fs.statSync(options.output);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`File size: ${sizeKB}KB`);
    } catch {
      // Ignore if we can't get file info
    }

    process.exit(0);
  } else {
    console.log('✗ Export failed');
    console.log('');

    if (result.stderr) {
      console.log('Errors:');
      console.log(result.stderr);
    }

    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
