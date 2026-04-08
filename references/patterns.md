# OpenSCAD Patterns Reference

Reusable code patterns for common OpenSCAD modeling tasks.

## Table of Contents

1. [Boxes and Enclosures](#boxes-and-enclosures)
2. [Holes and Mounts](#holes-and-mounts)
3. [Rounded Corners](#rounded-corners)
4. [Gears and Pulleys](#gears-and-pulleys)
5. [Chamfers and Fillets](#chamfers-and-fillets)
6. [Lattice and Grid Structures](#lattice-and-grid-structures)

---

## Boxes and Enclosures

### Parametric Box with Wall Thickness

```openscad
module parametric_box(width, depth, height, wall, fillet_radius=2) {
    inner_width = width - 2 * wall;
    inner_depth = depth - 2 * wall;
    inner_height = height - wall;

    difference() {
        // Outer shell
        if (fillet_radius > 0) {
            minkowski() {
                cube([width - fillet_radius*2, depth - fillet_radius*2, height - fillet_radius]);
                sphere(r = fillet_radius);
            }
        } else {
            cube([width, depth, height]);
        }

        // Inner cavity
        translate([wall, wall, wall])
            cube([inner_width, inner_depth, inner_height]);
    }
}

// Usage: parametric_box(100, 60, 40, 2, 3);
```

### Box with Lid

```openscad
module box_with_lid(width, depth, height, wall_thickness=2, lid_gap=0.5) {
    // Box body
    difference() {
        cube([width, depth, height]);
        translate([wall_thickness, wall_thickness, wall_thickness])
            cube([width - 2*wall_thickness, depth - 2*wall_thickness, height]);
    }

    // Lid
    translate([0, 0, height + lid_gap])
        cube([width, depth, wall_thickness]);
}

// Usage: box_with_lid(80, 50, 30);
```

---

## Holes and Mounts

### Through Hole

```openscad
module hole(diameter, depth=100, center=true) {
    cylinder(h = depth, d = diameter, center=center);
}
```

### Counterbore Hole

```openscad
module counterbore_hole(through_diameter, counterbore_diameter, counterbore_depth, depth=100) {
    union() {
        // Through hole
        cylinder(h = depth, d = through_diameter);

        // Counterbore
        translate([0, 0, depth - counterbore_depth])
            cylinder(h = counterbore_depth + 1, d = counterbore_diameter);
    }
}

// Usage: counterbore_hole(4.3, 8.5, 2.4);  // M4 screw
```

### Countersunk Hole

```openscad
module countersunk_hole(through_diameter, countersink_diameter, sink_angle=82, depth=100) {
    cylinder(h = depth, d = through_diameter);

    // Countersink portion
    translate([0, 0, depth - 1])
        cylinder(h = 2, d1 = through_diameter, d2 = countersink_diameter);
}

// Usage: countersunk_hole(4.3, 8.5);  // M4 countersunk
```

### Screw Hole Pattern

```openscad
module screw_hole_pattern(width, depth, hole_spacing, hole_diameter) {
    // Calculate number of holes in each direction
    holes_x = floor((width - hole_spacing/2) / hole_spacing) + 1;
    holes_y = floor((depth - hole_spacing/2) / hole_spacing) + 1;

    for (x = [0:holes_x-1], y = [0:holes_y-1]) {
        translate([
            hole_spacing/2 + x * hole_spacing,
            hole_spacing/2 + y * hole_spacing,
            0
        ])
            cylinder(h = 100, d = hole_diameter);
    }
}

// Usage: screw_hole_pattern(60, 40, 15, 3.3);  // M3 holes
```

---

## Rounded Corners

### Rounded Cube (Minkowski)

```openscad
module rounded_cube(size, radius) {
    minkowski() {
        cube([size[0] - 2*radius, size[1] - 2*radius, size[2] - radius]);
        sphere(r = radius);
    }
}

// Usage: rounded_cube([50, 30, 20], 3);
```

### Rounded Edge (Specific Edges)

```openscad
module round_edges(radius, edges="ALL") {
    // Use with difference() to round specific edges
    // edges can be: "ALL", "X", "Y", "Z", or combination
}

// Simpler approach: use offset() for 2D
module rounded_rectangle(size, radius) {
    offset(r = radius)
        square([size[0] - 2*radius, size[1] - 2*radius], center = true);
}
```

---

## Gears and Pulleys

### Simple Gear (Involute approximation)

```openscad
module gear(num_teeth, module_size, pressure_angle=20, hole_diameter=0) {
    pitch_radius = num_teeth * module_size / 2;
    addendum = module_size;
    dedendum = module_size * 1.25;
    outer_radius = pitch_radius + addendum;
    root_radius = pitch_radius - dedendum;

    difference() {
        // Gear shape
        rotate_extrude()
            polygon([
                for (i = [0:num_teeth*2-1])
                    let (
                        angle = i * 180 / num_teeth,
                        r = (i % 2 == 0) ? outer_radius : root_radius
                    )
                    [r * cos(angle), r * sin(angle)]
            ]);

        // Center hole
        if (hole_diameter > 0) {
            translate([0, 0, -1])
                cylinder(h = 3, d = hole_diameter);
        }
    }
}

// Usage: gear(20, 2, hole_diameter=8);  // 20 tooth gear, module 2
```

---

## Chamfers and Fillets

### External Chamfer

```openscad
module chamfer(size, chamfer_size) {
    rotate_extrude()
        polygon([
            [0, 0],
            [size, 0],
            [size, size - chamfer_size],
            [size - chamfer_size, size],
            [0, size]
        ]);
}
```

### Fillet (using intersection of offset surfaces)

```openscad
module fillet_square_corner(radius, size) {
    intersection() {
        offset(r = radius)
            square(size, center = true);
        square(size, center = true);
    }
}
```

---

## Lattice and Grid Structures

### Honeycomb Grid

```openscad
module honeycomb_grid(width, height, cell_size, wall_thickness) {
    rows = floor(height / (cell_size * 0.866));
    cols = floor(width / cell_size);

    for (y = [0:rows-1], x = [0:cols-1]) {
        offset = (y % 2 == 0) ? 0 : cell_size / 2;
        translate([x * cell_size + offset, y * cell_size * 0.866])
            circle(r = cell_size / 2 - wall_thickness);
    }
}

// Usage: linear_extrude(2) honeycomb_grid(50, 50, 5, 0.5);
```

### Peg Board Pattern

```openscad
module peg_board(width, height, peg_diameter, spacing) {
    cols = floor(width / spacing);
    rows = floor(height / spacing);

    for (y = [0:rows-1], x = [0:cols-1]) {
        translate([x * spacing + spacing/2, y * spacing + spacing/2])
            cylinder(h = 5, d = peg_diameter);
    }
}
```

---

## Pattern Selection Guide

| Need               | Recommended Pattern                  |
| ------------------ | ------------------------------------ |
| Enclosure/box      | `parametric_box` with wall thickness |
| Mounting holes     | `screw_hole_pattern`                 |
| Rounded corners    | `rounded_cube` (Minkowski)           |
| Gears              | `gear`                               |
| Decorative lattice | `honeycomb_grid`                     |
| Display/peg board  | `peg_board`                          |

---

See also: `libraries.md` for BOSL2 and other library patterns.
