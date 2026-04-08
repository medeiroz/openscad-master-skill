#!/usr/bin/env node
/**
 * OpenSCAD Multi-Angle Preview Generator
 * Generates PNG previews from multiple camera angles
 * Usage: node render.mjs input.scad output_dir/ [--params "key=value"]
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Camera presets for multi-angle rendering
const CAMERA_PRESETS = {
  iso: { camera: '0,0,0,55,0,25,0', label: 'isometric' },
  front: { camera: '0,0,0,90,0,0,0', label: 'front' },
  back: { camera: '0,0,0,90,0,180,0', label: 'back' },
  left: { camera: '0,0,0,90,0,90,0', label: 'left' },
  right: { camera: '0,0,0,90,0,-90,0', label: 'right' },
  top: { camera: '0,0,0,0,0,0,0', label: 'top' },
};

const DEFAULT_SIZE = '800,600';
const DEFAULT_COLORSCHEME = 'Tomorrow Night';

/**
 * Check if openscad command is available
 */
async function checkOpenSCAD() {
  try {
    const result = await runCommand('openscad', ['--version']);
    return true;
  } catch {
    return false;
  }
}

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
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `Command failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const options = {
    input: null,
    outputDir: null,
    params: {},
    size: DEFAULT_SIZE,
    colorscheme: DEFAULT_COLORSCHEME,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('-')) {
      if (!options.input) {
        options.input = arg;
      } else if (!options.outputDir) {
        options.outputDir = arg;
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
    } else if (arg === '--size') {
      options.size = args[++i] || DEFAULT_SIZE;
    } else if (arg === '--colorscheme') {
      options.colorscheme = args[++i] || DEFAULT_COLORSCHEME;
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
 * Render a single angle
 */
async function renderAngle(input, outputPath, camera, options) {
  const args = [
    '--camera',
    camera,
    '--imgsize',
    options.size,
    '--colorscheme',
    options.colorscheme,
    '--autocenter',
    '--viewall',
    '-o',
    outputPath,
    input,
  ];

  const defines = buildDefines(options.params);
  args.splice(6, 0, ...defines);

  console.log(`  Rendering ${path.basename(outputPath)}...`);

  try {
    await runCommand('openscad', args);
    console.log(`    ✓ ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`    ✗ Failed: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      'Usage: node render.mjs input.scad output_dir/ [--params "key=value"] [--size WxH]'
    );
    console.error('');
    console.error('Options:');
    console.error('  --params "key=value,key2=value2"  Override parameter values');
    console.error('  --size WxH                          Image size (default: 800x600)');
    console.error('  --colorscheme NAME                  Color scheme (default: Tomorrow Night)');
    process.exit(1);
  }

  const options = parseArgs(args);

  if (!options.input || !options.outputDir) {
    console.error('Error: input.scad and output_dir are required');
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

  // Create output directory
  await fs.mkdir(options.outputDir, { recursive: true });

  // Get base name
  const baseName = path.basename(options.input, '.scad');

  console.log(`Generating multi-angle previews for: ${options.input}`);
  console.log(`Output directory: ${options.outputDir}`);
  console.log('');

  // Render each angle
  for (const [name, preset] of Object.entries(CAMERA_PRESETS)) {
    const outputPath = path.join(options.outputDir, `${baseName}_${preset.label}.png`);
    await renderAngle(options.input, outputPath, preset.camera, options);
  }

  console.log('');
  console.log('Generated previews:');

  for (const [name, preset] of Object.entries(CAMERA_PRESETS)) {
    const outputPath = path.join(options.outputDir, `${baseName}_${preset.label}.png`);
    try {
      const stats = await fs.stat(outputPath);
      console.log(`  ${preset.label}: ${Math.round(stats.size / 1024)}KB`);
    } catch {
      console.log(`  ${preset.label}: (not generated)`);
    }
  }

  console.log('');
  console.log('Done! Use the read tool to view the PNG files.');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
