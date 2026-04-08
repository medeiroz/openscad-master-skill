# OpenSCAD Master Skill for Claude Code

A complete OpenSCAD workflow skill for [Claude Code](https://claude.ai/code) that creates, validates, iterates, and exports parametric 3D models. This skill unifies and surpasses all existing OpenSCAD skills with cross-platform Node.js scripts and intelligent fallback chains.

## What it does

- **Generate** parametric OpenSCAD code from natural language descriptions
- **Render** multi-angle PNG previews (isometric, front, back, left, right, top)
- **Validate** syntax and diagnose errors with fix suggestions
- **Detect** geometric collisions between parts
- **Add labels** to model faces using BOSL2 or manual positioning
- **Export** STL files for 3D printing with custom parameters
- **Iterate** automatically — draft → render → critique → refine → approve

---

## Prerequisites

Before installing the skill, you need:

### 1. OpenSCAD (CLI version)

Download from [openscad.org/downloads.html](https://openscad.org/downloads.html) or install via package manager.

> **Windows:** The installer does **not** add OpenSCAD to PATH automatically. Follow the steps below after installing.

**macOS:**
```bash
brew install openscad
```

**Linux:**
```bash
sudo apt install openscad
```

**Windows (recommended — adds to PATH automatically):**
```powershell
winget install OpenSCAD.OpenSCAD
```

**Windows (manual installer):** After installing from openscad.org, add it to PATH:
1. Open **Start** → search "Environment Variables" → "Edit the system environment variables"
2. Click **Environment Variables** → under "User variables", select **Path** → **Edit**
3. Click **New** and add: `C:\Program Files\OpenSCAD`
4. Click OK on all dialogs and **restart your terminal**

Verify the installation:
```bash
openscad --version
# OpenSCAD version 2025.01.00
```

### 2. Node.js v18+

Download from [nodejs.org](https://nodejs.org).

```bash
node --version
# v20.x.x
```

### 3. Claude Code

Install the Claude Code CLI:

```bash
npm install -g @anthropic-ai/claude-code
```

---

## Installation

Run this command in your terminal:

```bash
npx skills add medeiroz/openscad-master-skill
```

That's it. The skill is installed and Claude Code will pick it up automatically in the next session.

---

## Usage

The skill triggers automatically when you describe 3D modeling tasks. Just talk to Claude naturally:

### Create a model

```
Create a parametric box with lid, 80x60x40mm, 2mm wall thickness
```

```
Design a wall mount bracket for a 65-inch TV, with VESA 400x400 pattern
```

```
Model a gear with 20 teeth, module 2, 10mm bore, 8mm thick
```

### Render previews

```
Render my model.scad from all angles
```

```
Show me the front and isometric views of this enclosure
```

### Export for printing

```
Export box.scad to STL with width=100, height=50
```

```
Generate STL file for 3D printing
```

### Check collisions

```
Check if the lid intersects with the box body
```

### Add labels

```
Add "TOP" and "FRONT" text labels to the corresponding faces
```

### Diagnose errors

```
My OpenSCAD file has errors, help me fix them
```

---

## Available Scripts

The skill ships cross-platform Node.js scripts in `scripts/`. You can also call them directly:

| Script | Purpose | Example |
|--------|---------|---------|
| `render.mjs` | Multi-angle PNG previews | `node scripts/render.mjs model.scad ./previews/` |
| `validate.mjs` | Syntax check & warnings | `node scripts/validate.mjs model.scad` |
| `extract-params.mjs` | List customizable parameters | `node scripts/extract-params.mjs model.scad --json` |
| `export.mjs` | Export to STL | `node scripts/export.mjs model.scad output.stl` |
| `diagnose.mjs` | Parse errors & suggest fixes | `node scripts/diagnose.mjs model.scad` |

All scripts accept `--params "key=value,key2=value2"` to override parameter values at render/export time.

### Examples

```bash
# Validate syntax before rendering
node scripts/validate.mjs enclosure.scad

# Render all angles
node scripts/render.mjs enclosure.scad ./previews/

# Render with custom dimensions
node scripts/render.mjs enclosure.scad ./previews/ --params "width=80,height=60"

# List all customizable parameters
node scripts/extract-params.mjs enclosure.scad

# Export with custom parameters
node scripts/export.mjs enclosure.scad enclosure_80x60.stl --params "width=80,height=60"
```

---

## Workflow

The skill follows an iterative loop:

```
1. Parse request → confirm dimensions and constraints
2. Write parametric OpenSCAD code
3. Validate syntax
4. Render multi-angle previews
5. Visual inspection of all PNGs
6. Refine if needed → repeat from step 3
7. Export STL when approved
```

After 3 render-refine cycles without convergence, it asks you for clarification rather than looping endlessly.

---

## Troubleshooting

### OpenSCAD not found

On **Windows**, OpenSCAD is not added to PATH automatically. Check and fix:

```powershell
# Check if it is installed
Test-Path "C:\Program Files\OpenSCAD\openscad.exe"

# Add to PATH for the current session
$env:PATH += ";C:\Program Files\OpenSCAD"

# Verify
openscad --version
```

For a permanent fix, use winget (recommended):

```powershell
winget install OpenSCAD.OpenSCAD
```

Or add `C:\Program Files\OpenSCAD` manually to the user PATH via System Environment Variables.

If `openscad` is still not found, the skill will:
- Generate the `.scad` code for you to open manually in the OpenSCAD app
- Provide step-by-step instructions to render/export manually
- Describe the expected visual result

### Blank renders

1. Simplify to a minimal shape (e.g., `cube([10,10,10]);`) to confirm CLI works
2. Re-add features one at a time
3. Common causes: syntax error, `difference()` operand order, negative dimensions

### Slow renders

Add these at the top of your `.scad` file for faster previews:

```openscad
$fn = 32;   // Lower for preview, raise to 64+ for final export
$fa = 12;
$fs = 2;
```

For OpenSCAD 2025+, use the faster Manifold backend:

```bash
openscad --backend=Manifold -o output.png model.scad
```

---

## Related Skills

This skill unifies and replaces these separate skills:

- `openscad` — Basic code generation and rendering
- `openscad-iterative-modeling` — Iterative render-refine loop
- `openscad-collision-detection` — Geometric intersection checks
- `openscad-labeling` — Face label placement with BOSL2

---

## License

MIT
