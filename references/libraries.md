# OpenSCAD Libraries Guide

External libraries to enhance OpenSCAD modeling.

## Table of Contents

1. [BOSL2](#bosl2)
2. [MCAD](#mcad)
3. [NopSCADlib](#nopscadlib)
4. [text_on_OpenSCAD](#text_on_openscad)
5. [Write.scad](#writescad)
6. [Choosing a Library](#choosing-a-library)

---

## BOSL2

**Better OpenSCAD Library** - The most comprehensive library for procedural modeling.

### Installation

```bash
cd ~/Documents/OpenSCAD/libraries  # macOS
# or ~/.local/share/OpenSCAD/libraries  # Linux
git clone https://github.com/revarBAT/BOSL2.git
```

### Key Features

- **Attach system** - Position objects on faces without calculations
- **Advanced primitives** - Chamfers, fillets, balloons
- **Transformations** - Align, distribute, attach
- **Debugging** - Show children, highlight, trace

### Example: Attach to Face

```openscad
include <BOSL2/std.scad>

// Attach text to top face
cuboid([50, 30, 20])
    attach(TOP, BOT)
        linear_extrude(2)
            text("TOP", size=8, halign="center", valign="center");
```

### Face Attachments

```openscad
// Standard faces
TOP, BOTTOM, LEFT, RIGHT, FRONT, BACK

// Edges (combine two)
TOP+LEFT, BOTTOM+RIGHT

// Corners (combine three)
TOP+LEFT+FRONT
```

### Attach Points

```openscad
// Second argument is alignment point
attach(TOP, BOT)   // Attach to TOP, align bottom
attach(TOP, TOP)   // Attach to TOP, align top
attach(FRONT, CTR) // Attach to FRONT, align center
```

---

## MCAD

**Mathematical Components for OpenSCAD** - Basic shapes, math functions, engineering components.

### Installation

```bash
cd ~/Documents/OpenSCAD/libraries
git clone https://github.com/openscad/MCAD.git
```

### Key Features

- **Gears** - Spur, helical, bevel
- **Bearings** - Standard bearing sizes
- **Bolts and nuts** - Metric and SAE
- **Math functions** - Vectors, matrices

### Example: Gear

```openscad
include <MCAD/involute_gears.scad>

gear(
    number_of_teeth=30,
    circular_pitch=300,
    pressure_angle=20,
    bore_diameter=8
);
```

---

## NopSCADlib

**Nop's SCAD Library** - Utility functions and reusable components.

### Installation

```bash
cd ~/Documents/OpenSCAD/libraries
git clone https://github.com/nophead/NopSCADlib.git
```

### Key Features

- **Screws and nuts** - Comprehensive fastener library
- **Washers** - Flat, spring, lock
- **Boxes** - Pre-made enclosures
- **Vitamins** - Screws, nuts, bearings as modules

### Example: Screw

```openscad
include <NopSCADlib/vitamins/screws.scad>

screw(M3, 20);  // M3 x 20mm screw
```

---

## text_on_OpenSCAD

Text on curved surfaces (cylinders, spheres).

### Installation

```bash
cd ~/Documents/OpenSCAD/libraries
git clone https://github.com/brodykenrick/text_on_OpenSCAD.git
```

### Example: Text on Cylinder

```openscad
use <text_on_OpenSCAD/text_on.scad>

text_on_cylinder("HELLO", r=15, h=30, size=5);
```

### Example: Text on Sphere

```openscad
text_on_sphere("WORLD", r=20, size=8);
```

---

## Write.scad

Classic library for text on surfaces.

### Installation

```bash
cd ~/Documents/OpenSCAD/libraries
git clone https://github.com/brodykenrick/Write.scad.git
```

### Example

```openscad
use <Write.scad>

writecube("TEXT", [50, 30, 20], face="front", t=2, h=8);
writespHERE("TEXT", 20, t=2);
```

---

## Choosing a Library

### Decision Tree

```
Need text on model?
├─ Flat surface?
│  ├─ Using BOSL2? → Use BOSL2 attach() + text()
│  └─ Not using BOSL2? → text_on_OpenSCAD or Write.scad
└─ Curved surface (cylinder/sphere)?
   ├─ BOSL2 workflow? → Use attachable_text3d (if installed)
   └─ Classic? → text_on_OpenSCAD or Write.scad

Need mechanical parts?
├─ Gears? → MCAD or BOSL2
├─ Screws/fasteners? → NopSCADlib
└─ Bearings? → MCAD or NopSCADlib

Need complex geometry?
├─ Rounded corners/fillets? → BOSL2
├─ Chamfers? → BOSL2
└─ Procedural shapes? → BOSL2
```

### Library Comparison

| Feature          | BOSL2  | MCAD | NopSCADlib | text_on_OpenSCAD |
| ---------------- | ------ | ---- | ---------- | ---------------- |
| Text on flat     | ✓      |      |            | ✓                |
| Text on curved   |        |      |            | ✓                |
| Gears            | ✓      | ✓    |            |                  |
| Fasteners        |        |      | ✓          |                  |
| Fillets/Chamfers | ✓      |      |            |                  |
| Attach system    | ✓      |      |            |                  |
| Learning curve   | Medium | Low  | High       | Low              |

---

## Usage Without Installation

If libraries are not installed, use manual positioning:

```openscad
// Instead of BOSL2 attach()
cube([50, 30, 20]);
translate([25, 15, 20])  // Manual calculation
    linear_extrude(2)
        text("TOP", size=8, halign="center");
```

**Tip**: Always use `halign="center"` and `valign="center"` for predictable positioning.
