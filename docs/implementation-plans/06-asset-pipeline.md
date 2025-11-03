# Asset Pipeline and Conventions

Goals
- High visual quality with low bandwidth and high FPS; scalable to city scenes.

Formats
- GLB (GLTF 2.0 binary); materials: PBR Metallic-Roughness.
- Mesh compression: Draco; Textures: KTX2 (BasisU) in ETC1S/UASTC as needed.

Conventions
- Unit scale in DCC: 1 unit = 1 meter; pivot at logical center/base; Y-up.
- Naming: apple_low, car_low, building_blockA_lod{0,1,2}.
- Texture budgets (guidelines):
  - Small props: 512–1024 px; Buildings: 1–2k atlases; Avoid >2k.
  - Use texture atlases for small props; reuse materials.
- LOD:
  - Provide LOD0/1/2; switch by distance; collapse to proxy box very far.
- Colliders:
  - Provide simplified collider meshes or use auto convex hulls; avoid mesh colliders.

Tools & steps
1) Author in Blender; apply transforms; triangulate if necessary.
2) Export gltf2/glb; run gltf-transform or gltfpack for Draco; run KTX2 encode.
3) Validate with glTF Validator; preview in three.js viewer.
4) Register in asset manifest with sizeTier, points, mass.

References
- three.js GLTFLoader, KTX2Loader, DRACOLoader; gltf-transform; basisu.
