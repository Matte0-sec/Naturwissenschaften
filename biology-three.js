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
let virusCells = [];
let virusParticles = [];
let virusOrgans = [];
let virusLesions = [];
let inflammation;
let experimentObjects = [];
let experimentParticles = [];

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
  virusCells = [];
  virusParticles = [];
  virusOrgans = [];
  virusLesions = [];
  inflammation = undefined;
  experimentObjects = [];
  experimentParticles = [];
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

function createExperimentScene(id) {
  if (id === "photosynthesis") {
    const leaf = addMesh(new THREE.SphereGeometry(1.9, 32, 20), 0x5d8b3c, [0, 0, 0], 0x254814); leaf.scale.set(1.15, .22, .72); experimentObjects.push(leaf);
    addMesh(new THREE.CylinderGeometry(.16, .24, 2.6, 12), 0x456a2e, [0, -2.1, 0]);
    addMesh(new THREE.SphereGeometry(.55, 24, 18), 0xf4be46, [3.6, 2.6, 0], 0x9d6310);
    for (let index = 0; index < 18; index += 1) experimentParticles.push({ object: addMesh(new THREE.SphereGeometry(.08, 12, 10), 0x63d6ce, [-3 + index % 6, 1.5 - Math.floor(index / 6) * 1.25, .4], 0x1f7772), offset: index / 18, kind: "light" });
  } else if (id === "enzymes") {
    const enzyme = addMesh(new THREE.TorusGeometry(1.45, .38, 18, 42), 0x5d8b3c, [0, 0, 0], 0x254814); enzyme.rotation.x = Math.PI / 2; experimentObjects.push(enzyme);
    for (let index = 0; index < 16; index += 1) experimentParticles.push({ object: addMesh(new THREE.SphereGeometry(.16, 14, 12), index % 2 ? 0xf4be46 : 0x63d6ce, [-3 + index % 5 * 1.2, -1.5 + Math.floor(index / 5) * 1.1, .6], 0x5a4710), offset: index / 16, kind: "substrate" });
  } else if (id === "osmosis") {
    const cell = addMesh(new THREE.SphereGeometry(2, 34, 26), 0x63d6ce, [0, 0, 0], 0x174f56); cell.material.transparent = true; cell.material.opacity = .42; experimentObjects.push(cell);
    addMesh(new THREE.SphereGeometry(.7, 24, 18), 0x425a9e, [0, 0, 0], 0x101c55);
    for (let index = 0; index < 28; index += 1) experimentParticles.push({ object: addMesh(new THREE.SphereGeometry(.07, 10, 8), 0xdfeee7, [-3 + index % 7, -1.7 + Math.floor(index / 7) * 1.15, .2], 0x779ca0), offset: index / 28, kind: "water" });
  } else if (id === "respiration") {
    const mitochondrion = addMesh(new THREE.SphereGeometry(2.1, 36, 24), 0xe76f51, [0, 0, 0], 0x641208); mitochondrion.scale.set(1.25, .58, .72); experimentObjects.push(mitochondrion);
    for (let index = -2; index <= 2; index += 1) line([[-1.7, index * .42, .95], [0, index * .25, 1.2], [1.7, index * .42, .95]], 0xf4be46, .8);
    for (let index = 0; index < 18; index += 1) experimentParticles.push({ object: addMesh(new THREE.SphereGeometry(.11, 12, 10), index % 3 ? 0xf4be46 : 0x63d6ce, [-3 + index % 6, -1.4 + Math.floor(index / 6) * 1.2, .6], 0x355e72), offset: index / 18, kind: "energy" });
  } else if (id === "population") {
    addMesh(new THREE.CylinderGeometry(3.8, 4.3, .35, 48), 0x365b36, [0, -2.1, 0], 0x173b22);
    const count = Math.max(6, Math.min(42, Math.round((parameters.start || 25) / 5)));
    for (let index = 0; index < count; index += 1) experimentParticles.push({ object: addMesh(new THREE.SphereGeometry(.13, 12, 10), 0xb9d983, [Math.cos(index * 2.4) * (1 + index % 4 * .5), -1.65, Math.sin(index * 2.4) * (1 + index % 4 * .5)], 0x456a2e), offset: index / count, kind: "organism" });
  }
}

function createVirusScene() {
  const organ = parameters.organ || "lung";
  const virus = parameters.virus || "influenza";
  const organColors = { lung: 0xe99b9b, liver: 0xa85d45, heart: 0xd45b5b, brain: 0xd8af9b };
  const virusColors = { influenza: 0x63d6ce, corona: 0x4c9be8, hepatitis: 0xf4be46, coxsackie: 0xe76f51, zika: 0xa582d8 };
  const organColor = organColors[organ];
  const virusColor = virusColors[virus];

  if (organ === "lung") {
    virusOrgans.push(addMesh(new THREE.SphereGeometry(1.45, 32, 24), organColor, [-.9, 0, 0], 0x5c1818));
    virusOrgans.push(addMesh(new THREE.SphereGeometry(1.45, 32, 24), organColor, [.9, 0, 0], 0x5c1818));
    line([[0, 2.4, 0], [0, .5, 0], [-.65, .05, 0]], 0xdfeee7);
    line([[0, .5, 0], [.65, .05, 0]], 0xdfeee7);
  } else if (organ === "liver") {
    const liver = addMesh(new THREE.SphereGeometry(2.35, 1.25, 1.05, 38, 24), organColor, [0, 0, 0], 0x512116);
    virusOrgans.push(liver);
    liver.scale.set(1, .65, 1);
  }
  else if (organ === "heart") {
    const heart = addMesh(new THREE.SphereGeometry(1.55, 32, 24), organColor, [0, 0, 0], 0x611619); virusOrgans.push(heart);
    heart.scale.set(.82, 1.05, .75); heart.rotation.z = -.25;
  } else {
    const brain = addMesh(new THREE.SphereGeometry(2.25, 38, 28), organColor, [0, 0, 0], 0x6d4538); virusOrgans.push(brain); brain.scale.set(1.1, .72, .82);
    for (let index = -2; index <= 2; index += 1) line([[-1.7, index * .42, .75], [1.7, index * .42, .75]], 0x9f7968, .55);
  }

  for (let index = 0; index < 34; index += 1) {
    const angle = index * 2.4;
    const radius = .35 + (index % 6) * .28;
    const cell = addMesh(new THREE.SphereGeometry(.12, 14, 12), 0x87b85c, [Math.cos(angle) * radius, Math.sin(angle) * radius * .7, .9], 0x214a18);
    virusCells.push(cell);
  }
  const virusGeometry = {
    influenza: new THREE.SphereGeometry(.14, 16, 12),
    corona: new THREE.IcosahedronGeometry(.15, 1),
    hepatitis: new THREE.CylinderGeometry(.11, .11, .25, 6),
    coxsackie: new THREE.DodecahedronGeometry(.14, 0),
    zika: new THREE.ConeGeometry(.14, .28, 12),
  }[virus];
  for (let index = 0; index < 12; index += 1) {
    const particle = addMesh(virusGeometry, virusColor, [-4 + index * .24, -1.6 + index % 4 * .65, 1], virusColor);
    virusParticles.push({ object: particle, offset: index / 12 });
  }

  inflammation = addMesh(new THREE.SphereGeometry(2.7, 36, 24), 0xe76f51, [0, 0, -.2], 0x641208);
  inflammation.material.transparent = true;
  inflammation.material.opacity = 0;
  for (let index = 0; index < 9; index += 1) {
    const lesion = addMesh(new THREE.SphereGeometry(.2, 16, 12), 0xe76f51, [Math.cos(index * 2.1) * (1 + index % 3 * .3), Math.sin(index * 2.1) * .95, 1.08], 0x641208);
    lesion.visible = false;
    virusLesions.push(lesion);
  }
}

function construct(id) {
  clear();
  experimentId = id;
  if (id === "radiation") createRadiationScene(); else if (id === "viruses") createVirusScene(); else createExperimentScene(id);
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
  const elapsed = now * .001;
  if (experimentId === "radiation") {
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
  if (experimentId === "viruses") {
    const compatibility = { influenza: { lung: 1, liver: .15, heart: .25, brain: .15 }, corona: { lung: 1, liver: .2, heart: .4, brain: .2 }, hepatitis: { lung: .1, liver: 1, heart: .12, brain: .08 }, coxsackie: { lung: .25, liver: .2, heart: 1, brain: .18 }, zika: { lung: .1, liver: .15, heart: .12, brain: 1 } };
    const profiles = window.virusProfiles || { influenza: { onset: .65, impact: .82, inflammation: .65, functionLoss: .82 }, corona: { onset: .82, impact: 1.05, inflammation: 1.3, functionLoss: 1.12 }, hepatitis: { onset: 1.65, impact: .7, inflammation: .5, functionLoss: 1.2 }, coxsackie: { onset: .72, impact: 1.12, inflammation: 1.05, functionLoss: 1.3 }, zika: { onset: 1.2, impact: .78, inflammation: .72, functionLoss: 1.05 } };
    const virus = parameters.virus || "influenza";
    const profile = profiles[virus];
    const risk = compatibility[parameters.virus || "influenza"][parameters.organ || "lung"];
    const damage = running ? Math.min(1, (parameters.viruslast || 35) / 100 * risk * profile.impact * (1 - (parameters.abwehr || 55) / 145) * Math.pow(Math.min(1, elapsed / 10), profile.onset)) : 0;
    virusParticles.forEach((particle, index) => { const phase = (elapsed * (running ? .7 + 1.15 / profile.onset : 0) + particle.offset) % 1; particle.object.position.x = -4 + phase * 3.7; particle.object.position.y = -1.6 + index % 4 * .65 + Math.sin(elapsed * (2 + profile.inflammation) + index) * (.05 + profile.inflammation * .05); particle.object.scale.setScalar(.65 + phase * (.4 + profile.impact * .25)); particle.object.rotation.y += .025 + profile.impact * .035; });
    virusCells.forEach((cell, index) => { const infected = index / virusCells.length < damage; cell.material.color.setHex(infected ? 0xe76f51 : 0x87b85c); cell.material.emissive.setHex(infected ? 0x641208 : 0x214a18); cell.material.emissiveIntensity = infected ? 1.2 : .45; cell.scale.setScalar(infected ? 1.4 : 1); });
    virusOrgans.forEach((organ) => { organ.material.color.lerp(new THREE.Color(damage > .35 ? 0x8d2b2b : 0xcf6c63), damage * .08); organ.material.emissive.setHex(damage > .08 ? 0x641208 : 0x000000); organ.material.emissiveIntensity = damage * (.7 + .25 * Math.sin(elapsed * 5)); });
    if (inflammation) { inflammation.material.opacity = damage * .22 * profile.inflammation; inflammation.scale.setScalar(1 + damage * (.12 + profile.inflammation * .1) + Math.sin(elapsed * (3 + profile.inflammation * 2)) * damage * .05); }
    virusLesions.forEach((lesion, index) => { const visible = index / virusLesions.length < damage * (.7 + profile.functionLoss * .25); lesion.visible = visible; lesion.scale.setScalar(visible ? .4 + damage * (1.1 + profile.functionLoss) + Math.sin(elapsed * (4 + profile.impact * 2) + index) * .12 : .1); });
  }
  if (experimentId === "photosynthesis") {
    const rate = (parameters.licht || 55) / 100 * (parameters.co2 || 420) / ((parameters.co2 || 420) + 250) * Math.exp(-(((parameters.temperatur || 22) - 25) ** 2) / 180);
    experimentObjects[0]?.scale.set(1.15, .22 + rate * .18, .72 + rate * .22);
    experimentParticles.forEach((particle, index) => { const phase = (elapsed * (running ? .45 + rate * 1.6 : 0) + particle.offset) % 1; particle.object.position.set(3.25 - phase * 5.5, 2.35 - phase * 2.25 + Math.sin(elapsed * 3 + index) * .1, .4); particle.object.visible = rate > .03; });
  }
  if (experimentId === "enzymes") {
    const activity = Math.exp(-(((parameters.temperatur || 25) - 37) ** 2) / 170) * Math.exp(-(((parameters.ph || 7) - 7) ** 2) / 3) * (parameters.substrat || 1) / ((parameters.substrat || 1) + .5);
    experimentObjects[0]?.material.color.setHSL(.28 - activity * .08, .35 + activity * .35, .32 + activity * .22);
    experimentParticles.forEach((particle, index) => { const angle = elapsed * (running ? .6 + activity * 2 : 0) + particle.offset * Math.PI * 2; particle.object.position.set(Math.cos(angle) * (2.5 - activity), Math.sin(angle * 1.7) * 1.45, .55); particle.object.scale.setScalar(.55 + activity); });
  }
  if (experimentId === "osmosis") {
    const difference = (parameters.aussen || .8) - (parameters.innen || .4); const volume = Math.max(.55, Math.min(1.35, (parameters.volumen || 55) / 55 - difference * .45));
    experimentObjects[0]?.scale.setScalar(volume);
    experimentParticles.forEach((particle, index) => { const direction = difference >= 0 ? -1 : 1; const phase = (elapsed * (running ? .3 + Math.abs(difference) * 1.5 : 0) + particle.offset) % 1; particle.object.position.set(3 * direction - phase * direction * 5.3, -1.6 + index % 7 * .52, .25); });
  }
  if (experimentId === "respiration") {
    const rate = (parameters.glucose || 1.5) * (parameters.sauerstoff || 12) / ((parameters.sauerstoff || 12) + 4) * Math.exp(-(((parameters.temperatur || 25) - 37) ** 2) / 150);
    if (experimentObjects[0]) experimentObjects[0].material.emissiveIntensity = .25 + Math.min(1, rate / 2) * 1.2;
    experimentParticles.forEach((particle, index) => { const phase = (elapsed * (running ? .4 + rate : 0) + particle.offset) % 1; particle.object.position.set(-3 + phase * 5.8, -1.25 + index % 6 * .5, .65 + Math.sin(elapsed * 3 + index) * .12); particle.object.material.color.setHex(phase > .72 ? 0x63d6ce : index % 3 ? 0xf4be46 : 0xdfeee7); });
  }
  if (experimentId === "population") {
    const rate = parameters.rate || .35; const capacity = parameters.kapazitaet || 800; const visibleCount = Math.max(4, Math.min(experimentParticles.length, Math.round(capacity / 50)));
    experimentParticles.forEach((particle, index) => { particle.object.visible = index < visibleCount; const angle = elapsed * (running ? rate : 0) + particle.offset * Math.PI * 2; const radius = 1 + (index % 4) * .48; particle.object.position.set(Math.cos(angle) * radius, -1.65 + Math.sin(elapsed * 3 + index) * .05, Math.sin(angle) * radius); });
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
