# blender -b S1000RR_Night.blend -P scripts/render_final.py  -> renders/render_final.png (1080x1920, full samples)
import bpy, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_scene import setup_gpu, RENDER_DIR
scn = bpy.context.scene
print("DEVICE", setup_gpu(scn))
scn.render.resolution_percentage = 100
scn.render.filepath = os.path.join(RENDER_DIR, "render_final.png")
bpy.ops.render.render(write_still=True)
