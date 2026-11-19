# Swap the hero crystal for the asterisk — ChatGPT site editor

## Steps

1. Open your site in ChatGPT and click **Edit site**.
2. Attach `crystal_asterisk.glb` and `asterisk_crystal_reference.jpg` from this folder.
   If it won't take the .glb, attach `prollyatyp0-asterisk-crystal.zip` instead. If it won't take
   either, send the message anyway: it has the exact logo outline, so ChatGPT can build the shape in code.
3. Copy the message below into the chat and send it.
4. Check the preview against the list at the bottom before publishing. If something's off, use the
   follow-up messages.

## Message to paste

```text
Replace the ice rock in the homepage hero with my logo, the Prollyatyp0 asterisk, as a crystal.
Change only the crystal's shape. Keep everything else about the crystal exactly as it is now:
the ice material, the refraction of the page text behind it, the rainbow dispersion, the frost
patches and crack veins, the grey halo and the warm light cast on the page, the idle float, the
hover response, the orbiting caption ring, click-to-shatter, the shatter pieces that open the case
studies, the sounds, and the night/dream modes. Don't change the layout, text or navigation.

THE MODEL (attached: crystal_asterisk.glb, with asterisk_crystal_reference.jpg showing how it should look)
- Draco-compressed glTF. Load it with GLTFLoader plus DRACOLoader, decoder path
  https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/gltf/
- Mesh "Crystal_Whole" is the intact crystal. The 20 meshes "Shard_00"…"Shard_19" are its fracture
  pieces. Each shard's position in the file is its home position in the intact logo, so the shards
  placed at their file positions rebuild Crystal_Whole exactly. Use them as the shatter pieces
  (for the case-study pieces, use the largest shards).
- Y-up, centred on the origin, about 2 units wide; the logo faces +Z (towards the camera).
  It has smooth normals with sharp edges already split. No materials: apply the site's ice material.
- Scale it so it covers about the same screen area the rock covers now. Keep its proportions
  exactly: no stretching, skewing or squashing of the logo.

IMPORTANT — THE SHAPE IS CONCAVE
The rock is convex and the current shader builds its bevel normals, rim light and inside/outside
tests from the convex cutting planes. The asterisk has deep notches between its six arms, so those
plane-based tricks will give wrong results. For the asterisk, take normals from the mesh, get the
back-face normals from a back-face render pass (as the refraction already does), and put the rim
light on the mesh's sharp edges instead of plane intersections. Keep the frost and vein textures
in object space so they stay continuous when the crystal breaks into shards.

IF YOU CAN'T USE THE .GLB, BUILD THE SAME SHAPE IN CODE
- Outline (18 points, x/y in units, y up, centred, about 2 wide), in order:
  [0.513,-0.864], [0.738,-0.213], [0.383,-0.095], [0.999,0.047], [0.584,0.497], [0.312,0.272],
  [0.478,0.828], [-0.149,0.698], [-0.090,0.331], [-0.504,0.793], [-0.705,0.237], [-0.386,0.107],
  [-1.001,0.000], [-0.575,-0.473], [-0.303,-0.249], [-0.492,-0.828], [0.123,-0.734], [0.076,-0.355]
- Sides: vertical walls from z = -0.13 to +0.13 along that outline.
- Front and back: a gem "roof" on each side. For a point inside the outline, the height is
  0.13 + 0.85 × (distance to the nearest outline edge), so each arm rises to a ridge along its
  middle. Use a smooth minimum for that distance (softness about 0.034) so the ridges are slightly
  rounded. Mirror it for the back (negative z). Triangulate the inside densely, about 0.02 apart.
- Shatter pieces: cut that solid into 20 Voronoi cells, with seeds spread inside the outline.

Show me the result in the preview.
```

## Check before publishing

- The hero shows the asterisk with all six arms, not stretched, about as big as the rock was.
- The page text still bends through the crystal, and the edges show rainbow colours.
- Clicking it shatters into pieces and the case-study flow still works.
- Nothing else on the page moved or changed.
- It works on a phone-width preview.

## Follow-up messages if needed

- The logo looks stretched or skewed:
  `The asterisk is distorted. Use one uniform scale for x, y and z and keep the model's own proportions.`
- It looks flat, grey or opaque:
  `The asterisk lost the ice look. Use the exact same ice material and refraction as the old rock; only the geometry should change.`
- There are dark patches or black facets in the notches between the arms:
  `There are artefacts in the concave notches. Stop using the convex cutting planes for normals/rim/inside tests on this shape and use mesh normals plus the back-face pass instead.`
- The shatter pieces don't line up with the intact crystal:
  `Place each Shard_* at its own position from the file. At rest the shards must rebuild Crystal_Whole exactly.`
