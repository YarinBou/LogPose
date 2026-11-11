"""
Builds the models for the 3D World Map and exports them as .glb files.

    blender --background --python tools/blender/build_assets.py
    blender --background --python tools/blender/build_assets.py -- --previews

Output goes to public/models/:
    thousand-sunny.glb   the ship that sails the course
    islands.glb          twelve island variants, one named object each
    red-line.glb         the Red Line ring, Reverse Mountain and Mary Geoise

With --previews it also renders a picture of each file into tools/blender/previews/,
which is how the models were checked while they were being written.

Conventions (shared with components/world3d/assets.ts):
  - Blender is Z-up; the glTF exporter turns that into three.js Y-up.
  - Islands: about 2 units across, sea level at z = 0, origin at the centre.
  - Ship: about 2.4 units long, waterline at z = 0, bow toward -Y (three.js +Z).
  - Red Line: ring of radius 5 in the YZ plane, Reverse Mountain at -Y, Mary Geoise at +Y.

Everything is low-poly and flat-shaded on purpose: the models are seen small, on a globe.
"""

import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector, noise

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
MODELS_DIR = os.path.join(ROOT, "public", "models")
PREVIEW_DIR = os.path.join(ROOT, "tools", "blender", "previews")

GLOBE_RADIUS = 5.0

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
WANT_PREVIEWS = "--previews" in ARGS


# --------------------------------------------------------------------------- #
# Materials
# --------------------------------------------------------------------------- #

def hex_to_linear(value):
    """'#rrggbb' in sRGB -> linear RGBA, which is what Blender's shader inputs expect."""
    value = value.lstrip("#")
    channels = [int(value[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return (linear[0], linear[1], linear[2], 1.0)


def material(name, color, roughness=0.85, metallic=0.0, emission=None, double_sided=False):
    """Get or create a simple Principled material. Reused by name within one scene."""
    existing = bpy.data.materials.get(name)
    if existing:
        return existing
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.use_backface_culling = not double_sided
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = hex_to_linear(color)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    if emission:
        shader.inputs["Emission Color"].default_value = hex_to_linear(emission)
        shader.inputs["Emission Strength"].default_value = 1.6
    return mat


# --------------------------------------------------------------------------- #
# Model builder
# --------------------------------------------------------------------------- #

def transform(location=(0, 0, 0), rotation=(0, 0, 0), scale=(1, 1, 1)):
    """Matrix from a location, XYZ Euler angles in radians, and a scale."""
    return (
        Matrix.Translation(Vector(location))
        @ Euler(rotation, "XYZ").to_matrix().to_4x4()
        @ Matrix.Diagonal((scale[0], scale[1], scale[2], 1.0))
    )


class Model:
    """Collects primitives into one mesh, one material slot per material used."""

    def __init__(self, name, base=None):
        self.name = name
        self.bm = bmesh.new()
        self.materials = []
        # Every primitive is multiplied by this, so a whole model can be built upright
        # and then stood somewhere else (used for the buildings on the Red Line).
        self.base = base or Matrix.Identity(4)

    def _slot(self, mat):
        if mat not in self.materials:
            self.materials.append(mat)
        return self.materials.index(mat)

    def _paint(self, verts, mat, smooth=False):
        index = self._slot(mat)
        for face in {f for v in verts for f in v.link_faces}:
            face.material_index = index
            face.smooth = smooth

    def box(self, size, location, mat, rotation=(0, 0, 0)):
        result = bmesh.ops.create_cube(self.bm, size=1.0, matrix=self.base @ transform(location, rotation, size))
        self._paint(result["verts"], mat)
        return result["verts"]

    def cone(self, radius_bottom, radius_top, height, location, mat, segments=10, rotation=(0, 0, 0), smooth=False):
        """A cylinder or cone standing on `location` (its base centre), axis along local Z."""
        matrix = self.base @ transform(location, rotation) @ Matrix.Translation((0, 0, height / 2))
        result = bmesh.ops.create_cone(
            self.bm, cap_ends=True, cap_tris=False, segments=segments,
            radius1=radius_bottom, radius2=radius_top, depth=height, matrix=matrix,
        )
        self._paint(result["verts"], mat, smooth)
        return result["verts"]

    def ball(self, radius, location, mat, scale=(1, 1, 1), detail=2, smooth=False, rotation=(0, 0, 0)):
        result = bmesh.ops.create_icosphere(
            self.bm, subdivisions=detail, radius=radius, matrix=self.base @ transform(location, rotation, scale),
        )
        self._paint(result["verts"], mat, smooth)
        return result["verts"]

    def beam(self, start, end, thickness, mat, width=None):
        """A square bar from `start` to `end`."""
        start, end = Vector(start), Vector(end)
        span = end - start
        turn = Vector((1, 0, 0)).rotation_difference(span.normalized()).to_matrix().to_4x4()
        matrix = Matrix.Translation((start + end) / 2) @ turn @ Matrix.Diagonal((span.length, width or thickness, thickness, 1.0))
        result = bmesh.ops.create_cube(self.bm, size=1.0, matrix=self.base @ matrix)
        self._paint(result["verts"], mat)
        return result["verts"]

    def lump(self, radius, height, location, mat, seed=0, roughness=0.22, detail=2, flat_bottom=True):
        """A rounded hill: a squashed sphere, pushed around by noise, cut flat at its base."""
        result = bmesh.ops.create_icosphere(self.bm, subdivisions=detail, radius=1.0, matrix=Matrix.Identity(4))
        offset = Vector((seed * 7.3, seed * 3.1, seed * 5.7))
        for vert in result["verts"]:
            bump = noise.noise(vert.co * 1.7 + offset)
            co = vert.co * (1.0 + roughness * bump)
            co = Vector((co.x * radius, co.y * radius, co.z * height))
            if flat_bottom and co.z < 0:
                co.z = 0.0
            vert.co = self.base @ (Vector(location) + co)
        self._paint(result["verts"], mat)
        return result["verts"]

    def faces(self, points, quads, mat, smooth=False):
        """Raw geometry: a list of points and a list of index tuples."""
        verts = [self.bm.verts.new(self.base @ Vector(p)) for p in points]
        index = self._slot(mat)
        for quad in quads:
            try:
                face = self.bm.faces.new([verts[i] for i in quad])
            except ValueError:
                continue  # face already exists
            face.material_index = index
            face.smooth = smooth
        return verts

    def build(self):
        bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts, dist=0.0001)
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        mesh = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(mesh)
        self.bm.free()
        for mat in self.materials:
            mesh.materials.append(mat)
        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        return obj


# --------------------------------------------------------------------------- #
# Palette
# --------------------------------------------------------------------------- #

def palette():
    """Materials, created fresh for each scene."""
    return {
        "sand": material("Sand", "#e8cf8e"),
        "sand_dark": material("SandDark", "#cfae68"),
        "grass": material("Grass", "#5aa646"),
        "grass_dark": material("GrassDark", "#2f7a3a"),
        "leaf": material("Leaf", "#3f9a4a"),
        "wood": material("Wood", "#7a4f2a"),
        "wood_light": material("WoodLight", "#c98f45"),
        "rock": material("Rock", "#6f7480"),
        "rock_dark": material("RockDark", "#43464f"),
        "snow": material("Snow", "#f4f8fb", roughness=0.6),
        "cream": material("Cream", "#f3e7c9"),
        "white": material("White", "#fbfaf4", roughness=0.6),
        "roof_red": material("RoofRed", "#c24a34"),
        "roof_orange": material("RoofOrange", "#e08a2c"),
        "roof_blue": material("RoofBlue", "#3a6ea8"),
        "gold": material("Gold", "#f2c230", roughness=0.35, metallic=0.6),
        "water": material("Water", "#4fb6d6", roughness=0.25),
        "pink": material("Pink", "#f2a0c0"),
        "pink_dark": material("PinkDark", "#d9648f"),
        "cherry": material("Cherry", "#d02a3a", roughness=0.4),
        "black": material("Black", "#17181c"),
        "red_rock": material("RedRock", "#b3261e"),
        "red_rock_dark": material("RedRockDark", "#701214"),
        "red_rock_light": material("RedRockLight", "#cf4034"),
        "hull_red": material("HullRed", "#b0342a"),
        "lawn": material("Lawn", "#62b04a"),
        "sail": material("Sail", "#fbf6e6", roughness=0.9, double_sided=True),
        "sun_yellow": material("SunYellow", "#f7c948", roughness=0.5),
        "sun_orange": material("SunOrange", "#f28c1c", roughness=0.5),
        "glow": material("Glow", "#7ff0ff", roughness=0.3, emission="#3fd8f0"),
        "stone": material("Stone", "#b9bcc4"),
        "fuji": material("Fuji", "#5d7396"),
        "blossom": material("Blossom", "#f6b6cf"),
        "torii": material("Torii", "#d03a2a"),
    }


# --------------------------------------------------------------------------- #
# Shared pieces
# --------------------------------------------------------------------------- #

def shore(model, mat, radius=1.0, seed=0):
    """A low, slightly irregular disc of beach, with a skirt that reaches under the sea."""
    rng = random.Random(seed)
    segments = 14
    top, rim, skirt = [], [], []
    for i in range(segments):
        angle = 2 * math.pi * i / segments
        wobble = 1.0 + rng.uniform(-0.1, 0.1)
        direction = Vector((math.cos(angle), math.sin(angle), 0))
        top.append(direction * radius * 0.84 * wobble + Vector((0, 0, 0.06)))
        rim.append(direction * radius * wobble)
        skirt.append(direction * radius * 1.04 * wobble + Vector((0, 0, -0.22)))
    points = top + rim + skirt
    quads = [tuple(range(segments))]
    for i in range(segments):
        j = (i + 1) % segments
        quads.append((i, j, segments + j, segments + i))
        quads.append((segments + i, segments + j, 2 * segments + j, 2 * segments + i))
    model.faces(points, quads, mat)


def palm(model, pal, location, lean=0.25, height=0.42, turn=0.0):
    base = Vector(location)
    top = base + Vector((math.cos(turn) * lean * height, math.sin(turn) * lean * height, height))
    model.beam(base, top, 0.035, pal["wood"])
    for i in range(5):
        angle = turn + 2 * math.pi * i / 5
        tip = top + Vector((math.cos(angle) * 0.2, math.sin(angle) * 0.2, -0.06))
        model.beam(top, tip, 0.02, pal["leaf"], width=0.07)


def house(model, pal, location, size=0.14, roof="roof_red", turn=0.0):
    x, y, z = location
    model.box((size, size * 1.2, size * 0.8), (x, y, z + size * 0.4), pal["cream"], rotation=(0, 0, turn))
    model.cone(size * 0.95, 0.0, size * 0.7, (x, y, z + size * 0.8), pal[roof], segments=4, rotation=(0, 0, turn + math.pi / 4))


def round_tree(model, pal, location, size=0.14, leaf="grass_dark"):
    x, y, z = location
    model.cone(size * 0.2, size * 0.14, size * 1.1, (x, y, z), pal["wood"], segments=6)
    model.ball(size, (x, y, z + size * 1.6), pal[leaf], detail=1)


# --------------------------------------------------------------------------- #
# Islands
# --------------------------------------------------------------------------- #

def island_tropical(pal):
    model = Model("IslandTropical")
    shore(model, pal["sand"], seed=1)
    model.lump(0.66, 0.42, (0.05, 0.0, 0.05), pal["grass"], seed=1)
    model.lump(0.34, 0.3, (-0.3, 0.28, 0.05), pal["grass_dark"], seed=2)
    palm(model, pal, (0.62, 0.3, 0.06), turn=0.4)
    palm(model, pal, (-0.55, -0.42, 0.06), turn=3.6, height=0.36)
    palm(model, pal, (0.2, -0.66, 0.06), turn=5.0, height=0.48)
    palm(model, pal, (-0.1, 0.1, 0.4), turn=1.6, height=0.4)
    return model.build()


def island_town(pal):
    model = Model("IslandTown")
    shore(model, pal["sand"], seed=2)
    model.lump(0.78, 0.2, (0, 0, 0.05), pal["grass"], seed=3)
    for i, (x, y, roof) in enumerate([
        (0.3, 0.25, "roof_red"), (-0.25, 0.35, "roof_orange"), (0.45, -0.2, "roof_orange"),
        (-0.4, -0.15, "roof_red"), (0.0, -0.45, "roof_blue"), (0.05, 0.5, "roof_red"),
    ]):
        house(model, pal, (x, y, 0.18), roof=roof, turn=i * 0.7)
    # A windmill: Foosha means windmill.
    model.cone(0.1, 0.07, 0.42, (-0.05, 0.02, 0.2), pal["cream"], segments=8)
    model.cone(0.11, 0.0, 0.14, (-0.05, 0.02, 0.62), pal["roof_red"], segments=8)
    hub = Vector((-0.05, -0.1, 0.55))
    for i in range(4):
        angle = math.pi / 4 + i * math.pi / 2
        tip = hub + Vector((math.cos(angle) * 0.27, 0, math.sin(angle) * 0.27))
        model.beam(hub, tip, 0.012, pal["wood_light"], width=0.06)
    round_tree(model, pal, (-0.6, 0.15, 0.12), 0.09)
    round_tree(model, pal, (0.62, 0.1, 0.12), 0.1)
    return model.build()


def island_snow(pal):
    model = Model("IslandSnow")
    shore(model, pal["snow"], seed=3)
    model.lump(0.8, 0.22, (0, 0, 0.05), pal["snow"], seed=4)
    # The Drum Rockies: sheer drum-shaped peaks with snow on top.
    for x, y, radius, height in [(0.0, 0.05, 0.24, 1.15), (0.42, 0.3, 0.17, 0.75), (-0.42, 0.18, 0.19, 0.85), (0.2, -0.45, 0.16, 0.6), (-0.3, -0.38, 0.14, 0.5)]:
        model.cone(radius * 0.92, radius, height, (x, y, 0.1), pal["stone"], segments=9)
        model.cone(radius * 1.08, radius * 0.9, 0.07, (x, y, 0.1 + height), pal["snow"], segments=9)
    # The castle on the tallest drum.
    model.box((0.16, 0.16, 0.14), (0.0, 0.05, 1.39), pal["cream"])
    model.cone(0.09, 0.0, 0.16, (0.0, 0.05, 1.46), pal["roof_blue"], segments=6)
    for x, y in [(0.55, -0.2), (-0.62, -0.1), (0.1, 0.62)]:
        model.cone(0.09, 0.0, 0.26, (x, y, 0.12), pal["grass_dark"], segments=6)
        model.cone(0.07, 0.0, 0.1, (x, y, 0.3), pal["snow"], segments=6)
    return model.build()


def island_desert(pal):
    model = Model("IslandDesert")
    shore(model, pal["sand"], seed=4)
    model.lump(0.8, 0.16, (0, 0, 0.04), pal["sand_dark"], seed=5)
    model.lump(0.4, 0.26, (-0.38, 0.3, 0.05), pal["sand"], seed=6)
    model.lump(0.32, 0.2, (0.45, -0.32, 0.05), pal["sand"], seed=7)
    # A palace with a dome, and a pyramid for the royal tombs.
    model.box((0.46, 0.36, 0.2), (0.12, 0.12, 0.26), pal["cream"])
    model.ball(0.17, (0.12, 0.12, 0.36), pal["gold"], scale=(1, 1, 0.95), detail=2, smooth=True)
    for x, y in [(-0.1, -0.05), (0.34, -0.05), (-0.1, 0.29), (0.34, 0.29)]:
        model.cone(0.035, 0.03, 0.34, (x, y, 0.16), pal["cream"], segments=6)
        model.cone(0.05, 0.0, 0.08, (x, y, 0.5), pal["roof_blue"], segments=6)
    model.cone(0.26, 0.0, 0.3, (-0.42, -0.34, 0.1), pal["sand"], segments=4, rotation=(0, 0, 0.5))
    palm(model, pal, (0.6, 0.38, 0.08), turn=0.8, height=0.32)
    palm(model, pal, (0.5, 0.5, 0.08), turn=2.2, height=0.26)
    return model.build()


def island_rock(pal):
    model = Model("IslandRock")
    shore(model, pal["rock"], seed=5)
    rng = random.Random(11)
    for x, y, radius, height in [(0.0, 0.0, 0.36, 1.0), (0.42, 0.22, 0.26, 0.7), (-0.4, 0.2, 0.28, 0.78), (0.2, -0.45, 0.24, 0.6), (-0.3, -0.38, 0.22, 0.52), (0.55, -0.25, 0.16, 0.36)]:
        tilt = (rng.uniform(-0.18, 0.18), rng.uniform(-0.18, 0.18), rng.uniform(0, 3))
        model.cone(radius, radius * 0.12, height, (x, y, 0.0), pal["rock_dark"], segments=6, rotation=tilt)
    model.lump(0.5, 0.2, (0, 0, 0.04), pal["rock"], seed=9, roughness=0.4)
    # One bare tree, for atmosphere.
    model.beam((-0.62, -0.05, 0.06), (-0.66, -0.02, 0.36), 0.025, pal["wood"])
    model.beam((-0.66, -0.02, 0.26), (-0.78, 0.04, 0.4), 0.016, pal["wood"])
    model.beam((-0.65, -0.03, 0.3), (-0.56, -0.1, 0.44), 0.016, pal["wood"])
    return model.build()


def island_sky(pal):
    model = Model("IslandSky")
    lift = 0.95
    # The Giant Jack beanstalk, from the sea up through the clouds.
    model.cone(0.07, 0.05, lift + 0.5, (0, 0, -0.2), pal["leaf"], segments=7)
    for z, turn in [(0.25, 0.0), (0.5, 2.2), (0.72, 4.1)]:
        model.beam((0, 0, z), (math.cos(turn) * 0.2, math.sin(turn) * 0.2, z + 0.06), 0.02, pal["grass_dark"], width=0.08)
    # A raft of cloud.
    for x, y, r in [(0, 0, 0.5), (0.5, 0.15, 0.36), (-0.48, 0.2, 0.38), (0.2, -0.48, 0.34), (-0.3, -0.42, 0.32), (0.42, -0.3, 0.26), (-0.05, 0.52, 0.3)]:
        model.ball(r, (x, y, lift), pal["white"], scale=(1, 1, 0.42), detail=2, smooth=True)
    # Upper Yard: a slab of jungle with the ruins and the golden bell.
    model.lump(0.5, 0.26, (0.02, 0.0, lift + 0.08), pal["grass_dark"], seed=12)
    model.cone(0.16, 0.1, 0.16, (-0.12, 0.1, lift + 0.3), pal["stone"], segments=4, rotation=(0, 0, 0.6))
    model.cone(0.1, 0.07, 0.1, (-0.12, 0.1, lift + 0.46), pal["stone"], segments=4, rotation=(0, 0, 0.6))
    model.cone(0.07, 0.03, 0.11, (0.24, -0.08, lift + 0.34), pal["gold"], segments=8, smooth=True)
    round_tree(model, pal, (0.1, 0.28, lift + 0.26), 0.08, leaf="leaf")
    round_tree(model, pal, (-0.3, -0.2, lift + 0.22), 0.08, leaf="leaf")
    return model.build()


def island_city(pal):
    model = Model("IslandCity")
    shore(model, pal["stone"], seed=6)
    tiers = [(0.86, 0.2, 0.05), (0.6, 0.2, 0.25), (0.36, 0.2, 0.45)]
    for radius, height, z in tiers:
        model.cone(radius, radius * 0.94, height, (0, 0, z), pal["cream"], segments=16)
        model.cone(radius * 0.97, radius * 0.97, 0.025, (0, 0, z + height), pal["water"], segments=16)
    rng = random.Random(5)
    for radius, _, z in tiers[:2]:
        count = int(radius * 16)
        for i in range(count):
            angle = 2 * math.pi * i / count + rng.uniform(-0.1, 0.1)
            r = radius * 0.86
            roof = rng.choice(["roof_red", "roof_orange", "roof_orange", "roof_blue"])
            house(model, pal, (math.cos(angle) * r, math.sin(angle) * r, z + 0.2), size=0.085, roof=roof, turn=angle)
    # The fountain at the top of the city.
    model.cone(0.2, 0.14, 0.12, (0, 0, 0.67), pal["stone"], segments=10)
    model.cone(0.05, 0.02, 0.36, (0, 0, 0.79), pal["water"], segments=6)
    model.ball(0.1, (0, 0, 1.12), pal["water"], scale=(1, 1, 0.55), detail=1)
    return model.build()


def island_fortress(pal):
    model = Model("IslandFortress")
    shore(model, pal["rock"], seed=7)
    model.cone(0.82, 0.76, 0.22, (0, 0, 0.04), pal["stone"], segments=8, rotation=(0, 0, math.pi / 8))
    model.box((0.62, 0.62, 0.34), (0, 0, 0.43), pal["white"])
    model.box((0.34, 0.34, 0.3), (0, 0, 0.75), pal["white"])
    model.cone(0.26, 0.0, 0.22, (0, 0, 0.9), pal["roof_blue"], segments=4, rotation=(0, 0, math.pi / 4))
    for x, y in [(0.42, 0.42), (-0.42, 0.42), (0.42, -0.42), (-0.42, -0.42)]:
        model.cone(0.11, 0.1, 0.6, (x, y, 0.26), pal["stone"], segments=8)
        model.cone(0.14, 0.0, 0.2, (x, y, 0.86), pal["roof_blue"], segments=8)
    # Gate and flag.
    model.box((0.2, 0.04, 0.22), (0, -0.32, 0.37), pal["rock_dark"])
    model.beam((0, 0, 1.1), (0, 0, 1.42), 0.014, pal["rock_dark"])
    model.box((0.18, 0.012, 0.11), (0.1, 0, 1.35), pal["white"])
    return model.build()


def island_cake(pal):
    model = Model("IslandCake")
    shore(model, pal["pink"], seed=8)
    tiers = [(0.72, 0.3, 0.06, "cream"), (0.52, 0.28, 0.36, "pink"), (0.32, 0.26, 0.64, "cream")]
    for radius, height, z, colour in tiers:
        model.cone(radius, radius, height, (0, 0, z), pal[colour], segments=14)
        model.cone(radius * 1.06, radius * 1.02, 0.045, (0, 0, z + height - 0.01), pal["white"], segments=14)
        # Icing dripping down the side.
        for i in range(7):
            angle = 2 * math.pi * i / 7 + radius
            model.ball(0.07, (math.cos(angle) * radius * 0.99, math.sin(angle) * radius * 0.99, z + height - 0.05), pal["white"], scale=(1, 1, 1.5), detail=1)
    model.ball(0.11, (0, 0, 1.0), pal["cherry"], detail=2, smooth=True)
    model.beam((0, 0, 1.08), (0.05, 0, 1.2), 0.012, pal["grass_dark"])
    # Candles on the middle tier and lollipop trees on the shore.
    for i in range(5):
        angle = 2 * math.pi * i / 5 + 0.3
        x, y = math.cos(angle) * 0.42, math.sin(angle) * 0.42
        model.cone(0.022, 0.022, 0.16, (x, y, 0.66), pal["pink_dark"], segments=6)
        model.ball(0.03, (x, y, 0.85), pal["gold"], detail=1)
    for i, colour in enumerate(["cherry", "roof_orange", "water", "pink_dark"]):
        angle = 2 * math.pi * i / 4 + 0.8
        x, y = math.cos(angle) * 0.86, math.sin(angle) * 0.86
        model.cone(0.014, 0.014, 0.24, (x, y, 0.05), pal["white"], segments=5)
        model.ball(0.075, (x, y, 0.34), pal[colour], scale=(1, 0.5, 1), detail=1, rotation=(0, 0, angle))
    return model.build()


def island_wano(pal):
    model = Model("IslandWano")
    shore(model, pal["sand"], seed=9)
    model.lump(0.8, 0.2, (0, 0, 0.05), pal["grass"], seed=14)
    # A Fuji-shaped peak with a snow cap.
    model.cone(0.46, 0.13, 0.78, (-0.26, 0.24, 0.1), pal["fuji"], segments=9)
    model.cone(0.19, 0.08, 0.2, (-0.26, 0.24, 0.74), pal["snow"], segments=9)
    # A three-storey pagoda.
    x, y, z = 0.34, -0.12, 0.2
    for level, (width, height) in enumerate([(0.26, 0.14), (0.2, 0.12), (0.14, 0.11)]):
        model.box((width, width, height), (x, y, z + height / 2), pal["cream"])
        z += height
        model.cone(width * 1.05, width * 0.35, 0.07, (x, y, z), pal["roof_red"], segments=4, rotation=(0, 0, math.pi / 4))
        z += 0.07
    model.beam((x, y, z), (x, y, z + 0.14), 0.014, pal["gold"])
    # A torii gate on the shore.
    gate = Vector((0.1, -0.68, 0.08))
    model.beam(gate + Vector((-0.11, 0, 0)), gate + Vector((-0.11, 0, 0.26)), 0.028, pal["torii"])
    model.beam(gate + Vector((0.11, 0, 0)), gate + Vector((0.11, 0, 0.26)), 0.028, pal["torii"])
    model.beam(gate + Vector((-0.17, 0, 0.27)), gate + Vector((0.17, 0, 0.27)), 0.03, pal["torii"], width=0.04)
    model.beam(gate + Vector((-0.13, 0, 0.2)), gate + Vector((0.13, 0, 0.2)), 0.02, pal["torii"])
    for x, y in [(0.62, 0.3), (0.05, 0.56), (-0.5, -0.4), (0.6, -0.42)]:
        round_tree(model, pal, (x, y, 0.14), 0.1, leaf="blossom")
    return model.build()


def island_tech(pal):
    model = Model("IslandTech")
    shore(model, pal["stone"], seed=10)
    model.lump(0.74, 0.16, (0, 0, 0.05), pal["grass"], seed=15)
    # The egg, and the Labophase floating over it.
    model.ball(0.4, (0, 0, 0.5), pal["white"], scale=(1, 1, 1.25), detail=3, smooth=True)
    model.cone(0.42, 0.42, 0.03, (0, 0, 0.5), pal["glow"], segments=20)
    model.cone(0.5, 0.42, 0.08, (0.02, 0, 1.24), pal["white"], segments=18, smooth=True)
    model.cone(0.42, 0.3, 0.05, (0.02, 0, 1.19), pal["glow"], segments=18)
    model.ball(0.17, (0.02, 0, 1.33), pal["glow"], scale=(1, 1, 0.6), detail=2, smooth=True)
    for angle in (0.5, 2.6, 4.4):
        x, y = math.cos(angle) * 0.6, math.sin(angle) * 0.6
        model.cone(0.07, 0.06, 0.3, (x, y, 0.12), pal["white"], segments=8)
        model.ball(0.06, (x, y, 0.46), pal["glow"], detail=1)
    model.beam((0.02, 0, 1.4), (0.02, 0, 1.62), 0.012, pal["stone"])
    return model.build()


def island_tree(pal):
    model = Model("IslandTree")
    shore(model, pal["sand"], seed=11)
    model.lump(0.74, 0.16, (0, 0, 0.05), pal["grass"], seed=16)
    # One enormous tree, roots and all.
    model.cone(0.26, 0.15, 1.0, (0, 0, 0.1), pal["wood"], segments=8)
    for i in range(6):
        angle = 2 * math.pi * i / 6 + 0.3
        model.beam((math.cos(angle) * 0.12, math.sin(angle) * 0.12, 0.34), (math.cos(angle) * 0.46, math.sin(angle) * 0.46, 0.08), 0.07, pal["wood"])
    for x, y, z, r in [(0, 0, 1.25, 0.5), (0.36, 0.12, 1.08, 0.36), (-0.34, 0.16, 1.1, 0.36), (0.08, -0.38, 1.06, 0.34), (-0.1, 0.34, 1.34, 0.3), (0.2, -0.1, 1.5, 0.28)]:
        model.lump(r, r * 0.8, (x, y, z), pal["grass_dark"], seed=int(r * 100), flat_bottom=False)
    for x, y in [(0.58, -0.3), (-0.56, -0.28), (0.1, 0.62)]:
        house(model, pal, (x, y, 0.14), size=0.09, roof="roof_orange")
    return model.build()


ISLAND_BUILDERS = [
    island_tropical, island_town, island_snow, island_desert, island_rock, island_sky,
    island_city, island_fortress, island_cake, island_wano, island_tech, island_tree,
]


# --------------------------------------------------------------------------- #
# The Thousand Sunny
# --------------------------------------------------------------------------- #

def thousand_sunny(pal):
    model = Model("ThousandSunny")

    # Hull: cross-sections from bow (-Y) to stern (+Y): (y, half width, deck height, keel depth).
    stations = [
        (-1.22, 0.03, 0.46, 0.24),
        (-1.0, 0.2, 0.38, -0.06),
        (-0.62, 0.36, 0.3, -0.2),
        (0.0, 0.43, 0.27, -0.24),
        (0.6, 0.41, 0.29, -0.22),
        (1.0, 0.33, 0.38, -0.1),
        (1.2, 0.22, 0.46, 0.1),
    ]
    points = []
    for y, half, deck, keel in stations:
        bilge = keel + (deck - keel) * 0.42
        points += [(-half, y, deck), (-half * 0.86, y, bilge), (0, y, keel), (half * 0.86, y, bilge), (half, y, deck)]

    upper, lower, deck_faces = [], [], []
    for s in range(len(stations) - 1):
        a, b = s * 5, (s + 1) * 5
        upper += [(a, b, b + 1, a + 1), (a + 3, b + 3, b + 4, a + 4)]
        lower += [(a + 1, b + 1, b + 2, a + 2), (a + 2, b + 2, b + 3, a + 3)]
        deck_faces.append((a, a + 4, b + 4, b))
    last = (len(stations) - 1) * 5
    caps = [(0, 1, 2, 3, 4), (last + 4, last + 3, last + 2, last + 1, last)]

    model.faces(points, upper + caps, pal["wood_light"])
    model.faces(points, lower, pal["hull_red"])
    model.faces(points, deck_faces, pal["lawn"])

    # Bulwarks: a low rail fore and aft.
    model.box((0.74, 0.5, 0.07), (0, 0.9, 0.46), pal["wood_light"])
    model.box((0.52, 0.34, 0.06), (0, -0.92, 0.44), pal["wood_light"])

    # Cabins.
    model.box((0.58, 0.46, 0.26), (0, 0.82, 0.62), pal["cream"])
    model.box((0.66, 0.54, 0.05), (0, 0.82, 0.775), pal["roof_orange"])
    model.cone(0.17, 0.17, 0.16, (0, 0.86, 0.8), pal["cream"], segments=10)
    model.cone(0.2, 0.0, 0.13, (0, 0.86, 0.96), pal["roof_red"], segments=10)
    model.box((0.44, 0.3, 0.2), (0, -0.78, 0.52), pal["cream"])
    model.box((0.5, 0.36, 0.045), (0, -0.78, 0.64), pal["roof_orange"])

    # Nami's tangerine trees on the aft roof.
    for x in (-0.2, 0.2):
        model.ball(0.085, (x, 0.64, 0.9), pal["grass_dark"], detail=1)
        model.ball(0.025, (x + 0.05, 0.58, 0.93), pal["sun_orange"], detail=1)

    # Soldier Dock hatches on both sides.
    for side in (-1, 1):
        model.cone(0.13, 0.13, 0.03, (side * 0.415, 0.05, 0.12), pal["white"], segments=12, rotation=(0, side * math.pi / 2, 0))
        model.cone(0.08, 0.08, 0.035, (side * 0.42, 0.05, 0.12), pal["hull_red"], segments=12, rotation=(0, side * math.pi / 2, 0))

    # Masts, yards, crow's nest.
    model.cone(0.045, 0.032, 1.55, (0, 0.08, 0.27), pal["wood"], segments=8)
    model.cone(0.036, 0.026, 1.05, (0, -0.52, 0.3), pal["wood"], segments=8)
    model.beam((-0.5, 0.08, 1.5), (0.5, 0.08, 1.5), 0.035, pal["wood"])
    model.beam((-0.46, 0.08, 0.78), (0.46, 0.08, 0.78), 0.03, pal["wood"])
    model.beam((-0.34, -0.52, 1.18), (0.34, -0.52, 1.18), 0.03, pal["wood"])
    model.cone(0.13, 0.15, 0.1, (0, 0.08, 1.56), pal["cream"], segments=10)
    model.cone(0.17, 0.0, 0.14, (0, 0.08, 1.66), pal["roof_red"], segments=10)

    # Sails: grids bowed forward by the wind.
    def sail(width, top, bottom, y, belly):
        columns, rows = 6, 4
        grid = []
        for r in range(rows + 1):
            for c in range(columns + 1):
                u, v = c / columns, r / rows
                bulge = math.sin(math.pi * u) * math.sin(math.pi * (0.15 + 0.85 * v))
                grid.append(((u - 0.5) * width * (0.92 + 0.08 * v), y - belly * bulge, bottom + (top - bottom) * v))
        quads = []
        for r in range(rows):
            for c in range(columns):
                i = r * (columns + 1) + c
                quads.append((i, i + 1, i + columns + 2, i + columns + 1))
        model.faces(grid, quads, pal["sail"], smooth=True)

    sail(0.96, 1.47, 0.8, 0.05, 0.2)
    sail(0.66, 1.15, 0.62, -0.55, 0.15)

    # The mark on the mainsail: a skull in a straw hat, reduced to three shapes.
    front = 0.05 - 0.2 - 0.012
    model.cone(0.13, 0.13, 0.012, (0, front, 1.12), pal["black"], segments=14, rotation=(math.pi / 2, 0, 0))
    model.cone(0.07, 0.07, 0.014, (0, front - 0.004, 1.1), pal["white"], segments=12, rotation=(math.pi / 2, 0, 0))
    model.box((0.2, 0.014, 0.035), (0, front - 0.006, 1.165), pal["sun_yellow"])

    # Pennant at the masthead.
    model.beam((0, 0.08, 1.8), (0, 0.08, 1.98), 0.012, pal["wood"])
    model.box((0.012, 0.2, 0.11), (0, 0.19, 1.9), pal["black"])

    # The lion figurehead: a sun with a face.
    head = Vector((0, -1.36, 0.52))
    model.ball(0.2, head, pal["sun_yellow"], scale=(1, 0.8, 1), detail=2, smooth=True)
    for i in range(10):
        angle = 2 * math.pi * i / 10
        root = head + Vector((math.cos(angle) * 0.16, 0.04, math.sin(angle) * 0.16))
        tip = head + Vector((math.cos(angle) * 0.36, 0.06, math.sin(angle) * 0.36))
        model.beam(root, tip, 0.05, pal["sun_orange"], width=0.1)
    for x in (-0.07, 0.07):
        model.ball(0.026, head + Vector((x, -0.15, 0.05)), pal["black"], detail=1)
    model.ball(0.03, head + Vector((0, -0.17, -0.02)), pal["wood"], detail=1)
    model.beam(head + Vector((0, 0.1, -0.05)), Vector((0, -1.12, 0.4)), 0.1, pal["wood_light"])

    return model.build()


# --------------------------------------------------------------------------- #
# The Red Line
# --------------------------------------------------------------------------- #

def red_line(pal):
    """A rocky wall all the way round the globe, in the YZ plane."""
    model = Model("RedLine")
    segments = 300
    # Cross-section: (offset across the wall, height above the sea). Sheer sides, broken top.
    profile = [(-0.2, -0.1), (-0.19, 0.15), (-0.1, 0.23), (0.1, 0.23), (0.19, 0.15), (0.2, -0.1)]
    points = []
    for s in range(segments):
        angle = 2 * math.pi * s / segments
        outward = Vector((0, math.sin(angle), math.cos(angle)))
        for p, (across, height) in enumerate(profile):
            # Two scales of noise: long ridges, and crags a few segments wide.
            ridge = noise.noise(Vector((math.cos(angle) * 7.0, math.sin(angle) * 7.0, p * 1.9)))
            crag = noise.noise(Vector((math.cos(angle) * 46.0, math.sin(angle) * 46.0, p * 3.7 + 11.0)))
            if height > 0:
                height *= 1.0 + 0.5 * ridge + 0.55 * crag
            across += 0.03 * crag
            points.append(Vector((across, 0, 0)) + outward * (GLOBE_RADIUS + height))

    count = len(profile)
    top, sides = [], []
    for s in range(segments):
        a, b = s * count, ((s + 1) % segments) * count
        for p in range(count - 1):
            quad = (a + p, b + p, b + p + 1, a + p + 1)
            (top if p in (1, 2, 3) else sides).append(quad)
    model.faces(points, top, pal["red_rock"])
    model.faces(points, sides, pal["red_rock_dark"])
    return model.build()


def chart_latitude(y):
    """Ohara map y -> latitude in degrees inside the Grand Line band.

    Mirrors latitude() in components/world3d/globe-math.ts, so the buildings on the wall
    stand at the same latitude as their markers on the globe.
    """
    return -17.0 + 34.0 * (y - 22300.0) / (28300.0 - 22300.0)


def stand_on_wall(latitude_degrees, far_side, altitude):
    """Matrix that stands an upright model on the Red Line at a latitude.

    The near side (longitude 0, Reverse Mountain) is Blender -Y; the far side
    (longitude 180, Mary Geoise) is Blender +Y. Local +X stays east on the near side.
    """
    lat = math.radians(latitude_degrees)
    tilt = math.pi / 2 - lat
    if far_side:
        tilt = -tilt
    turn = Euler((tilt, 0, 0), "XYZ").to_matrix().to_4x4()
    outward = turn @ Vector((0, 0, 1))
    return Matrix.Translation(outward * (GLOBE_RADIUS + altitude)) @ turn


def reverse_mountain(pal):
    """Four currents run up it, and one runs down the east side into Paradise (+X)."""
    model = Model("ReverseMountain", base=stand_on_wall(chart_latitude(27440), far_side=False, altitude=0.08))
    model.cone(0.6, 0.12, 0.7, (0, 0, 0), pal["red_rock_dark"], segments=10)
    model.cone(0.25, 0.0, 0.3, (0, 0, 0.56), pal["snow"], segments=10)
    summit = Vector((0, 0, 0.68))
    # Local +Y is north and local +X is east once the mountain is stood on the globe.
    for dx, dy in [(-1, 1), (1, 1), (-1, -1), (1, -1)]:
        foot = Vector((dx * 0.43, dy * 0.43, 0.04))
        model.beam(foot, summit, 0.02, pal["water"], width=0.08)
    model.beam(summit, Vector((0.7, 0, 0.0)), 0.025, pal["water"], width=0.13)
    return model.build()


def mary_geoise(pal):
    """The Holy Land, on top of the wall on the far side of the world."""
    model = Model("MaryGeoise", base=stand_on_wall(chart_latitude(25616), far_side=True, altitude=0.2))
    model.box((0.36, 0.62, 0.06), (0, 0, 0.03), pal["stone"])
    model.box((0.2, 0.3, 0.26), (0, 0, 0.19), pal["white"])
    model.box((0.13, 0.16, 0.2), (0, 0, 0.42), pal["white"])
    model.cone(0.11, 0.0, 0.2, (0, 0, 0.52), pal["roof_blue"], segments=6)
    for x, y in [(-0.13, -0.22), (0.13, -0.22), (-0.13, 0.22), (0.13, 0.22)]:
        model.cone(0.045, 0.04, 0.34, (x, y, 0.06), pal["white"], segments=8)
        model.cone(0.06, 0.0, 0.13, (x, y, 0.4), pal["roof_blue"], segments=8)
    model.beam((0, 0, 0.72), (0, 0, 0.9), 0.012, pal["gold"])
    return model.build()


# --------------------------------------------------------------------------- #
# Scenes, export, previews
# --------------------------------------------------------------------------- #

def fresh_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return palette()


def export(filename):
    os.makedirs(MODELS_DIR, exist_ok=True)
    path = os.path.join(MODELS_DIR, filename)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_yup=True, export_apply=True)
    print(f"[build_assets] wrote {path} ({os.path.getsize(path) / 1024:.0f} KB)")


def render_preview(filename, camera_position, look_at, ortho_scale=None, resolution=(1100, 720)):
    """Light the current scene and render it to tools/blender/previews/."""
    scene = bpy.context.scene

    camera_data = bpy.data.cameras.new("PreviewCamera")
    if ortho_scale:
        camera_data.type = "ORTHO"
        camera_data.ortho_scale = ortho_scale
    camera = bpy.data.objects.new("PreviewCamera", camera_data)
    scene.collection.objects.link(camera)
    camera.location = Vector(camera_position)
    camera.rotation_euler = (Vector(look_at) - Vector(camera_position)).to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera

    sun_data = bpy.data.lights.new("PreviewSun", "SUN")
    sun_data.energy = 3.6
    sun = bpy.data.objects.new("PreviewSun", sun_data)
    scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(52), math.radians(8), math.radians(28))

    world = bpy.data.worlds.new("PreviewWorld")
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = hex_to_linear("#7fb6d8")
    background.inputs["Strength"].default_value = 1.1
    scene.world = world

    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = False
    scene.render.resolution_x, scene.render.resolution_y = resolution
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "Standard"

    os.makedirs(PREVIEW_DIR, exist_ok=True)
    scene.render.filepath = os.path.join(PREVIEW_DIR, filename)
    bpy.ops.render.render(write_still=True)
    print(f"[build_assets] rendered {scene.render.filepath}")


def build_ship():
    pal = fresh_scene()
    thousand_sunny(pal)
    export("thousand-sunny.glb")
    if WANT_PREVIEWS:
        render_preview("thousand-sunny.png", (3.4, -3.6, 2.3), (0, -0.05, 0.75))


def build_islands():
    pal = fresh_scene()
    islands = [build(pal) for build in ISLAND_BUILDERS]
    export("islands.glb")
    if WANT_PREVIEWS:
        # Lay the variants out in a grid; the exported file keeps them all at the origin.
        columns = 4
        for i, island in enumerate(islands):
            island.location = ((i % columns) * 2.7, -(i // columns) * 2.7, 0)
        centre = ((columns - 1) * 1.35, -2.7, 0.3)
        render_preview("islands.png", (centre[0] + 5.5, centre[1] - 11.5, 9.5), centre, resolution=(1400, 1000))


def build_red_line():
    pal = fresh_scene()
    red_line(pal)
    reverse_mountain(pal)
    mary_geoise(pal)
    export("red-line.glb")
    if WANT_PREVIEWS:
        # A stand-in sea so the wall reads against something.
        sea = bpy.data.meshes.new("PreviewSea")
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=32, radius=GLOBE_RADIUS)
        for face in bm.faces:
            face.smooth = True
        bm.to_mesh(sea)
        bm.free()
        sea.materials.append(material("PreviewSeaBlue", "#17618a", roughness=0.4))
        bpy.context.scene.collection.objects.link(bpy.data.objects.new("PreviewSea", sea))
        render_preview("red-line.png", (7.5, -11.5, 4.0), (0, -1.5, 0.0))
        bpy.context.scene.camera.location = Vector((2.2, -8.0, 1.2))
        bpy.context.scene.camera.rotation_euler = (Vector((0, -5.0, 0.0)) - Vector((2.2, -8.0, 1.2))).to_track_quat("-Z", "Y").to_euler()
        bpy.context.scene.render.filepath = os.path.join(PREVIEW_DIR, "reverse-mountain.png")
        bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    build_ship()
    build_islands()
    build_red_line()
    print("[build_assets] done")
