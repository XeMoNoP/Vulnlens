import bpy, os, shutil
BASE = r"C:\Users\mohdf\ProllyaTypO-Film\.claude\worktrees\blender-connection-f0e004\PROLLYATYP0_MOTION_DESIGN\PROJECT"
# background mode exports from the active scene: keep only the crystal scene in memory (file is not saved)
for other in [x for x in bpy.data.scenes if x.name != "Crystal_Storyboard"]:
    bpy.data.scenes.remove(other)
sc = bpy.data.scenes["Crystal_Storyboard"]; vl = sc.view_layers[0]
print("CB_INFO context scene:", bpy.context.scene.name if bpy.context.scene else None)
col = bpy.data.collections["Crystal_Shards"]
exec(bpy.data.texts["crystal_pose.py"].as_string(), globals())
crystal_pose(0.0, (90, 0, 0), 1.0, True)
names = ["Crystal_Root", "Crystal_Whole"] + [o.name for o in col.objects if o.name.startswith("Shard_")]
for o in sc.objects: o.select_set(False, view_layer=vl)
for nm in names:
    o = bpy.data.objects[nm]; o.hide_viewport = False; o.hide_render = False
    o.hide_set(False, view_layer=vl); o.select_set(True, view_layer=vl)
vl.update()
p = os.path.join(BASE, "03_Assets", "crystal_asterisk.glb")
if True:
    bpy.ops.export_scene.gltf(filepath=p, export_format="GLB", use_selection=True, export_apply=True,
        export_materials="NONE", export_yup=True, export_animations=False, export_normals=True, export_texcoords=False,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14, export_draco_normal_quantization=10)
shutil.copy(p, os.path.join(BASE, "04_Source_Code", "crystal-burst", "assets", "crystal_asterisk.glb"))
print("CB_RESULT exported", os.path.getsize(p))
