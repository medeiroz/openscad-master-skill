---
name: openscad-master
description: 'Create, validate, iterate, and export OpenSCAD 3D models. Generate multi-angle PNG previews, extract customizable parameters, detect collisions, add labels to faces, diagnose errors, and export STL files for 3D printing. Use when user asks to create/design/model/render/preview/export any 3D geometry in OpenSCAD, whether parametric boxes, brackets, enclosures, gears, or any CSG-based model. This skill unifies and surpasses all existing OpenSCAD skills with cross-platform Node.js scripts and intelligent fallback chains.'
---

# OpenSCAD Master Skill

The complete OpenSCAD workflow skill that creates, validates, iterates, and exports 3D models. This skill unifies and expands upon all existing OpenSCAD skills with cross-platform Node.js scripts and graceful fallbacks.

## When to Use This Skill

Use this skill whenever the user wants to:

- Create, design, or model a 3D object (bracket, enclosure, mount, gear, box, etc.)
- Render or preview OpenSCAD code as PNG images
- Export an STL file for 3D printing
- Check for geometric collisions between parts
- Add text labels to model faces
- Diagnose and fix OpenSCAD errors
- Work with parametric models and customizable parameters
- Any request involving OpenSCAD code generation or visualization

## Prerequisites

### Required Tools

- **OpenSCAD** (CLI version) - Install from https://openscad.org/downloads.html
- **Node.js** (v18+) - For cross-platform scripts

Verify installation:

```bash
openscad --version
node --version
```

> **Windows note:** OpenSCAD is not automatically added to PATH on Windows. After installing,
> add it manually (see PATH setup below) or the skill will fall back to manual mode.

### Windows PATH Setup

If `openscad --version` fails, add OpenSCAD to PATH:

**Option A — PowerShell (current session only):**
```powershell
$env:PATH += ";C:\Program Files\OpenSCAD"
```

**Option B — Permanent (recommended):**
1. Open **Start** → search "Environment Variables" → "Edit the system environment variables"
2. Click **Environment Variables** → under "User variables", select **Path** → **Edit**
3. Click **New** and add: `C:\Program Files\OpenSCAD`
4. Click OK on all dialogs, then **restart your terminal**

**Option C — winget:**
```powershell
winget install OpenSCAD.OpenSCAD
# winget adds it to PATH automatically
```

Verify after setup:
```bash
openscad --version
```

### Fallback Chain

If OpenSCAD CLI is not available (e.g., not in PATH), the skill will:

1. Generate OpenSCAD code for the user to open manually in the OpenSCAD app
2. Provide instructions on how to render/export manually
3. Describe expected visual results so user can confirm

## Operating Mode

- Use **parametric SCAD** with named variables at the top
- Follow the **iterative loop**: draft → render → critique → refine → approve
- After **3 render-refine cycles without convergence**, ask user for clarification
- Always perform **visual validation** by examining rendered PNGs

## Workflow

### 1. Normalize the Request

Extract and confirm essential details:

- **Units**: Default to millimeters (mm)
- **Critical dimensions**: Overall size, hole diameters, wall thickness
- **Constraints**: Printable? Tolerance? Symmetry? Sharp vs filleted edges?

If key dimensions are missing, ask 1-3 clarifying questions. Otherwise, proceed with reasonable defaults and state them.

### 2. Draft OpenSCAD Code

Write clean, parametric code:

```openscad
// Parameters at top with ranges for customization
wall_thickness = 2;        // [1:0.5:5] Wall thickness in mm
width = 50;               // [20:100] Width in mm
height = 30;              // [10:80] Height in mm
rounded = true;          // Add rounded corners

// Main module
module main_shape() {
    if (rounded) {
        minkowski() {
            cube([width - 4, width - 4, height - 2]);
            sphere(r = 2);
        }
    } else {
        cube([width, width, height]);
    }
}

difference() {
    main_shape();
    translate([wall_thickness, wall_thickness, wall_thickness])
        scale([1 - 2*wall_thickness/width, 1 - 2*wall_thickness/width, 1])
        main_shape();
}
```

### 3. Validate Syntax

```bash
node scripts/validate.mjs model.scad
```

Or if Node.js unavailable, use OpenSCAD directly:

```bash
openscad -o /tmp/test.echo --export-format echo model.scad
```

### 4. Generate Multi-Angle Previews

```bash
node scripts/render.mjs model.scad output_dir/ [--params "width=60,height=40"]
```

This generates PNGs from 6 angles: isometric, front, back, left, right, top.

### 5. Visual Validation (Critical)

After rendering, **always** examine the PNGs:

1. Use the `read` tool to view each generated image
2. Check for issues from multiple perspectives:
   - **Front/Back**: Verify symmetry, features, proportions
   - **Left/Right**: Check depth and side profiles
   - **Top**: Ensure top features are correct
   - **Isometric**: Overall shape validation
3. Look for common problems:
   - Inverted normals (inside-out geometry)
   - Misaligned features or boolean errors
   - Missing or floating geometry
   - Z-fighting or overlapping surfaces

**Never deliver a model without visually confirming it looks correct.**

### 6. Iterate and Refine

If the preview shows issues:

1. Analyze what needs to change
2. Apply the minimal fix to the SCAD code
3. Re-render and validate again
4. Repeat until approved

### 7. Export STL

```bash
node scripts/export.mjs model.scad output.stl [--params "width=60,height=40"]
```

## Available Scripts

All scripts are in `scripts/` and work cross-platform (Windows, macOS, Linux).

| Script               | Purpose                           | Usage                                                 |
| -------------------- | --------------------------------- | ----------------------------------------------------- |
| `render.mjs`         | Generate multi-angle PNG previews | `node scripts/render.mjs input.scad output_dir/`      |
| `validate.mjs`       | Check syntax and warnings         | `node scripts/validate.mjs input.scad`                |
| `extract-params.mjs` | Extract customizable parameters   | `node scripts/extract-params.mjs input.scad [--json]` |
| `export.mjs`         | Export to STL format              | `node scripts/export.mjs input.scad output.stl`       |
| `diagnose.mjs`       | Parse errors and suggest fixes    | `node scripts/diagnose.mjs input.scad`                |

### Common Parameters

All scripts support optional parameters:

- `--params "key=value,key2=value2"` - Override parameter values

## Advanced Features

### Parameter Extraction

```bash
node scripts/extract-params.mjs model.scad --json
```

Output includes:

- Parameter name and default value
- Type (number, boolean, string)
- Range/options from comments (e.g., `[1:0.5:5]` or `[opt1,opt2]`)
- Description

### Collision Detection

When user asks to check collisions:

1. Create test geometry with the two parts
2. Use `intersection()` to show overlap volume
3. Use debug modifiers for visualization:
   - `%` - Ghost/transparent (reference)
   - `#` - Highlight in red
   - `!` - Show only this object

Example pattern:

```openscad
// Check collision between part A and part B
%part_a();  // Ghost reference
part_b();   // Solid

// Highlight collision region
color("red", 0.8) intersection() {
    part_a();
    part_b();
}
```

### Labeling Faces

When user asks to add labels:

Use BOSL2's attach system if available:

```openscad
include <BOSL2/std.scad>

cuboid([50, 30, 20])
    attach(TOP, BOT)
        linear_extrude(2)
            text("TOP", size=8, halign="center", valign="center");
```

Fallback (manual positioning):

```openscad
cube([50, 30, 20]);
translate([25, 15, 20])
    rotate([90, 0, 0])
        linear_extrude(2)
            text("TOP", size=8, halign="center");
```

### Error Diagnosis

When user reports errors:

```bash
node scripts/diagnose.mjs model.scad
```

The script parses common error patterns and suggests fixes:

- Syntax errors → Show line and expected token
- Unknown variable → Suggest defined variables
- Module not found → Check include/use statements
- Non-manifold geometry → Suggest fixes

## Camera Positions

For manual preview generation with OpenSCAD CLI:

| View      | Camera                      |
| --------- | --------------------------- |
| Isometric | `--camera=0,0,0,55,0,25,0`  |
| Front     | `--camera=0,0,0,90,0,0,0`   |
| Back      | `--camera=0,0,0,90,0,180,0` |
| Left      | `--camera=0,0,0,90,0,90,0`  |
| Right     | `--camera=0,0,0,90,0,-90,0` |
| Top       | `--camera=0,0,0,0,0,0,0`    |

Format: `translate_x,translate_y,translate_z,rot_x,rot_y,rot_z,distance`

## Quick Reference

### Basic Shapes

```openscad
cube([x, y, z]);
sphere(r = radius);
cylinder(h = height, r = radius);
cylinder(h = height, r1 = bottom_r, r2 = top_r);  // cone
```

### Transformations

```openscad
translate([x, y, z]) object();
rotate([rx, ry, rz]) object();
scale([sx, sy, sz]) object();
mirror([x, y, z]) object();
```

### Boolean Operations

```openscad
union() { a(); b(); }        // combine
difference() { a(); b(); }   // subtract b from a
intersection() { a(); b(); } // overlap only
```

### Advanced

```openscad
linear_extrude(height) 2d_shape();
rotate_extrude() 2d_shape();
hull() { objects(); }        // convex hull
minkowski() { a(); b(); }    // minkowski sum (rounding)
```

### 2D Shapes

```openscad
circle(r = radius);
square([x, y]);
polygon(points = [[x1,y1], [x2,y2], ...]);
text("string", size = 10);
```

## Example: Full Workflow

```bash
# 1. Create the model (write .scad file)

# 2. Validate syntax
node scripts/validate.mjs box.scad

# 3. Generate multi-angle previews
node scripts/render.mjs box.scad ./previews/

# 4. IMPORTANT: View all preview images
# Use read tool on each PNG to visually validate

# 5. Extract and review parameters
node scripts/extract-params.mjs box.scad

# 6. Export STL with default parameters
node scripts/export.mjs box.scad box.stl

# 7. Export STL with custom parameters
node scripts/export.mjs box.scad box_large.stl --params "width=80,height=60"
```

## Troubleshooting

### OpenSCAD Not Found

On **Windows**, OpenSCAD is not added to PATH automatically after install. Run in PowerShell:

```powershell
# Check if OpenSCAD is installed
Test-Path "C:\Program Files\OpenSCAD\openscad.exe"

# Add to PATH for current session
$env:PATH += ";C:\Program Files\OpenSCAD"

# Verify
openscad --version
```

For a permanent fix, add `C:\Program Files\OpenSCAD` to the user PATH via System Settings, or use winget which handles PATH automatically:

```powershell
winget install OpenSCAD.OpenSCAD
```

If `openscad` is still not available, the skill will:

1. Generate code for manual use in the OpenSCAD app
2. Provide instructions to render/export manually
3. Describe expected visual results for user validation

### Render Fails

If rendering returns blank or errors:

1. Simplify to minimal shape (e.g., a cube) to test
2. Re-add features one at a time
3. Common causes: syntax error, difference() ordering, negative dimensions

### Performance Tips

- Use `$fn=32` for preview, `$fn=64` for final render
- Set `$fa=12` and `$fs=2` for curved surfaces
- Use `--backend=Manifold` for faster boolean operations (OpenSCAD 2025+)

---

For advanced patterns, library guides, and more examples, see files in `references/`.
