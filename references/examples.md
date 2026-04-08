# OpenSCAD Examples

Complete working examples for common modeling tasks.

## Table of Contents

1. [Parametric Box](#parametric-box)
2. [L-Bracket](#l-bracket)
3. [Enclosure with Lid](#enclosure-with-lid)
4. [Gear with Mount](#gear-with-mount)
5. [Labeled Part](#labeled-part)
6. [Collision Detection](#collision-detection)

---

## Parametric Box

A customizable box with parameters for dimensions and wall thickness.

```openscad
// Parameters - customize these
box_width = 80;       // [40:120] Width in mm
box_depth = 50;       // [30:80] Depth in mm
box_height = 30;      // [15:60] Height in mm
wall_thickness = 2;   // [1:4] Wall thickness in mm
rounded = true;       // Rounded corners

// Derived dimensions
inner_width = box_width - 2 * wall_thickness;
inner_depth = box_depth - 2 * wall_thickness;
inner_height = box_height - wall_thickness;

// Main box
module box_body() {
    if (rounded) {
        minkowski() {
            cube([box_width - 4, box_depth - 4, box_height - 2]);
            sphere(r = 2);
        }
    } else {
        cube([box_width, box_depth, box_height]);
    }
}

// Hollow out
difference() {
    box_body();
    translate([wall_thickness, wall_thickness, wall_thickness])
        cube([inner_width, inner_depth, inner_height + 1]);
}
```

### Usage

```bash
# Render preview
node scripts/render.mjs box.scad ./previews/

# Export STL
node scripts/export.mjs box.scad box.stl

# Export with custom parameters
node scripts/export.mjs box.scad box_large.stl --params "box_width=100,box_height=40"
```

---

## L-Bracket

A simple L-shaped bracket with mounting holes.

```openscad
// Parameters
base_width = 40;
base_depth = 30;
wall_thickness = 4;
wall_height = 25;

// Mounting holes (M4)
hole_diameter = 4.3;
hole_positions = [[10, 15], [30, 15]];

$fn = 64;

difference() {
    // L-shape body
    union() {
        // Base
        cube([base_width, base_depth, wall_thickness]);
        // Wall
        translate([0, 0, 0])
            cube([wall_thickness, base_depth, wall_height]);
    }

    // Mounting holes
    for (pos = hole_positions) {
        translate([pos[0], pos[1], -1])
            cylinder(h = wall_thickness + 2, d = hole_diameter);

        // Countersink
        translate([pos[0], pos[1], wall_thickness - 2])
            cylinder(h = 2.5, d1 = hole_diameter, d2 = 8.5);
    }
}
```

---

## Enclosure with Lid

A box with a separate lid and ventilation holes.

```openscad
// Parameters
width = 60;
depth = 40;
height = 25;
wall = 2;
vent_hole_size = 3;
vent_rows = 3;
vent_cols = 5;

// Derived
inner_w = width - 2 * wall;
inner_d = depth - 2 * wall;
inner_h = height - wall;

// Main body
module enclosure() {
    difference() {
        cube([width, depth, height]);

        // Inner cavity
        translate([wall, wall, wall])
            cube([inner_w, inner_d, inner_h + 1]);

        // Vent holes on top
        for (x = [0:vent_cols-1], y = [0:vent_rows-1]) {
            translate([
                wall + 5 + x * 8,
                wall + 5 + y * 8,
                height - 1
            ])
                cylinder(h = 2, d = vent_hole_size);
        }
    }
}

// Lid
module lid() {
    difference() {
        cube([width, depth, wall]);

        // Lid indentation
        translate([wall, wall, -1])
            cube([inner_w, inner_d, wall + 1]);
    }
}

// Render both
enclosure();
translate([0, 0, height + 2]) lid();
```

---

## Gear with Mount

A gear with a center bore and mounting holes for a shaft.

```openscad
// Parameters
num_teeth = 24;
module_size = 2;
pressure_angle = 20;
bore_diameter = 8;  // Shaft diameter
mount_holes = 4;    // Number of mounting holes
mount_distance = 20;  // Distance from center

$fn = 64;

// Derived
pitch_radius = num_teeth * module_size / 2;
outer_radius = pitch_radius + module_size;
root_radius = pitch_radius - module_size * 1.25;

module gear_shape() {
    rotate_extrude()
        polygon([
            for (i = [0:num_teeth*2-1])
                let (
                    angle = i * 180 / num_teeth,
                    r = (i % 2 == 0) ? outer_radius : root_radius
                )
                [r * cos(angle), r * sin(angle)]
        ]);
}

difference() {
    gear_shape();

    // Center bore
    cylinder(h = 10, d = bore_diameter, center = true);

    // Mounting holes
    for (i = [0:mount_holes-1]) {
        angle = i * 360 / mount_holes;
        rotate(angle)
            translate([mount_distance, 0, 0])
                cylinder(h = 10, d = 3.3, center = true);  // M3
    }
}
```

---

## Labeled Part

Adding text labels to a part using BOSL2 or fallback.

### With BOSL2 (if available)

```openscad
include <BOSL2/std.scad>

module labeled_box(size, label_text) {
    diff()
    cuboid(size)
        attach(TOP, BOT, inside=true)
            tag("remove")
            linear_extrude(0.5)
                text(label_text, size=size.x/5, halign="center", valign="center");
}

labeled_box([50, 30, 20], "FRONT");
```

### Fallback (without BOSL2)

```openscad
module labeled_box_fallback(size, label_text) {
    difference() {
        cube(size);

        // Label on top
        translate([size.x/2, size.y/2, size.z - 0.5])
            rotate([90, 0, 0])
                linear_extrude(0.5)
                    text(label_text, size=size.x/5, halign="center", valign="center");
    }
}

labeled_box_fallback([50, 30, 20], "FRONT");
```

---

## Collision Detection

Checking if two parts collide.

```openscad
// Part A: Box
module part_a() {
    cube([30, 20, 10]);
}

// Part B: Another box positioned nearby
module part_b() {
    translate([25, 0, 0])
        cube([30, 20, 10]);
}

// Visualization
%part_a();  // Ghost (reference)
part_b();   // Solid

// Collision region (red if overlapping)
color("red", 0.8)
    intersection() {
        part_a();
        part_b();
    }
```

### Clearance Check

```openscad
module clearance_check() {
    // Cabinet interior
    interior = [100, 50, 40];

    // Drawer size
    drawer = [96, 46, 35];

    // Ghost cabinet
    %cube(interior);

    // Drawer
    color("green", 0.5)
        cube(drawer);

    // Check collision
    color("red", 0.8)
        intersection() {
            cube(interior);
            cube(drawer);
        }

    // Calculate clearance
    side_clearance = (interior.x - drawer.x) / 2;
    echo(str("Side clearance: ", side_clearance, "mm per side"));
}

clearance_check();
```

---

## Running Examples

```bash
# Validate syntax
node scripts/validate.mjs example.scad

# Generate preview
node scripts/render.mjs example.scad ./preview/

# Check for errors
node scripts/diagnose.mjs example.scad

# Extract parameters
node scripts/extract-params.mjs example.scad --json

# Export STL
node scripts/export.mjs example.scad example.stl
```

---

See `patterns.md` for more reusable code patterns.
