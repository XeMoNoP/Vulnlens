"""
S1000RR_Night - procedural Blender scene rebuilding the reference photo
(reference/reference.png): rider on an M-livery superbike at night, wet street.

Run (background build + save + optional render):
  blender -b -P scripts/build_scene.py -- --render preview|final|none

Everything is rebuilt from scratch each run, so this script is the source of truth.
Hierarchy (all named, animation friendly):
  BIKE_Root (empty, origin = rear tyre contact patch, +Y = bike forward)
    Wheel_Rear / Wheel_Front (origin at axle, spin around local X)
    Swingarm (origin at pivot), Frame, Engine, Exhaust, Body_*, Cockpit, TailLight...
    RIDER_Root (empty) -> Rider_Shirt, Rider_Jeans, Rider_Arms, Rider_Gloves,
                          Rider_Boots, Rider_Helmet (origin at head centre)
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
BLEND_PATH = os.path.join(PROJ, "S1000RR_Night.blend")
RENDER_DIR = os.path.join(PROJ, "renders")

# ---------------------------------------------------------------- camera model
REF_W, REF_H = 941, 1672          # reference pixel grid used for placement
CAM_LOC = Vector((0.0, 0.0, 1.40))
CAM_PITCH = 6.5                   # degrees down
CAM_ROLL = 0.0
LENS = 50.0
SENSOR_H = 36.0                   # vertical sensor fit (portrait)
SENSOR_W = SENSOR_H * 1080 / 1920

CAM_ROT = Euler((math.radians(90 - CAM_PITCH), math.radians(CAM_ROLL), 0.0)).to_matrix()


def px_dir(u, v):
    d = Vector(((u / REF_W - 0.5) * SENSOR_W / LENS, (0.5 - v / REF_H) * SENSOR_H / LENS, -1.0))
    return (CAM_ROT @ d).normalized()


def px_ground(u, v, h=0.0):
    d = px_dir(u, v)
    return CAM_LOC + d * ((h - CAM_LOC.z) / d.z)


def px_world(u, v, dist):
    """Point on the pixel ray at horizontal distance `dist` from the camera."""
    d = px_dir(u, v)
    return CAM_LOC + d * (dist / math.hypot(d.x, d.y))


def px_size(px, dist):
    """Metres covered by `px` reference pixels at horizontal distance `dist`."""
    return px * dist * (SENSOR_H / LENS) / REF_H


# ---------------------------------------------------------------- reset
def reset():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras,
                 bpy.data.node_groups, bpy.data.textures, bpy.data.worlds):
        for d in list(coll):
            coll.remove(d)


def collection(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or bpy.context.scene.collection).children.link(c)
    return c


# ---------------------------------------------------------------- materials
def _tree(m):
    try:
        m.use_nodes = True
    except Exception:
        pass
    return m.node_tree


def _principled(nt):
    for n in nt.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            return n
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    out = next((n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'), None) or nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(b.outputs[0], out.inputs[0])
    return b


def mat(name, color, rough=0.5, metal=0.0, coat=0.0, coat_rough=0.03, spec=0.5, sheen=0.0):
    m = bpy.data.materials.new(name)
    nt = _tree(m)
    b = _principled(nt)
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Coat Roughness"].default_value = coat_rough
    b.inputs["Specular IOR Level"].default_value = spec
    b.inputs["Sheen Weight"].default_value = sheen
    m.diffuse_color = (*color, 1)
    return m


def emit(name, color, strength):
    m = bpy.data.materials.new(name)
    nt = _tree(m)
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    e = nt.nodes.new('ShaderNodeEmission')
    e.inputs[0].default_value = (*color, 1)
    e.inputs[1].default_value = strength
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(e.outputs[0], o.inputs[0])
    m.diffuse_color = (*color, 1)
    return m


def livery(name, base, bands, direction, offset, scale, rough=0.18, coat=1.0, metal=0.0):
    """Painted stripes: t = (dot(objcoord, direction) + offset) * scale -> constant ramp."""
    m = mat(name, base, rough=rough, coat=coat, metal=metal)
    nt = m.node_tree
    b = _principled(nt)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    dp = nt.nodes.new('ShaderNodeVectorMath'); dp.operation = 'DOT_PRODUCT'
    dp.inputs[1].default_value = direction
    nt.links.new(tc.outputs['Object'], dp.inputs[0])
    ma = nt.nodes.new('ShaderNodeMath'); ma.operation = 'MULTIPLY_ADD'
    ma.inputs[1].default_value = scale
    ma.inputs[2].default_value = offset * scale
    nt.links.new(dp.outputs['Value'], ma.inputs[0])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    els = ramp.color_ramp.elements
    els[0].position = 0.0; els[0].color = (*base, 1)
    els[1].position = 1.0; els[1].color = (*base, 1)
    for pos, col in bands:
        e = els.new(pos); e.color = (*col, 1)
    nt.links.new(ma.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], b.inputs["Base Color"])
    return m


def asphalt():
    m = mat("MAT_WetAsphalt", (0.03, 0.03, 0.032), rough=0.55, coat=1.0, coat_rough=0.2)
    nt = m.node_tree
    b = _principled(nt)
    L = nt.links
    tc = nt.nodes.new('ShaderNodeTexCoord')
    # large scale puddle mask
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.35
    nz.inputs['Detail'].default_value = 6; nz.inputs['Roughness'].default_value = 0.6
    L.new(tc.outputs['Object'], nz.inputs['Vector'])
    pm = nt.nodes.new('ShaderNodeMapRange')
    pm.inputs['From Min'].default_value = 0.45; pm.inputs['From Max'].default_value = 0.62
    L.new(nz.outputs['Fac'], pm.inputs['Value'])
    # coat roughness: puddles mirror-like, rest streaky wet
    cr = nt.nodes.new('ShaderNodeMapRange')
    cr.inputs['To Min'].default_value = 0.14; cr.inputs['To Max'].default_value = 0.05
    L.new(pm.outputs['Result'], cr.inputs['Value'])
    L.new(cr.outputs['Result'], b.inputs['Coat Roughness'])
    # base colour variation (aggregate)
    vo = nt.nodes.new('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = 140
    L.new(tc.outputs['Object'], vo.inputs['Vector'])
    bc = nt.nodes.new('ShaderNodeMapRange')
    bc.inputs['To Min'].default_value = 0.008; bc.inputs['To Max'].default_value = 0.04
    L.new(vo.outputs['Distance'], bc.inputs['Value'])
    L.new(bc.outputs['Result'], b.inputs['Base Color'])
    # micro bump of the stones (coat keeps the geometric normal = water film)
    nz2 = nt.nodes.new('ShaderNodeTexNoise'); nz2.inputs['Scale'].default_value = 220
    nz2.inputs['Detail'].default_value = 3
    L.new(tc.outputs['Object'], nz2.inputs['Vector'])
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.6
    bump.inputs['Distance'].default_value = 0.004
    L.new(vo.outputs['Distance'], bump.inputs['Height'])
    L.new(bump.outputs['Normal'], b.inputs['Normal'])
    # subtle undulation for the water film so reflections wobble & streak
    bump2 = nt.nodes.new('ShaderNodeBump'); bump2.inputs['Strength'].default_value = 0.45
    bump2.inputs['Distance'].default_value = 0.003
    L.new(vo.outputs['Distance'], bump2.inputs['Height'])
    L.new(bump2.outputs['Normal'], b.inputs['Coat Normal'])
    return m


# ---------------------------------------------------------------- mesh builder
def _faces_of(verts):
    return {f for v in verts for f in v.link_faces}


class MB:
    def __init__(self):
        self.bm = bmesh.new()
        self.mats = []

    def _set(self, verts, m, smooth=True):
        if m not in self.mats:
            self.mats.append(m)
        i = self.mats.index(m)
        for f in _faces_of(verts):
            f.material_index = i
            f.smooth = smooth

    def cyl(self, a, b, r1, r2=None, m=None, segs=24, smooth=True):
        a, b = Vector(a), Vector(b)
        d = b - a
        rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        mtx = Matrix.Translation((a + b) / 2) @ rot
        r = bmesh.ops.create_cone(self.bm, cap_ends=True, segments=segs, radius1=r1,
                                  radius2=r1 if r2 is None else r2, depth=d.length, matrix=mtx)
        self._set(r['verts'], m, smooth)
        return r['verts']

    def box(self, c, size, m, rot=(0, 0, 0), smooth=False):
        mtx = Matrix.Translation(c) @ Euler([math.radians(x) for x in rot]).to_matrix().to_4x4() \
            @ Matrix.Diagonal((*size, 1))
        r = bmesh.ops.create_cube(self.bm, size=1.0, matrix=mtx)
        self._set(r['verts'], m, smooth)

    def beam(self, a, b, w, h, m, smooth=False):
        a, b = Vector(a), Vector(b)
        d = b - a
        rot = Vector((0, 1, 0)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        mtx = Matrix.Translation((a + b) / 2) @ rot @ Matrix.Diagonal((w, d.length, h, 1))
        r = bmesh.ops.create_cube(self.bm, size=1.0, matrix=mtx)
        self._set(r['verts'], m, smooth)

    def sphere(self, c, r, m, scale=(1, 1, 1), rot=(0, 0, 0), segs=24):
        mtx = Matrix.Translation(c) @ Euler([math.radians(x) for x in rot]).to_matrix().to_4x4() \
            @ Matrix.Diagonal((*scale, 1))
        res = bmesh.ops.create_uvsphere(self.bm, u_segments=segs, v_segments=max(8, segs // 2),
                                        radius=r, matrix=mtx)
        self._set(res['verts'], m)

    def torus(self, c, R, r, m, axis='X', axial=1.0, segs=64, rsegs=16, arc=(0, 360)):
        """Torus around `axis`; `axial` scales the tube along the axis (tyre profile)."""
        bm = self.bm
        rings = []
        full = (arc[1] - arc[0]) >= 360
        n = segs if full else segs + 1
        for i in range(n):
            a = math.radians(arc[0] + (arc[1] - arc[0]) * i / segs)
            ring = []
            for j in range(rsegs):
                t = 2 * math.pi * j / rsegs
                rad = R + r * math.cos(t)
                ax = r * math.sin(t) * axial
                p = Vector((ax, rad * math.cos(a), rad * math.sin(a)))  # axis X
                if axis == 'Y':
                    p = Vector((p.y, p.x, p.z))
                elif axis == 'Z':
                    p = Vector((p.y, p.z, p.x))
                ring.append(bm.verts.new(Vector(c) + p))
            rings.append(ring)
        verts = [v for ring in rings for v in ring]
        rng = range(len(rings)) if full else range(len(rings) - 1)
        for i in rng:
            r0, r1 = rings[i], rings[(i + 1) % len(rings)]
            for j in range(rsegs):
                bm.faces.new((r0[j], r1[j], r1[(j + 1) % rsegs], r0[(j + 1) % rsegs]))
        self._set(verts, m)

    def loft(self, sections, m, caps=True, smooth=True):
        bm = self.bm
        rings = [[bm.verts.new(p) for p in s] for s in sections]
        n = len(rings[0])
        for a, b in zip(rings, rings[1:]):
            for j in range(n):
                bm.faces.new((a[j], b[j], b[(j + 1) % n], a[(j + 1) % n]))
        if caps:
            bm.faces.new(list(reversed(rings[0])))
            bm.faces.new(rings[-1])
        self._set([v for r in rings for v in r], m, smooth)

    def build(self, name, coll, parent=None, loc=(0, 0, 0), subsurf=0, bevel=0.0, flip=False):
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        me = bpy.data.meshes.new(name)
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(m)
        ob = bpy.data.objects.new(name, me)
        coll.objects.link(ob)
        if parent:
            ob.parent = parent
        ob.location = loc
        if bevel:
            md = ob.modifiers.new("Bevel", 'BEVEL'); md.width = bevel; md.segments = 2
            md.limit_method = 'ANGLE'; md.harden_normals = False
        if subsurf:
            md = ob.modifiers.new("Subsurf", 'SUBSURF'); md.levels = 1; md.render_levels = subsurf
        return ob


def sec(y, cz, hw, hh, n=16, p=2.6, cx=0.0, top=1.0):
    """Super-ellipse cross section in XZ at height y. `top` scales the upper half."""
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        c, s = math.cos(t), math.sin(t)
        x = hw * math.copysign(abs(c) ** (2 / p), c)
        z = hh * math.copysign(abs(s) ** (2 / p), s) * (top if s > 0 else 1.0)
        pts.append(Vector((cx + x, y, cz + z)))
    return pts


def empty(name, coll, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), size=0.3):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = size
    e.empty_display_type = 'PLAIN_AXES'
    coll.objects.link(e)
    e.parent = parent
    e.location = loc
    e.rotation_euler = rot
    return e


def skin_object(name, coll, chains, m, parent=None, subsurf=2):
    """chains: list of lists of (point, radius). Consecutive points joined; shared
    points (same tuple) are merged so branches connect."""
    bm = bmesh.new()
    sk = bm.verts.layers.skin.verify()
    lookup = {}
    first = True
    for chain in chains:
        prev = None
        for p, r in chain:
            key = tuple(round(x, 4) for x in p)
            v = lookup.get(key)
            if v is None:
                v = bm.verts.new(p)
                rr = r if isinstance(r, tuple) else (r, r)
                v[sk].radius = rr
                if first:
                    v[sk].use_root = True
                    first = False
                lookup[key] = v
            if prev is not None and prev is not v:
                try:
                    bm.edges.new((prev, v))
                except ValueError:
                    pass
            prev = v
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    ob.parent = parent
    ob.modifiers.new("Skin", 'SKIN').use_smooth_shade = True
    s = ob.modifiers.new("Subsurf", 'SUBSURF'); s.levels = 1; s.render_levels = subsurf
    return ob


def point_at(ob, target):
    d = Vector(target) - ob.location
    ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def light(name, coll, kind, loc, energy, color, size=0.5, target=None, spot=None, parent=None):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = energy
    ld.color = color
    if kind == 'AREA':
        ld.size = size
    else:
        ld.shadow_soft_size = size
    if kind == 'SPOT' and spot:
        ld.spot_size = math.radians(spot); ld.spot_blend = 0.8
    ob = bpy.data.objects.new(name, ld)
    coll.objects.link(ob)
    ob.parent = parent
    ob.location = loc
    if target is not None:
        point_at(ob, target)
    return ob


# ================================================================= BUILD
def build():
    reset()
    scn = bpy.context.scene
    scn.name = "S1000RR_Night"

    C_CAM = collection("CAMERA")
    C_BIKE = collection("BIKE")
    C_RIDER = collection("RIDER")
    C_ENV = collection("ENVIRONMENT")
    C_ROAD = collection("ENV_Road", C_ENV)
    C_BG = collection("ENV_Background", C_ENV)
    C_PPL = collection("ENV_People_Traffic", C_ENV)
    C_LGT = collection("LIGHTS")

    # ---------------- materials
    M = {}
    M['paint_black'] = mat("MAT_Paint_Black", (0.008, 0.008, 0.01), rough=0.25, coat=1.0, coat_rough=0.02)
    M['matte_black'] = mat("MAT_Plastic_MatteBlack", (0.012, 0.012, 0.013), rough=0.55)
    M['rubber'] = mat("MAT_Tyre_Rubber", (0.014, 0.014, 0.015), rough=0.5, spec=0.4)
    M['rim'] = mat("MAT_Rim_Black", (0.01, 0.01, 0.012), rough=0.3, metal=0.3, coat=0.6)
    M['pin_red'] = mat("MAT_Pin_Red", (0.6, 0.02, 0.02), rough=0.3, coat=1)
    M['pin_blue'] = mat("MAT_Pin_Blue", (0.02, 0.2, 0.75), rough=0.3, coat=1)
    M['disc'] = mat("MAT_BrakeDisc", (0.6, 0.6, 0.62), rough=0.28, metal=1.0)
    M['alu'] = mat("MAT_Alu_Dark", (0.3, 0.3, 0.32), rough=0.35, metal=1.0)
    M['engine'] = mat("MAT_Engine", (0.05, 0.05, 0.055), rough=0.4, metal=0.8)
    M['ti'] = mat("MAT_Exhaust_Ti", (0.38, 0.36, 0.34), rough=0.3, metal=1.0)
    M['carbon'] = mat("MAT_Carbon", (0.02, 0.02, 0.022), rough=0.2, coat=1.0)
    M['chrome'] = mat("MAT_MirrorGlass", (0.9, 0.9, 0.9), rough=0.02, metal=1.0)
    M['seat'] = mat("MAT_Seat", (0.01, 0.01, 0.01), rough=0.7)
    M['tail_light'] = emit("MAT_TailLight_Emit", (1.0, 0.012, 0.006), 80.0)
    M['plate_light'] = emit("MAT_PlateLight_Emit", (0.55, 0.7, 1.0), 30.0)
    M['indicator'] = mat("MAT_Indicator_Lens", (0.4, 0.2, 0.05), rough=0.1, coat=1)
    stripes = [(0.40, (0.02, 0.32, 0.9)), (0.47, (0.05, 0.05, 0.38)), (0.54, (0.7, 0.02, 0.03)), (0.61, (0.008, 0.008, 0.01))]
    M['livery_front'] = livery("MAT_Livery_Front", (0.008, 0.008, 0.01), stripes, (0.0, -0.6, 1.0), 0.165, 2.2)
    M['livery_tail'] = livery("MAT_Livery_Tail", (0.008, 0.008, 0.01),
                              [(0.40, (0.02, 0.32, 0.9)), (0.55, (0.008, 0.008, 0.01))],
                              (0.0, 0.25, 1.0), -0.70, 2.6)
    # rider
    M['shirt'] = livery("MAT_Rider_Tee", (0.006, 0.006, 0.007),
                        [(0.22, (0.75, 0.75, 0.78)), (0.24, (0.03, 0.2, 0.68)), (0.44, (0.05, 0.06, 0.28)), (0.52, (0.65, 0.03, 0.05)),
                         (0.57, (0.006, 0.006, 0.007))],
                        (-2.0, 0.0, 1.0), -1.30, 2.4, rough=0.85, coat=0.0)
    _principled(M['shirt'].node_tree).inputs['Sheen Weight'].default_value = 0.05
    _principled(M['shirt'].node_tree).inputs['Specular IOR Level'].default_value = 0.2
    M['jeans'] = mat("MAT_Rider_Jeans", (0.30, 0.32, 0.36), rough=0.85, sheen=0.4)
    M['skin'] = mat("MAT_Rider_Skin", (0.2, 0.11, 0.07), rough=0.5)
    M['glove'] = mat("MAT_Rider_Glove", (0.015, 0.015, 0.015), rough=0.6)
    M['boot_white'] = mat("MAT_Boot_White", (0.75, 0.75, 0.76), rough=0.3, coat=0.5)
    M['boot_black'] = mat("MAT_Boot_Black", (0.012, 0.012, 0.012), rough=0.45)
    M['boot_red'] = mat("MAT_Boot_Red", (0.6, 0.02, 0.02), rough=0.4)
    M['helmet'] = livery("MAT_Helmet", (0.006, 0.006, 0.008),
                         [(0.18, (0.65, 0.02, 0.03)), (0.30, (0.006, 0.006, 0.008))],
                         (0.0, -0.6, 1.0), 0.12, 2.5, rough=0.12, coat=1.0)
    M['visor'] = mat("MAT_Visor", (0.01, 0.01, 0.015), rough=0.02, metal=0.6, coat=1)

    # ---------------- camera
    cd = bpy.data.cameras.new("CAM_Main")
    cd.lens = LENS
    cd.sensor_fit = 'VERTICAL'
    cd.sensor_height = SENSOR_H
    cd.clip_start = 0.05
    cd.clip_end = 500
    cam = bpy.data.objects.new("CAM_Main", cd)
    C_CAM.objects.link(cam)
    cam.location = CAM_LOC
    cam.rotation_euler = Euler((math.radians(90 - CAM_PITCH), math.radians(CAM_ROLL), 0))
    scn.camera = cam

    # ---------------- bike root
    root_loc = px_ground(330, 1322)
    BIKE_YAW = -30.0
    bike = empty("BIKE_Root", C_BIKE, loc=root_loc, rot=(0, 0, math.radians(BIKE_YAW)), size=0.6)
    REAR_AX = Vector((0, 0, 0.33))
    FRONT_AX = Vector((0, 1.44, 0.30))

    def wheel(name, ax, tyre_R, tyre_w, rim_r, discs):
        mb = MB()
        tube_r = (tyre_R - rim_r) / 2 + 0.004
        mb.torus((0, 0, 0), tyre_R - tube_r, tube_r, M['rubber'], axis='X',
                 axial=(tyre_w / 2) / tube_r, segs=96, rsegs=20)
        mb.torus((0, 0, 0), rim_r - 0.012, 0.014, M['rim'], axis='X', axial=4.6, segs=72, rsegs=8)
        for sx in (1, -1):
            mb.torus((sx * 0.062, 0, 0), rim_r - 0.004, 0.0035, M['pin_red'], axis='X', segs=72, rsegs=6)
            mb.torus((sx * 0.062, 0, 0), rim_r - 0.014, 0.0035, M['pin_blue'], axis='X', segs=72, rsegs=6)
        mb.cyl((-0.08, 0, 0), (0.08, 0, 0), 0.055, m=M['rim'])
        for i in range(5):
            a = 2 * math.pi * i / 5
            for off in (-0.13, 0.13):
                aa = a + off
                p0 = Vector((0.0, 0.05 * math.cos(a), 0.05 * math.sin(a)))
                p1 = Vector((0.0, (rim_r - 0.02) * math.cos(aa), (rim_r - 0.02) * math.sin(aa)))
                mb.beam(p0, p1, 0.035, 0.016, M['rim'])
        for dx in discs:
            mb.cyl((dx - 0.0025, 0, 0), (dx + 0.0025, 0, 0), 0.16 if abs(dx) > 0.09 else 0.11, m=M['disc'], segs=48)
            mb.cyl((dx - 0.004, 0, 0), (dx + 0.004, 0, 0), 0.07, m=M['alu'], segs=24)
        return mb.build(name, C_BIKE, bike, ax)

    wheel("Wheel_Rear", REAR_AX, 0.33, 0.19, 0.216, discs=[0.088])
    wheel("Wheel_Front", FRONT_AX, 0.30, 0.12, 0.216, discs=[0.095, -0.095])

    # swingarm (origin at pivot)
    PIVOT = Vector((0, 0.60, 0.44))
    mb = MB()
    for sx in (1, -1):
        mb.beam(Vector((sx * 0.12, 0, 0)), REAR_AX - PIVOT + Vector((sx * 0.125, 0.02, 0)), 0.045, 0.10, M['alu'])
        mb.box(REAR_AX - PIVOT + Vector((sx * 0.125, 0.0, 0)), (0.05, 0.07, 0.07), M['alu'])
    mb.beam(Vector((0.12, -0.05, -0.05)), REAR_AX - PIVOT + Vector((0.125, 0.12, -0.07)), 0.03, 0.05, M['alu'])
    mb.cyl((-0.15, 0, 0), (0.15, 0, 0), 0.03, m=M['alu'])
    # rear caliper + hugger
    mb.box(REAR_AX - PIVOT + Vector((0.10, 0.06, 0.08)), (0.03, 0.09, 0.05), M['alu'], rot=(-35, 0, 0))
    mb.torus(REAR_AX - PIVOT, 0.37, 0.012, M['matte_black'], axis='X', axial=8.0, segs=24, rsegs=6, arc=(40, 120))
    mb.build("Swingarm", C_BIKE, bike, PIVOT, bevel=0.006)

    # frame + engine
    mb = MB()
    for sx in (1, -1):
        mb.beam((sx * 0.10, 1.24, 0.84), (sx * 0.15, 0.66, 0.58), 0.05, 0.13, M['alu'])
        mb.beam((sx * 0.15, 0.66, 0.58), (sx * 0.14, 0.62, 0.38), 0.05, 0.10, M['alu'])
        mb.beam((sx * 0.09, 0.66, 0.66), (sx * 0.07, 0.10, 0.82), 0.025, 0.03, M['alu'])
    mb.cyl((0, 1.20, 0.72), (0, 1.29, 0.95), 0.045, m=M['alu'])
    mb.build("Frame", C_BIKE, bike, bevel=0.005)

    mb = MB()
    mb.box((0, 0.95, 0.42), (0.33, 0.52, 0.30), M['engine'])
    mb.box((0, 1.10, 0.64), (0.36, 0.24, 0.20), M['engine'], rot=(-28, 0, 0))
    mb.box((0, 0.98, 0.24), (0.26, 0.40, 0.10), M['engine'])
    mb.cyl((0.165, 0.86, 0.38), (0.19, 0.86, 0.38), 0.10, m=M['alu'], segs=32)
    mb.cyl((0.165, 1.06, 0.30), (0.185, 1.06, 0.30), 0.06, m=M['alu'], segs=24)
    mb.box((0.0, 0.70, 0.62), (0.22, 0.14, 0.18), M['matte_black'])  # airbox/battery area
    mb.box((0.12, 0.62, 0.40), (0.04, 0.10, 0.18), M['alu'])  # rear-set hanger
    mb.cyl((0.12, 0.60, 0.34), (0.20, 0.60, 0.34), 0.012, m=M['alu'])  # right peg
    mb.box((-0.12, 0.62, 0.40), (0.04, 0.10, 0.18), M['alu'])
    mb.cyl((-0.12, 0.60, 0.34), (-0.20, 0.60, 0.34), 0.012, m=M['alu'])
    mb.box((0.0, 0.42, 0.55), (0.10, 0.08, 0.30), M['matte_black'], rot=(25, 0, 0))  # shock
    mb.build("Engine", C_BIKE, bike, bevel=0.012)

    # exhaust (right side, short underslung-side can, outlet faces rear)
    mb = MB()
    mb.cyl((0.08, 1.30, 0.40), (0.12, 1.24, 0.16), 0.024, m=M['ti'])
    mb.cyl((0.12, 1.24, 0.16), (0.12, 0.88, 0.14), 0.035, m=M['ti'])
    mb.cyl((0.12, 0.88, 0.14), (0.16, 0.66, 0.26), 0.04, m=M['ti'])
    mb.cyl((0.165, 0.66, 0.27), (0.20, 0.34, 0.44), 0.07, 0.058, m=M['ti'], segs=6)
    mb.cyl((0.20, 0.34, 0.44), (0.205, 0.31, 0.455), 0.058, 0.05, m=M['carbon'], segs=6)
    mb.cyl((0.205, 0.30, 0.46), (0.208, 0.29, 0.465), 0.03, m=M['matte_black'], segs=16)
    mb.beam((0.13, 0.50, 0.58), (0.19, 0.42, 0.43), 0.02, 0.03, M['alu'])
    mb.build("Exhaust", C_BIKE, bike)

    # bodywork: tail
    tail = [sec(0.62, 0.80, 0.15, 0.10), sec(0.42, 0.84, 0.13, 0.085), sec(0.22, 0.875, 0.10, 0.07),
            sec(0.02, 0.905, 0.075, 0.05), sec(-0.12, 0.925, 0.055, 0.032)]
    mb = MB(); mb.loft(tail, M['livery_tail'])
    mb.build("Body_Tail", C_BIKE, bike, subsurf=2)
    mb = MB()
    mb.box((0, -0.128, 0.918), (0.11, 0.02, 0.028), M['tail_light'], smooth=False)
    mb.build("TailLight", C_BIKE, bike)
    # licence plate hanger + lights
    mb = MB()
    mb.beam((0, -0.04, 0.87), (0, -0.17, 0.80), 0.05, 0.016, M['matte_black'])
    mb.box((0, -0.175, 0.79), (0.06, 0.02, 0.03), M['matte_black'])
    mb.box((0, -0.186, 0.795), (0.035, 0.004, 0.008), M['plate_light'])
    for sx in (1, -1):
        mb.cyl((sx * 0.02, -0.16, 0.80), (sx * 0.07, -0.16, 0.805), 0.005, m=M['matte_black'])
        mb.box((sx * 0.075, -0.16, 0.805), (0.025, 0.018, 0.013), M['indicator'])
    mb.build("PlateHanger", C_BIKE, bike, bevel=0.003)
    # seat
    mb = MB(); mb.loft([sec(0.42, 0.86, 0.12, 0.04), sec(0.62, 0.85, 0.15, 0.045), sec(0.84, 0.86, 0.16, 0.04)], M['seat'])
    mb.build("Seat", C_BIKE, bike, subsurf=2)
    # tank + fairing
    mb = MB()
    mb.loft([sec(0.80, 0.89, 0.17, 0.08), sec(1.0, 0.95, 0.21, 0.13), sec(1.22, 0.94, 0.21, 0.15),
             sec(1.45, 0.90, 0.18, 0.16), sec(1.68, 0.84, 0.12, 0.14), sec(1.80, 0.80, 0.06, 0.08)], M['livery_front'])
    mb.loft([sec(0.92, 0.62, 0.18, 0.16, p=3.0), sec(1.20, 0.60, 0.20, 0.20, p=3.0),
             sec(1.50, 0.62, 0.17, 0.18, p=3.0), sec(1.66, 0.66, 0.10, 0.12)], M['livery_front'])
    mb.build("Body_Front", C_BIKE, bike, subsurf=2)
    # fork, clip-ons, mirror
    mb = MB()
    rake = Vector((0, -math.sin(math.radians(24)), math.cos(math.radians(24))))
    for sx in (1, -1):
        base = FRONT_AX + Vector((sx * 0.10, 0, 0))
        mb.cyl(base, base + rake * 0.62, 0.028, m=M['ti'])
        mb.cyl(base - rake * 0.02, base + rake * 0.30, 0.04, m=M['matte_black'])
        mb.cyl((sx * 0.10, 1.20, 0.92), (sx * 0.33, 1.17, 0.96), 0.014, m=M['matte_black'])
        mb.cyl((sx * 0.25, 1.175, 0.95), (sx * 0.37, 1.165, 0.965), 0.019, m=M['matte_black'])
    mb.torus(FRONT_AX, 0.33, 0.01, M['matte_black'], axis='X', axial=6, segs=24, rsegs=6, arc=(60, 130))
    # mirrors on stalks
    for sx in (1, -1):
        mb.cyl((sx * 0.28, 1.19, 0.97), (sx * 0.35, 1.17, 1.13), 0.009, m=M['matte_black'])
        mb.sphere((sx * 0.37, 1.17, 1.15), 0.06, M['matte_black'], scale=(1.3, 0.45, 0.75), rot=(0, 0, sx * -10))
        mb.sphere((sx * 0.37, 1.15, 1.15), 0.052, M['chrome'], scale=(1.3, 0.2, 0.7), rot=(0, 0, sx * -10))
    mb.build("Cockpit", C_BIKE, bike)

    # ---------------- rider (child of bike)
    rider = empty("RIDER_Root", C_RIDER, parent=bike, size=0.4)
    P0, P3 = (0, 0.48, 0.97), (0, 0.75, 1.32)
    SR, SL = (0.21, 0.77, 1.31), (-0.21, 0.77, 1.31)
    sleeve_r, sleeve_l = (0.26, 0.86, 1.23), (-0.26, 0.86, 1.23)
    skin_object("Rider_Shirt", C_RIDER, [
        [((0, 0.46, 0.91), 0.205), ((0, 0.56, 1.10), 0.19), ((0, 0.66, 1.23), (0.22, 0.15)), (P3, (0.23, 0.13)), ((0, 0.82, 1.39), 0.065)],
        [(P3, 0.2), (SR, 0.10), (sleeve_r, 0.075)],
        [(P3, 0.2), (SL, 0.10), (sleeve_l, 0.075)],
    ], M['shirt'], parent=rider)
    grip_r, grip_l = (0.33, 1.17, 0.975), (-0.33, 1.17, 0.975)
    skin_object("Rider_Arms", C_RIDER, [
        [((0.25, 0.85, 1.24), 0.055), ((0.31, 1.00, 1.10), 0.048), ((0.325, 1.12, 1.0), 0.036)],
        [((-0.25, 0.85, 1.24), 0.055), ((-0.31, 1.00, 1.10), 0.048), ((-0.325, 1.12, 1.0), 0.036)],
    ], M['skin'], parent=rider)
    mb = MB()
    for g in (grip_r, grip_l):
        mb.sphere(Vector(g) + Vector((0, -0.01, 0.01)), 0.05, M['glove'], scale=(0.9, 1.2, 0.8))
    mb.build("Rider_Gloves", C_RIDER, rider)
    skin_object("Rider_Jeans", C_RIDER, [
        [((0, 0.47, 0.92), 0.11), ((0.11, 0.47, 0.92), 0.115), ((0.30, 0.90, 0.62), 0.075), ((0.33, 0.93, 0.36), 0.06)],
        [((0, 0.47, 0.92), 0.11), ((-0.11, 0.47, 0.92), 0.115), ((-0.27, 0.83, 0.70), 0.075), ((-0.22, 0.62, 0.44), 0.06)],
    ], M['jeans'], parent=rider)
    skin_object("Rider_Boots", C_RIDER, [
        [((0.335, 0.935, 0.41), 0.066), ((0.345, 0.93, 0.11), 0.056), ((0.36, 1.07, 0.05), 0.047), ((0.365, 1.14, 0.04), 0.035)],
        [((0.345, 0.93, 0.11), 0.056), ((0.345, 0.87, 0.05), 0.045)],
        [((-0.22, 0.625, 0.47), 0.066), ((-0.205, 0.58, 0.36), 0.056), ((-0.20, 0.72, 0.34), 0.045)],
    ], M['boot_white'], parent=rider)
    mb = MB()
    mb.box((0.36, 1.00, 0.012), (0.10, 0.30, 0.024), M['boot_black'], smooth=False)       # sole
    mb.box((0.39, 0.94, 0.16), (0.012, 0.09, 0.14), M['boot_black'], rot=(10, 0, 0))     # outer slider panel
    mb.box((0.393, 0.91, 0.33), (0.010, 0.05, 0.04), M['boot_red'])
    mb.build("Rider_Boot_Details", C_RIDER, rider, bevel=0.004)
    HEAD = Vector((0, 0.89, 1.50))
    mb = MB()
    mb.sphere((0, 0, 0), 0.155, M['helmet'], scale=(0.94, 1.12, 1.0), segs=40)
    mb.sphere((0, 0.10, -0.05), 0.12, M['visor'], scale=(0.85, 0.6, 0.55), segs=32)
    mb.box((0, -0.15, 0.06), (0.10, 0.06, 0.03), M['helmet'], rot=(20, 0, 0))   # spoiler
    mb.build("Rider_Helmet", C_RIDER, rider, HEAD)

    focus = empty("DOF_Focus", C_CAM, parent=bike, loc=(0.1, 0.45, 0.9), size=0.15)
    cd.dof.use_dof = True
    cd.dof.focus_object = focus
    cd.dof.aperture_fstop = 1.25
    cd.dof.aperture_blades = 0

    # ---------------- road
    road_dir = Vector((-math.sin(math.radians(9)), math.cos(math.radians(9)), 0))
    road_side = Vector((road_dir.y, -road_dir.x, 0))  # right of road direction
    mb = MB()
    mb.box((0, 60, -0.05), (240, 260, 0.1), asphalt())
    mb.build("Road_Asphalt", C_ROAD)
    m_paint = mat("MAT_LanePaint", (0.55, 0.55, 0.52), rough=0.45, coat=0.8, coat_rough=0.05)
    a = px_ground(941, 1192); b = px_ground(690, 1008)
    ldir = (b - a).normalized()
    mb = MB()
    start = a - ldir * 8.0
    for k in range(14):
        p0 = start + ldir * (k * 2.9)
        p1 = p0 + ldir * 1.7
        mb.beam(Vector((p0.x, p0.y, 0.002)), Vector((p1.x, p1.y, 0.002)), 0.13, 0.004, m_paint)
    mb.build("Road_LaneMarking", C_ROAD)
    m_curb = mat("MAT_Curb", (0.08, 0.08, 0.08), rough=0.7)
    mb = MB()
    lp = px_ground(40, 660)
    mb.beam(lp - road_side * 3.0 - road_dir * 40 + Vector((0, 0, 0.08)), lp - road_side * 3.0 + road_dir * 120 + Vector((0, 0, 0.08)), 6.0, 0.16, m_curb)
    rp = px_ground(790, 590)
    mb.beam(rp + road_side * 3.0 - road_dir * 40 + Vector((0, 0, 0.08)), rp + road_side * 3.0 + road_dir * 120 + Vector((0, 0, 0.08)), 6.0, 0.16, m_curb)
    mb.build("Road_Sidewalks", C_ROAD)

    # ---------------- background (placed from reference pixels)
    def emit_rect(mb, m, x0, y0, x1, y1, dist, thick=0.05):
        p0 = px_world(x0, y0, dist); p1 = px_world(x1, y1, dist)
        c = (p0 + p1) / 2
        mb.box(c, (abs(p1.x - p0.x) + 1e-3, thick, abs(p1.z - p0.z) + 1e-3), m)

    m_lamp = emit("MAT_StreetLamp_Sodium", (1.0, 0.5, 0.16), 60)
    mb = MB()
    for u, v, d in [(268, 345, 40), (300, 452, 30), (215, 470, 45), (100, 515, 55), (160, 500, 60),
                    (55, 535, 70), (290, 500, 50), (728, 345, 30), (205, 528, 50),
                    (20, 535, 25), (60, 522, 35), (8, 498, 22), (140, 530, 40)]:
        mb.sphere(px_world(u, v, d), px_size(5, d), m_lamp, segs=12)
    mb.build("BG_StreetLamps", C_BG)
    m_head = emit("MAT_Headlights", (0.8, 0.9, 1.0), 120)
    m_head_w = emit("MAT_Headlight_Warm", (1.0, 0.85, 0.6), 80)
    mb = MB()
    for u, v, d in [(225, 553, 45), (250, 556, 45), (110, 545, 70), (130, 546, 70), (255, 548, 28), (62, 552, 30), (85, 552, 30)]:
        mb.sphere(px_world(u, v, d), px_size(7, d), m_head, segs=12)
    mb.sphere(px_world(425, 563, 15), px_size(8, 15), m_head_w, segs=12)
    mb.build("BG_TrafficLights", C_BG)

    D_SHOP = 30.0
    m_led = emit("MAT_Shop_LEDbars", (0.85, 0.92, 1.0), 9)
    m_string = emit("MAT_Shop_StringLights", (1.0, 0.72, 0.4), 24)
    mb = MB()
    for x0, x1 in [(400, 445), (450, 500), (505, 560), (565, 615), (620, 670)]:
        emit_rect(mb, m_led, x0, 328, x1, 342, D_SHOP)
    mb.build("BG_Shop_LEDCanopy", C_BG)
    mb = MB()
    for x0, x1, y0, y1 in [(328, 356, 348, 460), (366, 396, 345, 452), (414, 442, 358, 412), (466, 496, 346, 416)]:
        for u in range(x0, x1 + 1, 5):
            for v in range(y0, y1 + 1, 6):
                mb.sphere(px_world(u, v, D_SHOP), px_size(1.6, D_SHOP), m_string, segs=6)
    mb.build("BG_Shop_StringLights", C_BG)
    mb = MB()
    for (x0, y0, x1, y1, col, s) in [
        (430, 415, 478, 445, (1, 0.08, 0.06), 10), (472, 418, 495, 440, (0.6, 0.8, 1.0), 18),
        (380, 470, 430, 500, (1, 0.3, 0.4), 6), (420, 500, 470, 520, (1, 0.05, 0.05), 7),
        (380, 520, 400, 535, (0.2, 1, 0.7), 6), (440, 460, 560, 560, (1, 0.6, 0.35), 2.5),
        (560, 380, 600, 400, (1, 0.8, 0.5), 8), (620, 440, 700, 455, (1, 0.8, 0.55), 6),
        (330, 470, 360, 510, (1, 0.55, 0.3), 5)]:
        emit_rect(mb, emit(f"MAT_Sign_{x0}_{y0}", col, s), x0, y0, x1, y1, D_SHOP + 0.5)
    mb.build("BG_Shop_Signs", C_BG)
    mb = MB()
    emit_rect(mb, emit("MAT_Facade_Lit", (0.85, 0.8, 0.72), 0.22), 690, 455, 870, 565, 28.5)
    emit_rect(mb, emit("MAT_Facade_Mid", (0.6, 0.5, 0.4), 0.05), 560, 345, 941, 565, 29.0)
    emit_rect(mb, emit("MAT_Tower_Facade", (0.4, 0.33, 0.26), 0.08), 470, -40, 800, 345, 38.0)
    m_win = emit("MAT_Tower_Windows", (1.0, 0.45, 0.12), 1.3)
    for r in [(495, 0, 555, 40), (500, 60, 555, 112), (505, 130, 560, 185), (505, 200, 560, 248),
              (510, 262, 560, 305), (700, 85, 760, 110), (700, 125, 760, 140)]:
        emit_rect(mb, m_win, *r, 37.8)
    mb.build("BG_Buildings", C_BG)
    m_leaf = mat("MAT_Tree_Foliage", (0.01, 0.018, 0.01), rough=0.8)
    tex = bpy.data.textures.new("TEX_TreeClouds", 'CLOUDS'); tex.noise_scale = 0.6
    for i, (u, v, d, r) in enumerate([(30, 80, 14, 1.3), (130, 30, 16, 1.0), (60, 250, 14, 1.1), (15, 420, 13, 0.8),
                                      (110, 160, 15, 0.9), (200, 60, 17, 0.7), (230, 10, 18, 0.6),
                                      (900, 260, 22, 1.4), (870, 150, 24, 1.2), (930, 60, 22, 1.2)]):
        mb = MB(); mb.sphere((0, 0, 0), r, m_leaf, segs=32)
        t = mb.build(f"BG_Tree_{i:02d}", C_BG, loc=px_world(u, v, d), subsurf=1)
        dm = t.modifiers.new("Displace", 'DISPLACE'); dm.texture = tex; dm.strength = r * 0.6
    mb = MB()
    tp = px_ground(20, 630)
    mb.cyl(tp, tp + Vector((0, 0, 7)), 0.22, 0.15, m=mat("MAT_Tree_Bark", (0.02, 0.015, 0.01), rough=0.9))
    mb.cyl(px_world(560, 330, 35), px_world(941, 130, 25), 0.05, m=M['matte_black'], segs=6)
    mb.build("BG_TreeTrunk_Wire", C_BG)

    # ---------------- people & traffic
    def person(name, foot_px, height, top, pants, yaw=0.0, vest=None):
        loc = px_ground(*foot_px)
        s = height / 1.75
        root = empty(name, C_PPL, loc=loc, rot=(0, 0, math.radians(yaw)), size=0.3)
        P = lambda x, y, z: (x * s, y * s, z * s)
        skin_object(name + "_Top", C_PPL, [
            [(P(0, 0, 0.95), 0.17 * s), (P(0, 0, 1.25), 0.19 * s), (P(0, 0, 1.45), 0.2 * s), (P(0, 0, 1.55), 0.06 * s)],
            [(P(0, 0, 1.45), 0.2 * s), (P(0.21, 0, 1.42), 0.07 * s), (P(0.25, 0.02, 1.15), 0.055 * s), (P(0.26, 0.05, 0.9), 0.045 * s)],
            [(P(0, 0, 1.45), 0.2 * s), (P(-0.21, 0, 1.42), 0.07 * s), (P(-0.25, 0.02, 1.15), 0.055 * s), (P(-0.26, 0.05, 0.9), 0.045 * s)],
        ], top, parent=root)
        skin_object(name + "_Legs", C_PPL, [
            [(P(0, 0, 0.95), 0.16 * s), (P(0.1, 0, 0.9), 0.08 * s), (P(0.1, 0.01, 0.5), 0.06 * s), (P(0.1, 0, 0.06), 0.05 * s)],
            [(P(0, 0, 0.95), 0.16 * s), (P(-0.1, 0, 0.9), 0.08 * s), (P(-0.1, 0.01, 0.5), 0.06 * s), (P(-0.1, 0, 0.06), 0.05 * s)],
        ], pants, parent=root)
        mb = MB(); mb.sphere(P(0, 0, 1.66), 0.105 * s, M['skin'], scale=(0.85, 0.95, 1.1))
        if vest:
            mb.box(P(0, 0, 1.30), (0.42 * s, 0.30 * s, 0.03 * s), vest, smooth=False)
            mb.box(P(0, 0, 1.18), (0.40 * s, 0.30 * s, 0.03 * s), vest, smooth=False)
        mb.build(name + "_Head", C_PPL, root)
        return root

    m_dark = mat("MAT_Cloth_Dark", (0.02, 0.02, 0.025), rough=0.9)
    m_maroon = mat("MAT_Cloth_Maroon", (0.06, 0.015, 0.02), rough=0.9)
    m_white = mat("MAT_Cloth_WhiteHoodie", (0.7, 0.7, 0.72), rough=0.9, sheen=0.3)
    m_vest = emit("MAT_ReflectiveVest", (0.75, 0.95, 0.6), 1.5)
    person("PPL_Bystander_Left", (222, 722), 1.70, m_dark, m_maroon, yaw=170, vest=m_vest)
    person("PPL_Bystander_Right", (912, 808), 1.78, m_white, m_dark, yaw=-60)

    def scooter(name, foot_px, yaw, rider_col, headlight=True):
        loc = px_ground(*foot_px)
        root = empty(name, C_PPL, loc=loc, rot=(0, 0, math.radians(yaw)), size=0.4)
        mb = MB()
        for y in (0.0, 1.25):
            mb.cyl((-0.05, y, 0.22), (0.05, y, 0.22), 0.22, m=M['rubber'])
        mb.box((0, 0.55, 0.45), (0.32, 0.9, 0.35), M['paint_black'])
        mb.box((0, 1.15, 0.75), (0.30, 0.15, 0.6), M['paint_black'], rot=(-15, 0, 0))
        if headlight:
            mb.sphere((0, 1.24, 0.9), 0.07, m_head_w)
        mb.build(name + "_Body", C_PPL, root, bevel=0.02)
        skin_object(name + "_Rider", C_PPL, [
            [((0, 0.45, 0.7), 0.17), ((0, 0.55, 1.1), 0.19), ((0, 0.6, 1.3), 0.06)],
            [((0, 0.55, 1.1), 0.19), ((0.2, 0.9, 0.95), 0.05)], [((0, 0.55, 1.1), 0.19), ((-0.2, 0.9, 0.95), 0.05)],
            [((0, 0.45, 0.7), 0.17), ((0.15, 0.8, 0.6), 0.07), ((0.15, 0.85, 0.2), 0.05)],
            [((0, 0.45, 0.7), 0.17), ((-0.15, 0.8, 0.6), 0.07), ((-0.15, 0.85, 0.2), 0.05)],
        ], rider_col, parent=root)
        mb = MB(); mb.sphere((0, 0.62, 1.45), 0.14, M['helmet'])
        mb.build(name + "_Helmet", C_PPL, root)

    scooter("TRF_Scooter_A", (398, 632), 180, m_dark)
    scooter("TRF_Scooter_B", (372, 618), 175, m_maroon, headlight=False)
    scooter("TRF_Scooter_Parked", (655, 600), 60, m_dark, headlight=False)
    for i, fp in enumerate([(30, 652), (95, 640)]):
        mb = MB()
        mb.box((0, 0, 0.45), (0.3, 1.6, 0.6), M['paint_black'])
        mb.build(f"TRF_ParkedBike_{i}", C_PPL, loc=px_ground(*fp), bevel=0.05).rotation_euler = (0, 0, math.radians(80))

    # ---------------- world
    w = bpy.data.worlds.new("WORLD_NightSky")
    scn.world = w
    nt = _tree(w)
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Generated'], sep.inputs[0])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.0; ramp.color_ramp.elements[0].color = (0.025, 0.05, 0.13, 1)
    ramp.color_ramp.elements[1].position = 0.45; ramp.color_ramp.elements[1].color = (0.004, 0.012, 0.05, 1)
    nt.links.new(sep.outputs['Z'], ramp.inputs[0])
    bg = nt.nodes.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = 1.0
    nt.links.new(ramp.outputs[0], bg.inputs[0])
    out = nt.nodes.new('ShaderNodeOutputWorld')
    nt.links.new(bg.outputs[0], out.inputs[0])

    # ---------------- lights
    bpy.context.view_layer.update()
    bike_c = bike.matrix_world @ Vector((0, 0.6, 0.8))
    light("LGT_Key_StreetLamp", C_LGT, 'AREA', bike_c + Vector((-4.0, 7.0, 5.5)), 2500, (1.0, 0.55, 0.25), size=1.5, target=bike_c)
    light("LGT_Fill_BehindCamera", C_LGT, 'AREA', Vector((-2.5, -2.5, 3.0)), 450, (1.0, 0.82, 0.65), size=3.0, target=bike_c)
    light("LGT_Rim_ShopSpill", C_LGT, 'AREA', bike_c + Vector((5.0, 10.0, 3.5)), 600, (0.85, 0.9, 1.0), size=4.0, target=bike_c)
    light("LGT_SkyBounce", C_LGT, 'AREA', bike_c + Vector((0, 0, 8)), 60, (0.4, 0.55, 1.0), size=10.0, target=bike_c)
    tg = light("LGT_TailLight_Glow", C_LGT, 'SPOT', Vector((0, -0.16, 0.90)), 90, (1.0, 0.02, 0.01), size=0.04,
               spot=170, parent=bike)
    tg.rotation_euler = (math.radians(-50), 0, 0)  # pointing back & down (local -Z rotated toward -Y)
    for n in ("LGT_Fill_BehindCamera", "LGT_SkyBounce", "LGT_Rim_ShopSpill"):
        bpy.data.objects[n].visible_glossy = False
    bloom(scn)

    # ---------------- render settings
    scn.render.engine = 'CYCLES'
    scn.render.resolution_x = 1080
    scn.render.resolution_y = 1920
    scn.render.resolution_percentage = 100
    scn.render.fps = 30
    cy = scn.cycles
    cy.samples = 384
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.015
    cy.use_denoising = True
    cy.max_bounces = 8
    cy.glossy_bounces = 4
    cy.transparent_max_bounces = 8
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.blur_glossy = 0.5
    try:
        cy.use_light_tree = True
    except Exception:
        pass
    vs = scn.view_settings
    try:
        vs.view_transform = 'AgX'
        vs.look = 'AgX - Medium High Contrast'
    except Exception:
        pass
    try:
        vs.use_white_balance = True
        vs.white_balance_temperature = 7200
    except Exception:
        pass
    vs.exposure = 0.0
    scn.frame_start, scn.frame_end = 1, 150
    return scn


def bloom(scn):
    """Compositor: subtle fog-glow bloom for the practical lights (phone-lens look)."""
    try:
        ng = bpy.data.node_groups.new("COMP_Bloom", 'CompositorNodeTree')
        ng.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
        rl = ng.nodes.new('CompositorNodeRLayers')
        gl = ng.nodes.new('CompositorNodeGlare')
        def setin(name, val):
            if name in gl.inputs:
                gl.inputs[name].default_value = val
                return True
            return False
        if not setin('Type', 'Fog Glow'):
            gl.glare_type = 'FOG_GLOW'
        setin('Threshold', 1.0); setin('Strength', 0.35); setin('Size', 0.5); setin('Quality', 'High')
        out = ng.nodes.new('NodeGroupOutput')
        ng.links.new(rl.outputs['Image'], gl.inputs['Image'])
        ng.links.new(gl.outputs['Image'], out.inputs[0])
        scn.compositing_node_group = ng
        scn.render.use_compositing = True
    except Exception as e:
        print("BLOOM SETUP FAILED", e)


def setup_gpu(scn):
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        for t in ('OPTIX', 'CUDA'):
            try:
                prefs.compute_device_type = t
                prefs.get_devices()
                devs = [d for d in prefs.devices if d.type == t]
                if devs:
                    for d in prefs.devices:
                        d.use = d.type == t
                    scn.cycles.device = 'GPU'
                    return t
            except Exception:
                continue
    except Exception:
        pass
    return 'CPU'


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    mode = argv[argv.index("--render") + 1] if "--render" in argv else "none"
    tag = argv[argv.index("--tag") + 1] if "--tag" in argv else mode
    scn = build()
    scn.cycles.device = 'CPU'
    os.makedirs(RENDER_DIR, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    if mode != "none":
        dev = setup_gpu(scn)
        print("RENDER DEVICE", dev)
        if mode == "preview":
            scn.render.resolution_percentage = 50
            scn.cycles.samples = 96
        scn.render.filepath = os.path.join(RENDER_DIR, f"render_{tag}.png")
        bpy.ops.render.render(write_still=True)
        print("WROTE", scn.render.filepath)


if __name__ == "__main__":
    main()
