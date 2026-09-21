import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const host = document.querySelector("#biologyThreeViewport");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x071417, 1);
host.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 16 / 9, .1, 100);
camera.position.set(0, 5.5, 12);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xd8ffe4, 0x102426, 2.2));
const light = new THREE.DirectionalLight(0xffffff, 2.5);
light.position.set(5, 8, 7);
scene.add(light);

const group = new THREE.Group();
scene.add(group);
let experimentId = "";
let parameters = {};
let running = false;
let cells = [];
let rays = [];
let photons = [];
let shield;

function material(color, glow = 0x000000) {
  return new THREE.MeshStandardMaterial({ color, emissive: glow, emissiveIntensity: glow ? .9 : 0, roughness: .38, metalness: .16 });
}

function addMesh(geometry, color, position, glow) {
  const object = new THREE.Mesh(geometry, material(color, glow));
  object.position.set(...position);
  group.add(object);
  return object;
}

function line(points, color, opacity = .8) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(...point)));
  const object = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
  group.add(object);
  return object;
}

function clear() {
  group.clear();
  cells = [];
  rays = [];
  photons = [];
  shield = undefined;
}

function createRadiationScene() {
  const dose = parameters.dosis || 2;
  const shielding = parameters.abschirmung || 0;
  const radiationColors = { alpha: 0xe76f51, beta: 0x63d6ce, gamma: 0xf4be46, xray: 0xa582d8 };
  const type = parameters.strahlung || "gamma";
  const radiationColor = radiationColors[type] || radiationColors.gamma;
  const endPositions = { alpha: shielding > 0 ? -1.75 : .5, beta: 1.4, gamma: 6.1, xray: 4.6 };
  const endX = endPositions[type];
  addMesh(new THREE.BoxGeometry(7.5, 4.8, .25), 0x25453d, [1.5, 0, -1.4]);
  addMesh(new THREE.CylinderGeometry(.65, .8, 1.8, 24), 0x6d4f18, [-4.2, 0, 0], 0x4a2600);
  addMesh(new THREE.SphereGeometry(.45, 24, 18), radiationColor, [-4.2, 1.05, 0], radiationColor);

  if (shielding > 0) {
    shield = addMesh(new THREE.BoxGeometry(.12 + shielding * .08, 3.8, 3.7), 0x405c60, [-1.8, 0, 0], 0x122b30);
    shield.material.transparent = true;
    shield.material.opacity = .45;
  }

  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 6; column += 1) {
      const x = -.2 + column * 1.18;
      const y = -1.65 + row * .82;
      const cell = new THREE.Group();
      const membrane = new THREE.Mesh(new THREE.SphereGeometry(.39, 22, 18), material(0x93c976, 0x214a18));
      membrane.material.transparent = true;
      membrane.material.opacity = .58;
      const cytoplasm = new THREE.Mesh(new THREE.SphereGeometry(.31, 20, 16), material(0x5e9f68));
      const nucleus = new THREE.Mesh(new THREE.SphereGeometry(.15, 18, 14), material(0x425a9e, 0x101c55));
      nucleus.position.z = .16;
      const damage = new THREE.Mesh(new THREE.SphereGeometry(.065, 12, 10), material(0xe76f51, 0x641208));
      damage.position.set(.1, .05, .29);
      damage.visible = false;
      cell.add(membrane, cytoplasm, nucleus, damage);
      cell.position.set(x, y, 0);
      group.add(cell);
      cells.push({ object: cell, membrane, nucleus, damage, index: row * 6 + column, column });
    }
  }

  const rayCount = Math.max(3, Math.min(12, Math.round(dose * 2)));
  for (let index = 0; index < rayCount; index += 1) {
    const ray = line([[-3.65, -1.5 + index * .32, .2], [endX, -1.5 + index * .32, .2]], radiationColor, .2 + dose / 14);
    ray.userData.endX = endX;
    rays.push(ray);
    const photon = addMesh(new THREE.SphereGeometry(.07, 12, 10), radiationColor, [-3.65, -1.5 + index * .32, .22], radiationColor);
    photons.push({ object: photon, lane: -1.5 + index * .32, offset: index / rayCount, endX });
  }
}

function createFallback() {
  addMesh(new THREE.SphereGeometry(2.4, 38, 28), 0x5d8b3c, [0, 0, 0], 0x254814);
}

function construct(id) {
  clear();
  experimentId = id;
  if (id === "radiation") createRadiationScene(); else createFallback();
}

function resize() {
  const width = host.clientWidth || 760;
  const height = host.clientHeight || 420;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate(now) {
  requestAnimationFrame(animate);
  if (experimentId === "radiation") {
    const elapsed = now * .001;
    const dose = parameters.dosis || 2;
    const distance = parameters.abstand || 60;
    const shielding = parameters.abschirmung || 0;
    const typeProperties = { alpha: [.7, 1.2], beta: [.9, .55], gamma: [1.35, .18], xray: [1.1, .28] };
    const [quality, shieldFactor] = typeProperties[parameters.strahlung || "gamma"];
    const intensity = Math.min(.9, dose * quality * Math.exp(-shielding * shieldFactor) * (60 / distance) ** 2 / 8);
    rays.forEach((ray, index) => {
      ray.material.opacity = running ? intensity * (.55 + .45 * Math.sin(elapsed * 7 + index)) : .12;
    });
    photons.forEach((photon) => {
      const phase = (elapsed * (running ? 1.4 + intensity * 2 : 0) + photon.offset) % 1;
      photon.object.position.set(-3.65 + phase * (photon.endX + 3.65), photon.lane, .22);
      photon.object.visible = running;
    });
    cells.forEach((cell) => {
      const penetration = cell.object.position.x <= (parameters.strahlung === "gamma" ? 6 : parameters.strahlung === "xray" ? 4.5 : parameters.strahlung === "beta" ? 1.35 : .45) ? 1 : 0;
      const depthFactor = parameters.strahlung === "gamma" ? .9 + cell.column * .025 : parameters.strahlung === "xray" ? Math.max(.18, 1 - cell.column * .14) : parameters.strahlung === "beta" ? Math.max(.08, 1 - cell.column * .32) : Math.max(0, 1 - cell.column * .85);
      const exposure = running ? Math.min(1, intensity * elapsed * .28 * depthFactor * penetration) : 0;
      cell.membrane.material.color.setHSL(.27 - exposure * .22, .44 + exposure * .35, .49);
      cell.membrane.material.emissive.setHex(exposure > .18 ? 0x5a1008 : 0x214a18);
      cell.nucleus.material.color.setHSL(.64 - exposure * .62, .38 + exposure * .4, .43);
      cell.damage.visible = exposure > .12;
      cell.damage.scale.setScalar(Math.max(.2, exposure * 2.3));
      cell.damage.material.emissiveIntensity = exposure * 2;
      cell.object.rotation.y += running ? .012 : 0;
    });
  }
  renderer.render(scene, camera);
}

window.biology3d = {
  select(id, values) { parameters = { ...values }; construct(id); },
  update(values) { parameters = { ...values }; construct(experimentId); },
  setRunning(value) { running = value; },
};

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(animate);
