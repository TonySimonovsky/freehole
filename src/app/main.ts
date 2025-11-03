import * as THREE from 'three'
import * as CANNON from 'cannon-es'

function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, stencil: true })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  document.body.appendChild(renderer.domElement)
  return renderer
}

function createScene() {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b0f17)

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 0.9)
  scene.add(hemi)
  const dir = new THREE.DirectionalLight(0xffffff, 0.8)
  dir.position.set(5, 10, 5)
  scene.add(dir)

  // Ground plane (XZ)
  const size = 2000
  const geom = new THREE.PlaneGeometry(size, size, 1, 1)
  geom.rotateX(-Math.PI / 2)

  const mat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.95, metalness: 0.0 })
  // Stencil test: do NOT draw where stencil=1 (hole disc writes 1)
  mat.stencilWrite = true
  mat.stencilRef = 1
  mat.stencilFunc = THREE.NotEqualStencilFunc
  mat.stencilFail = THREE.KeepStencilOp
  mat.stencilZFail = THREE.KeepStencilOp
  mat.stencilZPass = THREE.KeepStencilOp

  const ground = new THREE.Mesh(geom, mat)
  ground.position.y = -0.01
  ground.renderOrder = 1
  ground.receiveShadow = false
  scene.add(ground)

  return { scene, ground, size }
}

function createCamera() {
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000)
  // Top-down 2.5D tilt: elevated and offset back, looking at origin
  camera.position.set(0, 35, 35)
  camera.lookAt(0, 0, 0)
  return camera
}

function createHole(radius = 2, depth = 8) {
  const group = new THREE.Group()
  group.position.set(0, 0, 0)
  ;(group as any).baseRadius = radius

  // Stencil-writing disc at y=0
  const discGeom = new THREE.CircleGeometry(radius, 64)
  discGeom.rotateX(-Math.PI / 2)
  const discMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
  discMat.colorWrite = false
  discMat.depthWrite = false
  discMat.depthTest = false
  discMat.stencilWrite = true
  discMat.stencilRef = 1
  discMat.stencilFunc = THREE.AlwaysStencilFunc
  discMat.stencilFail = THREE.ReplaceStencilOp
  discMat.stencilZFail = THREE.ReplaceStencilOp
  discMat.stencilZPass = THREE.ReplaceStencilOp
  const disc = new THREE.Mesh(discGeom, discMat)
  disc.renderOrder = 0
  group.add(disc)

  // Interior cylinder (open-ended), rendered only where stencil==1
  const cylGeom = new THREE.CylinderGeometry(radius * 0.98, radius * 1.02, depth, 64, 1, true)
  const cylMat = new THREE.MeshStandardMaterial({ color: 0x06090f, roughness: 1.0, metalness: 0.0, side: THREE.BackSide })
  cylMat.stencilWrite = true
  cylMat.stencilRef = 1
  cylMat.stencilFunc = THREE.EqualStencilFunc
  cylMat.stencilFail = THREE.KeepStencilOp
  cylMat.stencilZFail = THREE.KeepStencilOp
  cylMat.stencilZPass = THREE.KeepStencilOp
  const interior = new THREE.Mesh(cylGeom, cylMat)
  interior.position.y = -depth * 0.5
  interior.renderOrder = 2
  group.add(interior)

  function setRadius(r: number) {
    const scale = r / (group as any).baseRadius
    group.scale.set(scale, 1, scale)
  }

  return { object: group, setRadius, radius, depth }
}

function main() {
  const renderer = createRenderer()
  const { scene, size } = createScene()
  const camera = createCamera()

  // Physics (Cannon.js)
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) })
  world.broadphase = new CANNON.SAPBroadphase(world)
  world.allowSleep = true
  world.defaultContactMaterial.friction = 0.6
  world.defaultContactMaterial.restitution = 0.05

  const GROUP_DYNAMIC = 1
  const GROUP_GROUND = 2
  const GROUP_FUNNEL = 4
  const GROUP_INTERIOR = 8

  // Ground around a central hole: 4 static boxes forming a square with a gap
  const groundBodies: CANNON.Body[] = []
  function createGroundWithHole(holeRadius: number) {
    const gap = holeRadius + 2.5
    const H = size * 0.5
    const thickness = 0.25
    const parts = [
      // Left
      { cx: - (H - (H - gap)), cz: 0, hx: H - gap, hz: H },
      // Right
      { cx: (H - (H - gap)), cz: 0, hx: H - gap, hz: H },
      // Top
      { cx: 0, cz: - (H - (H - gap)), hx: gap, hz: H - gap },
      // Bottom
      { cx: 0, cz: (H - (H - gap)), hx: gap, hz: H - gap }
    ]
    const bodies: { body: CANNON.Body, cx: number, cz: number }[] = []
    for (const p of parts) {
      const shape = new CANNON.Box(new CANNON.Vec3(p.hx, thickness, p.hz))
      const body = new CANNON.Body({ mass: 0, material: new CANNON.Material('ground') })
      body.addShape(shape)
      body.position.set(p.cx, -thickness, p.cz)
      body.collisionFilterGroup = GROUP_GROUND
      body.collisionFilterMask = GROUP_DYNAMIC
      world.addBody(body)
      groundBodies.push(body)
      bodies.push({ body, cx: p.cx, cz: p.cz })
    }
    const update = (pos: THREE.Vector3) => {
      for (const g of bodies) {
        g.body.position.set(pos.x + g.cx, -thickness, pos.z + g.cz)
        g.body.quaternion.set(0, 0, 0, 1)
      }
    }
    return { update }
  }

  // Funnel (sloped rim) collider around the hole for realistic roll-in
  const FUNNEL_SEGMENTS = 48
  const FUNNEL_WIDTH = 2.0
  const FUNNEL_DEPTH = 0.5
  function createFunnel(radius: number) {
    const R1 = Math.max(0.1, radius - 0.05)
    const R2 = radius + FUNNEL_WIDTH
    const verts: number[] = []
    const indices: number[] = []
    for (let i = 0; i < FUNNEL_SEGMENTS; i++) {
      const a0 = (i / FUNNEL_SEGMENTS) * Math.PI * 2
      const a1 = ((i + 1) / FUNNEL_SEGMENTS) * Math.PI * 2
      const c0 = Math.cos(a0), s0 = Math.sin(a0)
      const c1 = Math.cos(a1), s1 = Math.sin(a1)
      // outer ring at y=0
      const ox0 = R2 * c0, oz0 = R2 * s0
      const ox1 = R2 * c1, oz1 = R2 * s1
      // inner ring at y=-depth (toward hole)
      const ix0 = R1 * c0, iz0 = R1 * s0
      const ix1 = R1 * c1, iz1 = R1 * s1
      const oy = 0, iy = -FUNNEL_DEPTH
      const base = verts.length / 3
      verts.push(
        ox0, oy, oz0,
        ox1, oy, oz1,
        ix0, iy, iz0,
        ix1, iy, iz1
      )
      // two triangles: (ox0,ox1,ix0) and (ix0,ox1,ix1)
      indices.push(base + 0, base + 1, base + 2)
      indices.push(base + 2, base + 1, base + 3)
    }
    const vertsArr = new Float32Array(verts)
    const idxArr = new Uint16Array(indices)
    const shape = new CANNON.Trimesh(Array.from(vertsArr), Array.from(idxArr))
    const body = new CANNON.Body({ mass: 0 })
    body.addShape(shape)
    body.collisionFilterGroup = GROUP_FUNNEL
    body.collisionFilterMask = GROUP_DYNAMIC
    world.addBody(body)
    const update = (pos: THREE.Vector3) => {
      body.position.set(pos.x, 0, pos.z)
      body.quaternion.set(0, 0, 0, 1)
    }
    return { body, update }
  }

  // Interior tube collider for inside the hole (slightly tapered)
  function createInteriorTube(radius: number, depth: number) {
    const SEG = 48
    const Rtop = Math.max(0.05, radius * 0.92)
    const Rbot = Math.max(0.02, radius * 0.75)
    const verts: number[] = []
    const indices: number[] = []
    for (let i = 0; i < SEG; i++) {
      const a0 = (i / SEG) * Math.PI * 2
      const a1 = ((i + 1) / SEG) * Math.PI * 2
      const c0 = Math.cos(a0), s0 = Math.sin(a0)
      const c1 = Math.cos(a1), s1 = Math.sin(a1)
      const x0t = Rtop * c0, z0t = Rtop * s0
      const x1t = Rtop * c1, z1t = Rtop * s1
      const x0b = Rbot * c0, z0b = Rbot * s0
      const x1b = Rbot * c1, z1b = Rbot * s1
      const yt = 0, yb = -depth
      const base = verts.length / 3
      verts.push(
        x0t, yt, z0t,
        x1t, yt, z1t,
        x0b, yb, z0b,
        x1b, yb, z1b
      )
      // two triangles forming a quad segment
      indices.push(base + 0, base + 1, base + 2)
      indices.push(base + 2, base + 1, base + 3)
    }
    const shape = new CANNON.Trimesh(Array.from(new Float32Array(verts)), Array.from(new Uint16Array(indices)))
    const body = new CANNON.Body({ mass: 0 })
    body.addShape(shape)
    body.collisionFilterGroup = GROUP_INTERIOR
    body.collisionFilterMask = GROUP_DYNAMIC
    world.addBody(body)
    const update = (pos: THREE.Vector3) => body.position.set(pos.x, 0, pos.z)
    return { body, update }
  }

  // Create hole
  const hole = createHole(2.5, 10)
  scene.add(hole.object)
  // Create physics ground and hole colliders
  const ground = createGroundWithHole(hole.radius)
  const funnel = createFunnel(hole.radius)
  funnel.update(hole.object.position)
  const interior = createInteriorTube(hole.radius, hole.depth)
  interior.update(hole.object.position)

  // Simple keyboard controls (continuous world space XZ)
  const keys = new Set<string>()
  window.addEventListener('keydown', (e) => keys.add(e.key.toLowerCase()))
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()))

  // Pointer drag target on ground plane
  const raycaster = new THREE.Raycaster()
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const ndc = new THREE.Vector2()
  let dragging = false
  let pointerTarget: THREE.Vector3 | null = null
  function updatePointerTarget(clientX: number, clientY: number) {
    ndc.x = (clientX / window.innerWidth) * 2 - 1
    ndc.y = -(clientY / window.innerHeight) * 2 + 1
    raycaster.setFromCamera(ndc, camera)
    const p = new THREE.Vector3()
    if (raycaster.ray.intersectPlane(plane, p)) pointerTarget = p
  }
  window.addEventListener('pointerdown', (e) => { dragging = true; updatePointerTarget(e.clientX, e.clientY) })
  window.addEventListener('pointermove', (e) => { if (dragging) updatePointerTarget(e.clientX, e.clientY) })
  window.addEventListener('pointerup', () => { dragging = false; pointerTarget = null })

  const worldHalf = size * 0.5
  const speed = 12 // units per second

  // Spawn 8 objects: 4 boxes (parallelepipeds) and 4 pyramids around the hole
  type Entity = { mesh: THREE.Object3D; body: CANNON.Body; radius: number }
  const entities: Entity[] = []

  function shade(col: number, f: number) {
    const c = new THREE.Color(col)
    const hsl = { h: 0, s: 0, l: 0 }
    c.getHSL(hsl as any)
    hsl.l = THREE.MathUtils.clamp(hsl.l * f, 0, 1)
    c.setHSL(hsl.h, hsl.s, hsl.l)
    return c.getHex()
  }

  function groundYAt(x: number, z: number): number {
    const ray = new CANNON.Ray(new CANNON.Vec3(x, 50, z), new CANNON.Vec3(x, -50, z))
    ;(ray as any).collisionFilterMask = GROUP_GROUND
    // Do not skip backfaces so we hit the top face of ground from above
    const ANY = (CANNON as any).Ray.ANY || 1
    ray.intersectWorld(world, { collisionFilterMask: GROUP_GROUND, skipBackfaces: false, mode: ANY })
    const res = (ray as any).result
    return res && res.hasHit ? res.hitPointWorld.y : 0
  }

  function addBox(pos: THREE.Vector3, size: { x: number; y: number; z: number }, color: number) {
    const geom = new THREE.BoxGeometry(size.x, size.y, size.z)
    const mats = [
      new THREE.MeshPhongMaterial({ color: shade(color, 0.9), flatShading: true }),
      new THREE.MeshPhongMaterial({ color: shade(color, 1.1), flatShading: true }),
      new THREE.MeshPhongMaterial({ color: shade(color, 0.95), flatShading: true }),
      new THREE.MeshPhongMaterial({ color: shade(color, 1.05), flatShading: true }),
      new THREE.MeshPhongMaterial({ color: shade(color, 0.92), flatShading: true }),
      new THREE.MeshPhongMaterial({ color: shade(color, 1.08), flatShading: true }),
    ]
    const mesh = new THREE.Mesh(geom, mats)
    scene.add(mesh)
    const body = new CANNON.Body({ mass: 1 })
    body.addShape(new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)))
    const gy = groundYAt(pos.x, pos.z)
    const y = gy + size.y / 2 + 0.02
    body.position.set(pos.x, y, pos.z)
    mesh.position.set(pos.x, y, pos.z)
    body.linearDamping = 0.2
    body.angularDamping = 0.4
    body.collisionFilterGroup = GROUP_DYNAMIC
    body.collisionFilterMask = GROUP_GROUND | GROUP_INTERIOR | GROUP_FUNNEL | GROUP_DYNAMIC
    world.addBody(body)
    const radius = Math.hypot(size.x / 2, size.z / 2)
    entities.push({ mesh, body, radius })
  }

  function pyramidShape(base: number, height: number) {
    const a = base / 2
    const h = height / 2
    const verts = [
      new CANNON.Vec3( a, -h,  a),
      new CANNON.Vec3(-a, -h,  a),
      new CANNON.Vec3(-a, -h, -a),
      new CANNON.Vec3( a, -h, -a),
      new CANNON.Vec3( 0,  h,  0),
    ]
    const faces = [
      [0,1,2,3], // base
      [4,1,0],
      [4,2,1],
      [4,3,2],
      [4,0,3],
    ]
    return new CANNON.ConvexPolyhedron({ vertices: verts, faces })
  }

  function makePyramidGeometry(base: number, height: number) {
    const a = base / 2, h = height / 2
    const v0 = new THREE.Vector3( a, -h,  a)
    const v1 = new THREE.Vector3(-a, -h,  a)
    const v2 = new THREE.Vector3(-a, -h, -a)
    const v3 = new THREE.Vector3( a, -h, -a)
    const vt = new THREE.Vector3( 0,  h,  0)
    const positions: number[] = []
    const indices: number[] = []
    const pushTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
      const base = positions.length / 3
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
      indices.push(base, base + 1, base + 2)
    }
    // sides
    pushTri(vt, v0, v1) // group 0
    pushTri(vt, v1, v2) // group 1
    pushTri(vt, v2, v3) // group 2
    pushTri(vt, v3, v0) // group 3
    // base (two tris) group 4
    const baseStart = indices.length
    pushTri(v0, v1, v2)
    pushTri(v0, v2, v3)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    geo.clearGroups()
    let start = 0
    for (let g = 0; g < 4; g++) { geo.addGroup(start, 3, g); start += 3 }
    geo.addGroup(baseStart, 6, 4)
    return geo
  }

  function addPyramid(pos: THREE.Vector3, base: number, height: number, color: number) {
    const geom = makePyramidGeometry(base, height)
    const mats = [
      new THREE.MeshPhongMaterial({ color: shade(color, 0.9), flatShading: true }),
      new THREE.MeshPhongMaterial({ color: shade(color, 1.05), flatShading: true }),
      new THREE.MeshPhongMaterial({ color: shade(color, 0.95), flatShading: true }),
      new THREE.MeshPhongMaterial({ color: shade(color, 1.1), flatShading: true }),
      new THREE.MeshPhongMaterial({ color: shade(color, 0.85), flatShading: true }),
    ]
    const mesh = new THREE.Mesh(geom, mats)
    scene.add(mesh)
    const body = new CANNON.Body({ mass: 1 })
    body.addShape(pyramidShape(base, height))
    const gy = groundYAt(pos.x, pos.z)
    const y = gy + height / 2 + 0.02
    body.position.set(pos.x, y, pos.z)
    mesh.position.set(pos.x, y, pos.z)
    body.linearDamping = 0.2
    body.angularDamping = 0.4
    body.collisionFilterGroup = GROUP_DYNAMIC
    body.collisionFilterMask = GROUP_GROUND | GROUP_INTERIOR | GROUP_FUNNEL | GROUP_DYNAMIC
    world.addBody(body)
    const radius = (base) / Math.SQRT2
    entities.push({ mesh, body, radius })
  }

  function spawnObjects() {
    const holeR = hole.radius
    const boxSize = { x: 2.0 * 1.5, y: 1.2 * 1.5, z: 1.2 * 1.5 }
    const pyrBase = 1.6 * 1.5, pyrH = 1.6 * 1.5
    const boxRad = Math.hypot(boxSize.x / 2, boxSize.z / 2)
    const pyrRad = (pyrBase / 2) * Math.SQRT2 * 0.5 + 0.3
    const ringRBox = holeR * 3 + boxRad
    const ringRPyr = holeR * 3 + pyrRad
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2
      const isBox = i % 2 === 0
      const r = isBox ? ringRBox : ringRPyr
      const pos = new THREE.Vector3(Math.cos(ang) * r, 0, Math.sin(ang) * r)
      if (isBox) addBox(pos, boxSize, 0x4db3ff)
      else addPyramid(pos, pyrBase, pyrH, 0xffd166)
    }
  }

  // Compute the ground (y=0) quad currently visible by the camera
  function getGroundViewQuad(): THREE.Vector3[] {
    const corners = [
      new THREE.Vector2(-1, -1),
      new THREE.Vector2(1, -1),
      new THREE.Vector2(1, 1),
      new THREE.Vector2(-1, 1),
    ]
    const quad: THREE.Vector3[] = []
    for (const c of corners) {
      raycaster.setFromCamera(c, camera)
      const p = new THREE.Vector3()
      if (raycaster.ray.intersectPlane(plane, p)) quad.push(p.clone())
    }
    return quad
  }

  function randomPointInQuad(q: THREE.Vector3[]): THREE.Vector3 {
    if (q.length < 4) return new THREE.Vector3(hole.object.position.x, 0, hole.object.position.z)
    // Triangles: q0-q1-q2 and q0-q2-q3
    const useFirst = Math.random() < 0.5
    const a = q[0]!, b = q[useFirst ? 1 : 2]!, c = q[useFirst ? 2 : 3]!
    let u = Math.random(), v = Math.random()
    if (u + v > 1) { u = 1 - u; v = 1 - v }
    const ab = new THREE.Vector3().subVectors(b, a)
    const ac = new THREE.Vector3().subVectors(c, a)
    return new THREE.Vector3().copy(a).addScaledVector(ab, u).addScaledVector(ac, v)
  }

  spawnObjects()

  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', onResize)

  const clock = new THREE.Clock()
  function tick() {
    const dt = Math.min(0.05, clock.getDelta())

    // Move hole by input
    let vx = 0, vz = 0
    if (keys.has('a') || keys.has('arrowleft')) vx -= 1
    if (keys.has('d') || keys.has('arrowright')) vx += 1
    if (keys.has('w') || keys.has('arrowup')) vz -= 1
    if (keys.has('s') || keys.has('arrowdown')) vz += 1

    const rWorld = hole.radius * hole.object.scale.x

    if (vx || vz) {
      const inv = 1 / Math.hypot(vx, vz)
      hole.object.position.x += vx * inv * speed * dt
      hole.object.position.z += vz * inv * speed * dt
    } else if (dragging && pointerTarget) {
      // Smoothly move toward pointer target
      const dx = pointerTarget.x - hole.object.position.x
      const dz = pointerTarget.z - hole.object.position.z
      const m = Math.hypot(dx, dz)
      const step = speed * dt
      if (m > step) {
        hole.object.position.x += (dx / m) * step
        hole.object.position.z += (dz / m) * step
      } else {
        hole.object.position.x = pointerTarget.x
        hole.object.position.z = pointerTarget.z
      }
    }

    // Clamp within ground bounds minus radius margin
    const mrg = rWorld + 1
    hole.object.position.x = THREE.MathUtils.clamp(hole.object.position.x, -worldHalf + mrg, worldHalf - mrg)
    hole.object.position.z = THREE.MathUtils.clamp(hole.object.position.z, -worldHalf + mrg, worldHalf - mrg)
    // Move funnel and interior and ground with the hole
    funnel.update(hole.object.position)
    interior.update(hole.object.position)
    ground.update(hole.object.position)

    // Gate ground collisions when centered over the hole to let objects drop
    for (const e of entities) {
      const dx = hole.object.position.x - e.body.position.x
      const dz = hole.object.position.z - e.body.position.z
      const d = Math.hypot(dx, dz)
      const overHole = d < Math.max(0.0, hole.radius - e.radius * 0.6)
      const wantMask = overHole
        ? (GROUP_INTERIOR | GROUP_FUNNEL | GROUP_DYNAMIC)
        : (GROUP_GROUND | GROUP_INTERIOR | GROUP_FUNNEL | GROUP_DYNAMIC)
      if (e.body.collisionFilterMask !== wantMask) {
        e.body.collisionFilterMask = wantMask
        e.body.wakeUp()
      }
    }

    // Step physics
    const fixedDt = 1 / 60
    world.step(fixedDt, dt)

    // After step: update visuals
    for (const e of entities) {
      e.mesh.position.set(e.body.position.x, e.body.position.y, e.body.position.z)
      e.mesh.quaternion.set(e.body.quaternion.x, e.body.quaternion.y, e.body.quaternion.z, e.body.quaternion.w)
    }

    renderer.render(scene, camera)
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

main()
