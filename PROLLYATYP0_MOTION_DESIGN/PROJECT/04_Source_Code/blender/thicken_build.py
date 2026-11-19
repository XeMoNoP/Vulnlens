# Run with: blender -b crystal_asterisk.blend --python thicken.py
# Rebuilds the crystal asterisk thicker (solid bars like the live site), re-fractures it, exports the GLB.
import bpy, bmesh, random, math, os, shutil, sys
from mathutils import Vector
from mathutils.geometry import delaunay_2d_cdt

BASE = r"C:\Users\mohdf\ProllyaTypO-Film\.claude\worktrees\blender-connection-f0e004\PROLLYATYP0_MOTION_DESIGN\PROJECT"
W = float(os.environ.get("CB_W", "0.2"))          # half wall height (was 0.13)
SLOPE = float(os.environ.get("CB_SLOPE", "0.34"))  # facet ridge rise (was 0.85)
STEP = 0.02; K = 0.034

poly = [[129,0],[148,55],[118,65],[170,77],[135,115],[112,96],[126,143],[73,132],[78,101],[43,140],[26,93],[53,82],[1,73],[37,33],[60,52],[44,3],[96,11],[92,43]]
cx = sum(p[0] for p in poly) / len(poly); cy = sum(p[1] for p in poly) / len(poly)
s = 2.0 / 169.0
P = [((x - cx) * s, (y - cy) * s) for x, y in poly]

def inside(x, y):
    c = False; n = len(P)
    for i in range(n):
        x1, y1 = P[i]; x2, y2 = P[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c
def dseg(px, py, a, b):
    ax, ay = a; bx, by = b; vx, vy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)))
    return math.hypot(px - (ax + t * vx), py - (ay + t * vy))
def dists(x, y): return [dseg(x, y, P[i], P[(i + 1) % len(P)]) for i in range(len(P))]
def height(x, y):
    d = dists(x, y); m = min(d)
    if m < 1e-7: return W
    sm = -K * math.log(sum(math.exp(-(di - m) / K) for di in d)) + m
    t = min(1.0, m / 0.06)
    return W + SLOPE * max(0.0, m * (1 - t) + max(0.0, sm) * t)

outl = []
for i in range(len(P)):
    a = P[i]; b = P[(i + 1) % len(P)]; L = math.hypot(b[0] - a[0], b[1] - a[1]); k = max(1, round(L / STEP))
    for j in range(k): outl.append((a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k))
pts = list(outl); xs = [p[0] for p in P]; ys = [p[1] for p in P]
y = min(ys); row = 0
while y < max(ys):
    x = min(xs) + (STEP / 2 if row % 2 else 0)
    while x < max(xs):
        if inside(x, y) and min(dists(x, y)) > STEP * 0.45: pts.append((x, y))
        x += STEP
    y += STEP * 0.866; row += 1
vo, eo, fo, _, _, _ = delaunay_2d_cdt([Vector(p) for p in pts], [], [list(range(len(outl)))], 2, 1e-6)
H = [height(v.x, v.y) for v in vo]

def build():
    bm = bmesh.new()
    top = [bm.verts.new((v.x, v.y, H[i])) for i, v in enumerate(vo)]
    bot = [bm.verts.new((v.x, v.y, -H[i])) for i, v in enumerate(vo)]
    for f in fo:
        bm.faces.new([top[i] for i in f]); bm.faces.new([bot[i] for i in reversed(f)])
    idx = {v: i for i, v in enumerate(top)}
    for e in [e for e in bm.edges if e.is_boundary and e.verts[0].co.z > 0]:
        a, b = idx[e.verts[0]], idx[e.verts[1]]
        try: bm.faces.new([top[a], top[b], bot[b], bot[a]])
        except ValueError: pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); return bm
def finish(me):
    me.shade_smooth()
    if hasattr(me, "set_sharp_from_angle"): me.set_sharp_from_angle(angle=math.radians(40))

sc = bpy.data.scenes["Crystal_Storyboard"]
vl = sc.view_layers[0]
col = bpy.data.collections["Crystal_Shards"]; root = bpy.data.objects["Crystal_Root"]; mat = bpy.data.materials["Crystal_Glass"]
wo = bpy.data.objects["Crystal_Whole"]
bm = build(); bm.to_mesh(wo.data); bm.free(); finish(wo.data)
for ob in [o for o in col.objects if o.name.startswith("Shard_")]:
    me = ob.data; bpy.data.objects.remove(ob); bpy.data.meshes.remove(me)
random.seed(7); seeds = []
while len(seeds) < 20:
    x, y = random.uniform(-1, 1), random.uniform(-0.9, 0.9)
    if inside(x, y): seeds.append(Vector((x, y, random.uniform(-0.22, 0.22))))
random.seed(11); n = 0
for i, si in enumerate(seeds):
    bm = build()
    for j, sj in enumerate(seeds):
        if i == j: continue
        no = (sj - si).normalized(); co = (si + sj) / 2
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=co, plane_no=no, clear_outer=True)
        bnd = [e for e in bm.edges if e.is_boundary]
        if bnd:
            r = bmesh.ops.holes_fill(bm, edges=bnd, sides=0)
            if r["faces"]: bmesh.ops.triangulate(bm, faces=r["faces"], ngon_method='EAR_CLIP')
        if not bm.verts: break
    if len(bm.faces) < 4: bm.free(); continue
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(f"Shard_{i:02d}"); bm.to_mesh(me); bm.free(); finish(me)
    c = sum((v.co for v in me.vertices), Vector()) / len(me.vertices)
    for v in me.vertices: v.co -= c
    ob = bpy.data.objects.new(f"Shard_{i:02d}", me); ob.location = c; col.objects.link(ob); ob.parent = root
    ob["home"] = list(c); ob["rot"] = [random.uniform(-1, 1) for _ in range(3)]
    ob["zkick"] = random.uniform(-1, 1); ob["speed"] = random.uniform(0.7, 1.3)
    me.materials.append(mat); n += 1


# make the storyboard scene the active one and save; export happens in a second run
for w in bpy.context.window_manager.windows: w.scene = sc
zs = [v.co.z for v in wo.data.vertices]
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BASE, "04_Source_Code", "blender", "crystal_asterisk.blend"))
print(f"CB_RESULT built shards={n} depth={max(zs)-min(zs):.3f} wall={2*W:.2f}")
