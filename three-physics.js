import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const host = document.querySelector("#threeViewport");

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.setClearColor(0x071417, 1);

host.append(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 200);

camera.position.set(0, 6, 13);

camera.lookAt(0, 0, 0);

const group = new THREE.Group();

scene.add(group);

scene.add(new THREE.HemisphereLight(0xc8fff4, 0x102426, 2.4));

const light = new THREE.DirectionalLight(0xffffff, 2.2);

light.position.set(7, 10, 8);

scene.add(light);

let experimentId = "accelerator";

let parameters = {};

let running = false;

let movingObjects = [];

let waveMesh;

let circuitParts = {};
let circuitLayout = {};
let circuitCables = [];
let circuitDrag;
let pendingTerminal;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const circuitPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

const circuitDefaults = {
  battery: [-3.4, -1.35, 0],
  switch: [0, -1.35, 0],
  resistor: [0, 1.85, 0],
  bulb: [3.4, .6, 0]
};

function material(color, emissive = 0x000000) {

  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: emissive ? 1.2 : 0, metalness: 0.35, roughness: 0.35 });

}

function mesh(geometry, color, position = [0, 0, 0], glow = 0x000000) {

  const object = new THREE.Mesh(geometry, material(color, glow));

  object.position.set(...position);

  group.add(object);

  return object;

}

function line(points, color = 0x63d6ce) {

  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(...point)));

  const object = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 }));

  group.add(object);

  return object;

}

function clearScene() {

  group.clear();

  movingObjects = [];

  waveMesh = undefined;

}

function ground() {

  const plane = mesh(new THREE.PlaneGeometry(26, 18), 0x112d30, [0, -2, 0]);

  plane.rotation.x = -Math.PI / 2;

}

function makeAccelerator() {

  const radius = Math.max(2.2, Math.min(4.8, 2.4 + (parameters.spannung || 160) / Math.max(parameters.feld || 1, .1) / 95));

  mesh(new THREE.TorusGeometry(radius, 0.28, 16, 96), 0x187a76, [0, 0, 0], 0x083f3d);

  const proton = mesh(new THREE.SphereGeometry(0.22, 20, 16), 0xf4be46, [radius, 0, 0], 0x7b4f00);

  movingObjects.push({ object: proton, type: "orbit", radius });

  for (let index = 0; index < 10; index += 1) {

    const angle = index / 10 * Math.PI * 2;

    mesh(new THREE.BoxGeometry(0.35, 0.65, 0.35), 0x6e8986, [radius * Math.cos(angle), 0, radius * Math.sin(angle)]);

  }

}

function makeMagnet() {

  const strength = (parameters.strom || 0) * (parameters.windungen || 10) / 3000;

  for (let index = -6; index <= 6; index += 1) {

    const coil = mesh(new THREE.TorusGeometry(1.35, 0.07, 10, 32), 0xf4be46, [index * 0.18, 0, 0], 0x604500);

    coil.material.emissiveIntensity = .2 + strength * 3;

    coil.rotation.y = Math.PI / 2;

  }

  mesh(new THREE.CylinderGeometry(0.55, 0.55, 3.1, 24), 0x405c60, [0, 0, 0]).rotation.z = Math.PI / 2;

  const iron = mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), 0xc9d5d2, [1.7 + (parameters.abstand || 8) / 5 - strength, 0, 0]);

  movingObjects.push({ object: iron, type: "iron" });

  for (let size = 2; size <= 4; size += .6) line([[0, 0, -size], [size, 0, 0], [0, 0, size], [-size, 0, 0], [0, 0, -size]]);

}

function makeOrbit(blackHole = false) {

  const distance = blackHole ? (parameters.abstand || 120) / 32 : parameters.abstand || 2;
  const orbitRadius = Math.max(2, Math.min(4.8, distance * 1.9));

  const center = mesh(new THREE.SphereGeometry(blackHole ? 1.15 : 1.35, 48, 32), blackHole ? 0x010203 : 0x2376be, [0, 0, 0], blackHole ? 0x000000 : 0x06264c);

  if (blackHole) {

    const disk = mesh(new THREE.TorusGeometry(2.1, .42, 16, 64), 0xe76f51, [0, 0, 0], 0x652310);

    disk.rotation.x = Math.PI / 2.8;

    center.scale.setScalar(.8);

  }

  if (!blackHole) {

    const orbit = mesh(new THREE.TorusGeometry(orbitRadius, .018, 6, 80), 0x63d6ce, [0, 0, 0]);

    orbit.rotation.x = Math.PI / 2;

  }

  const body = mesh(new THREE.SphereGeometry(.22, 20, 16), 0xf4be46, [orbitRadius, 0, 0], 0x694700);

  if (blackHole) {

    const trail = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xf4be46, transparent: true, opacity: .85 })
    );

    const startMarker = mesh(new THREE.SphereGeometry(.09, 16, 12), 0x63d6ce, [orbitRadius, 0, 0], 0x0b4b49);

    group.add(trail);

    movingObjects.push({ object: body, type: "orbit", radius: orbitRadius, tilted: true, trail, points: [], startMarker });

  } else movingObjects.push({ object: body, type: "orbit", radius: orbitRadius, tilted: false });

}

function makeRocket() {

  ground();

  const rocket = new THREE.Group();

  rocket.add(new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, 2.5, 20), material(0xdfeee7)));

  const nose = new THREE.Mesh(new THREE.ConeGeometry(.35, 1.1, 20), material(0xe76f51));

  nose.position.y = 1.8;

  rocket.add(nose);

  const flame = new THREE.Mesh(new THREE.ConeGeometry(.26, 1.2, 16), material(0xf4be46, 0xa74300));

  flame.position.y = -1.8; flame.rotation.x = Math.PI;

  flame.scale.y = Math.max(.2, Math.min(2.5, (parameters.schub || 100) / 320));

  rocket.add(flame);

  rocket.position.y = -.5;

  group.add(rocket);

  movingObjects.push({ object: rocket, type: "rocket", flame });

}

function makeWaves() {

  const geometry = new THREE.PlaneGeometry(11, 8, 70, 42);

  waveMesh = mesh(geometry, 0x167a76, [0, 0, 0], 0x063d3a);

  waveMesh.rotation.x = -Math.PI / 2;

  waveMesh.material.side = THREE.DoubleSide;

  line([[5.2, .1, -4], [5.2, .1, 4]], 0xf4be46);

}

function makePendulum() {

  const pivot = new THREE.Vector3(0, 3, 0);

  const armOne = new THREE.Group(); const armTwo = new THREE.Group();

  const rodOne = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 2.5, 12), material(0xc9d5d2)); rodOne.position.y = -1.25;

  const bobOne = new THREE.Mesh(new THREE.SphereGeometry(.22, 20, 16), material(0xf4be46)); bobOne.position.y = -2.5;

  armOne.add(rodOne, bobOne); armOne.position.copy(pivot); group.add(armOne);

  const rodTwo = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 2.2, 12), material(0xc9d5d2)); rodTwo.position.y = -1.1;

  const bobTwo = new THREE.Mesh(new THREE.SphereGeometry(.25, 20, 16), material(0xe76f51)); bobTwo.position.y = -2.2;

  armTwo.add(rodTwo, bobTwo); armTwo.position.y = -2.5; armOne.add(armTwo);

  armOne.rotation.z = (parameters.winkel || 30) * Math.PI / 180;

  movingObjects.push({ object: armOne, child: armTwo, type: "pendulum" });

}

function makeOptics() {

  const focalPoint = Math.max(1.4, Math.min(4.8, (parameters.brennweite || 120) / 45));
  const angleShift = (parameters.winkel || 0) / 12;

  line([[-5, 0, 0], [5, 0, 0]], 0x526d70);

  const lens = mesh(new THREE.CylinderGeometry(1.6, 1.6, .18, 32), 0x63d6ce, [0, 0, 0], 0x084a47);

  lens.rotation.x = Math.PI / 2;

  for (const y of [-1, 0, 1]) line([[-5, y + angleShift, 0], [0, y + angleShift, 0], [focalPoint, 0, 0]], 0xe76f51);

}

function makeDrag() {

  ground();

  const objectRadius = Math.max(.35, Math.min(.85, .3 + Math.sqrt(parameters.flaeche || .25)));

  mesh(new THREE.BoxGeometry(4.8, .22, 3.2), 0x405c60, [0, -1.82, 0]);

  line([[-2.4, -1.7, 0], [-2.4, 4.5, 0]], 0x63d6ce);

  for (let height = -1; height <= 4; height += 1) {

    line([[-2.55, height, 0], [-2.2, height, 0]], 0xdfeee7);

  }

  const object = mesh(new THREE.SphereGeometry(objectRadius, 32, 24), 0xf4be46, [0, 4.25, 0], 0x6b4700);

  const airflow = [];

  for (let index = 0; index < 8; index += 1) {

    const streak = line([[2.5, 3.8 - index, .35], [.9, 3.8 - index, .35]], 0x63d6ce);
    airflow.push(streak);

  }

  movingObjects.push({ object, airflow, type: "fall", velocity: 0, grounded: false, radius: objectRadius });

}

function makeElectricity() {

  const current = Math.max(.15, (parameters.spannung || 12) / Math.max(parameters.widerstand || 12, 1));

  line([[-4, 0, 0], [-4, 2, 0], [4, 2, 0], [4, 0, 0], [-4, 0, 0]], 0x63d6ce);
  mesh(new THREE.BoxGeometry(1.4, .7, .7), 0xe76f51, [-3.25, 0, 0], 0x582012);

  const bulb = mesh(new THREE.SphereGeometry(.55, 24, 20), 0xf4be46, [1.8, 2, 0], 0x6f4900);
  bulb.material.emissiveIntensity = Math.min(3, current * .55);

  const charges = Array.from({ length: 7 }, () => mesh(new THREE.SphereGeometry(.12, 16, 12), 0x63d6ce, [-4, 0, .16], 0x084a47));

  movingObjects.push({ charges, bulb, type: "current", current });

}

function makeCircuitBuilder() {

  const closed = circuitIsClosed();
  const current = closed ? (parameters.spannung || 9) / Math.max(parameters.widerstand || 20, 1) : 0;
  let bulb;

  Object.entries(circuitParts).forEach(([part, enabled]) => {
    if (!enabled) return;
    const position = circuitLayout[part];
    const geometry = part === "bulb" ? new THREE.SphereGeometry(.55, 24, 20) : part === "battery" ? new THREE.BoxGeometry(1.3, .7, .7) : part === "resistor" ? new THREE.BoxGeometry(1.4, .34, .4) : new THREE.BoxGeometry(1.1, .15, .18);
    const color = part === "battery" ? 0xe76f51 : part === "resistor" ? 0xf4be46 : part === "bulb" ? 0xf4be46 : 0x63d6ce;
    const object = mesh(geometry, color, position, part === "bulb" ? 0x6f4900 : part === "battery" ? 0x582012 : 0x084a47);
    object.userData.circuitPart = part;
    object.userData.draggable = true;
    if (part === "switch") object.rotation.z = closed ? 0 : -.35;
    if (part === "bulb") {
      bulb = object;
      bulb.material.emissiveIntensity = closed ? Math.min(3, .5 + current * 2) : .12;
    }
    addCircuitTerminals(part);
  });

  circuitCables.forEach(([first, second]) => {
    const start = circuitTerminalPosition(first);
    const end = circuitTerminalPosition(second);
    line([start.toArray(), end.toArray()], 0x63d6ce);
  });

  if (closed && bulb) {
    const charges = Array.from({ length: 8 }, () => mesh(new THREE.SphereGeometry(.12, 16, 12), 0x63d6ce, [-4, -1.2, .16], 0x084a47));
    movingObjects.push({ charges, bulb, path: circuitChargePath(), type: "current", current });
  }

  window.physicsCircuitChanged?.({ parts: circuitParts, closed, cableCount: circuitCables.length });

}

function addCircuitTerminals(part) {

  [-1, 1].forEach((side) => {
    const key = `${part}:${side}`;
    const terminal = mesh(new THREE.SphereGeometry(.18, 16, 12), pendingTerminal === key ? 0xf4be46 : 0x63d6ce, circuitTerminalPosition(key).toArray(), pendingTerminal === key ? 0x6f4900 : 0x084a47);
    terminal.userData.terminal = key;
  });

}

function circuitTerminalPosition(key) {

  const [part, side] = key.split(":");
  const [x, y, z] = circuitLayout[part];
  const offset = part === "bulb" ? .62 : part === "battery" ? .78 : part === "resistor" ? .85 : .72;
  return new THREE.Vector3(x + Number(side) * offset, y, z);

}

function circuitIsClosed() {

  const parts = Object.keys(circuitDefaults).filter((part) => circuitParts[part]);
  if (parts.length !== 4 || circuitCables.length !== 4) return false;

  const terminals = parts.flatMap((part) => [`${part}:-1`, `${part}:1`]);
  if (new Set(circuitCables.flat()).size !== terminals.length) return false;

  const links = new Map(terminals.map((terminal) => [terminal, []]));
  parts.forEach((part) => {
    links.get(`${part}:-1`).push(`${part}:1`);
    links.get(`${part}:1`).push(`${part}:-1`);
  });
  circuitCables.forEach(([first, second]) => {
    links.get(first)?.push(second);
    links.get(second)?.push(first);
  });

  const visited = new Set();
  const queue = [terminals[0]];
  while (queue.length) {
    const terminal = queue.shift();
    if (visited.has(terminal)) continue;
    visited.add(terminal);
    links.get(terminal).forEach((neighbor) => queue.push(neighbor));
  }
  return visited.size === terminals.length;

}

function circuitChargePath() {

  const start = "battery:-1";
  const cableLinks = new Map();
  circuitCables.forEach(([first, second]) => {
    cableLinks.set(first, second);
    cableLinks.set(second, first);
  });

  const points = [];
  let previous;
  let terminal = start;
  do {
    points.push(circuitTerminalPosition(terminal));
    const [part, side] = terminal.split(":");
    const internal = `${part}:${-Number(side)}`;
    const next = internal === previous ? cableLinks.get(terminal) : internal;
    previous = terminal;
    terminal = next;
  } while (terminal && terminal !== start && points.length < 16);

  return points;

}

function resetCircuitWorkspace() {

  circuitLayout = Object.fromEntries(Object.entries(circuitDefaults).map(([part, position]) => [part, [...position]]));
  circuitCables = [];
  circuitDrag = undefined;
  pendingTerminal = undefined;

}

function setCircuitPointer(event) {

  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
  pointer.y = -(event.clientY - bounds.top) / bounds.height * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

}

function circuitObjectAt(event) {

  setCircuitPointer(event);
  const hits = raycaster.intersectObjects(group.children, true);
  return hits.find((hit) => hit.object.userData.terminal)?.object ||
    hits.find((hit) => hit.object.userData.draggable)?.object;

}

function connectCircuitTerminal(terminal) {

  if (!pendingTerminal) {
    pendingTerminal = terminal;
    construct("circuitBuilder");
    return;
  }
  if (pendingTerminal === terminal || pendingTerminal.split(":")[0] === terminal.split(":")[0]) {
    pendingTerminal = undefined;
    return;
  }
  const occupied = new Set(circuitCables.flat());
  if (!occupied.has(pendingTerminal) && !occupied.has(terminal)) circuitCables.push([pendingTerminal, terminal]);
  pendingTerminal = undefined;
  construct("circuitBuilder");

}

function makeHeat() {

  const hotColor = new THREE.Color().setHSL(Math.max(0, .08 - (parameters.heiss || 80) / 1700), .8, .52);
  const coldColor = new THREE.Color().setHSL(.55, .7, .48);
  const hotBlock = mesh(new THREE.BoxGeometry(2.4, 2.6, 1.5), hotColor, [-2.2, 0, 0], 0x612000);
  const coldBlock = mesh(new THREE.BoxGeometry(2.4, 2.6, 1.5), coldColor, [2.2, 0, 0], 0x00384e);

  mesh(new THREE.BoxGeometry(2, .32, .7), 0x9ab2ae, [0, 0, 0]);

  const particles = Array.from({ length: 18 }, (_, index) => mesh(new THREE.SphereGeometry(.1, 12, 10), index % 2 ? 0xf4be46 : 0x63d6ce, [0, 0, 1], index % 2 ? 0x5d3d00 : 0x084a47));

  movingObjects.push({ hotBlock, coldBlock, particles, type: "heatflow" });

}

function makeCollision() {

  ground();

  mesh(new THREE.BoxGeometry(10.5, .2, 2), 0x405c60, [0, -1.55, 0]);

  const radiusOne = Math.max(.35, Math.min(.85, .32 + (parameters.masse1 || 1) / 12));
  const radiusTwo = Math.max(.35, Math.min(.85, .32 + (parameters.masse2 || 1) / 12));
  const first = mesh(new THREE.SphereGeometry(radiusOne, 28, 20), 0xf4be46, [-4, -1 + radiusOne, 0], 0x634200);
  const second = mesh(new THREE.SphereGeometry(radiusTwo, 28, 20), 0xe76f51, [4, -1 + radiusTwo, 0], 0x652310);

  movingObjects.push({ first, second, radiusOne, radiusTwo, firstVelocity: parameters.tempo1 || 4, secondVelocity: parameters.tempo2 || -2, collided: false, type: "collision" });

}

function makeProjectile() {

  ground();

  const angle = (parameters.winkel || 45) * Math.PI / 180;
  const speed = parameters.tempo || 20;
  const ball = mesh(new THREE.SphereGeometry(.25, 24, 18), 0xf4be46, [-4.5, -.9, 0], 0x694700);
  const trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x63d6ce, transparent: true, opacity: .7 }));

  group.add(trail);
  movingObjects.push({ ball, trail, points: [], horizontalVelocity: speed * Math.cos(angle) * .035, verticalVelocity: speed * Math.sin(angle) * .035, landed: false, type: "projectile" });

}

function makeDefault() {

  ground();

  const radius = experimentId === "collision" ? .4 + (parameters.masse1 || 1) / 14 : experimentId === "drag" ? .5 + (parameters.flaeche || .1) : 1.2;
  const sphere = mesh(new THREE.SphereGeometry(radius, 32, 24), 0x63d6ce, [0, 0, 0], 0x073a38);

  movingObjects.push({ object: sphere, type: "spin" });

}

function construct(id) {

  clearScene();

  experimentId = id;

  renderer.setClearColor(id === "blackhole" ? 0x082a55 : 0x071417, 1);

  if (id === "accelerator") makeAccelerator();

  else if (id === "magnetism") makeMagnet();

  else if (id === "gravity") makeOrbit();

  else if (id === "blackhole") makeOrbit(true);

  else if (id === "rocket") makeRocket();

  else if (id === "waves") makeWaves();

  else if (id === "pendulum") makePendulum();

  else if (id === "optics") makeOptics();

  else if (id === "drag") makeDrag();

  else if (id === "electricity") makeElectricity();

  else if (id === "circuitBuilder") makeCircuitBuilder();

  else if (id === "heat") makeHeat();

  else if (id === "collision") makeCollision();

  else if (id === "projectile") makeProjectile();

  else makeDefault();

}

function resize() {

  const width = host.clientWidth || 760; const height = host.clientHeight || 420;

  renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();

}

function animate(clock) {

  requestAnimationFrame(animate);

  if (running) {

    const elapsed = clock * .001;

    const frameSeconds = Math.min(.05, (clock - (animate.previousClock || clock)) * .001);

    movingObjects.forEach((item) => {

      if (item.type === "orbit") {
        const speed = experimentId === "accelerator" ? .4 + (parameters.spannung || 10) / 100 : .15 + (parameters.geschwindigkeit || 3) / 14;
        item.object.position.set(Math.cos(elapsed * speed) * item.radius, item.tilted ? Math.sin(elapsed * speed * 1.7) * .6 : 0, Math.sin(elapsed * speed) * item.radius);

        if (item.trail) {
          item.points.push(item.object.position.clone());
          if (item.points.length > 150) item.points.shift();
          item.trail.geometry.dispose();
          item.trail.geometry = new THREE.BufferGeometry().setFromPoints(item.points);
          if (item.points.length) item.startMarker.position.copy(item.points[0]);
        }
      }

      if (item.type === "rocket") item.object.position.y = Math.min(4.8, -.5 + elapsed % 6 * Math.max(.12, (parameters.schub || 100) / Math.max(parameters.masse || 20, 1) / 90));

      if (item.type === "iron") item.object.position.x = 1.3 + (parameters.abstand || 8) / 5 + .7 * (1 + Math.cos(elapsed * Math.max(.4, (parameters.strom || 1) / 3))) / 2;

      if (item.type === "pendulum") { const amplitude = (parameters.winkel || 30) * Math.PI / 180; const speed = Math.sqrt((parameters.gravitation || 9.81) / 2.5); item.object.rotation.z = amplitude * Math.cos(elapsed * speed); item.child.rotation.z = amplitude * .72 * Math.sin(elapsed * speed * 1.61); }

      if (item.type === "fall" && !item.grounded) {
        const mass = Math.max(parameters.masse || 2, .1);
        const drag = .5 * 1.225 * (parameters.form || .8) * (parameters.flaeche || .25) * item.velocity * Math.abs(item.velocity);
        item.velocity += (9.81 - drag / mass) * frameSeconds;
        item.object.position.y -= item.velocity * frameSeconds * .14;
        item.object.rotation.x += frameSeconds * item.velocity * .8;
        item.airflow.forEach((streak, index) => {
          streak.position.y = ((elapsed * (1.5 + item.velocity / 12) + index * .8) % 6) - 3;
          streak.material.opacity = Math.min(.9, .2 + item.velocity / 18);
        });
        if (item.object.position.y <= -1.25 + item.radius) {
          item.object.position.y = -1.25 + item.radius;
          item.grounded = true;
        }
      }

      if (item.type === "current") {
        const speed = item.current * .55;
        item.charges.forEach((charge, index) => {
          if (item.path?.length) {
            const position = (elapsed * speed * .08 + index / item.charges.length) % 1;
            const segment = position * item.path.length;
            const start = item.path[Math.floor(segment)];
            const end = item.path[(Math.floor(segment) + 1) % item.path.length];
            charge.position.lerpVectors(start, end, segment % 1);
            charge.position.z += .16;
          } else {
            const circuitLength = 12;
            const position = (elapsed * speed + index * circuitLength / item.charges.length) % circuitLength;
            if (position < 4) charge.position.set(-4 + position * 2, 0, .16);
            else if (position < 6) charge.position.set(4, (position - 4) * 1, .16);
            else if (position < 10) charge.position.set(4 - (position - 6) * 2, 2, .16);
            else charge.position.set(-4, 2 - (position - 10), .16);
          }
        });
        item.bulb.material.emissiveIntensity = Math.min(3, .3 + item.current * (1 + Math.sin(elapsed * 7)) * .4);
      }

      if (item.type === "heatflow") {
        const strength = Math.max(.25, (parameters.leitung || 1) / 2);
        item.particles.forEach((particle, index) => {
          particle.position.x = Math.sin(elapsed * strength + index * 1.7) * 3.3;
          particle.position.y = Math.cos(elapsed * strength * 1.8 + index) * .65;
          particle.position.z = .9 + Math.sin(elapsed + index) * .25;
        });
        item.hotBlock.material.emissiveIntensity = .35 + Math.sin(elapsed * strength) * .15;
        item.coldBlock.material.emissiveIntensity = .16 + Math.cos(elapsed * strength) * .08;
      }

      if (item.type === "collision") {
        item.first.position.x += item.firstVelocity * frameSeconds * .42;
        item.second.position.x += item.secondVelocity * frameSeconds * .42;
        if (!item.collided && item.first.position.x + item.radiusOne >= item.second.position.x - item.radiusTwo) {
          const elasticity = parameters.elastizitaet || .7;
          const massOne = parameters.masse1 || 1;
          const massTwo = parameters.masse2 || 1;
          const firstVelocity = item.firstVelocity;
          const secondVelocity = item.secondVelocity;
          item.firstVelocity = (massOne * firstVelocity + massTwo * secondVelocity - massTwo * elasticity * (firstVelocity - secondVelocity)) / (massOne + massTwo);
          item.secondVelocity = (massOne * firstVelocity + massTwo * secondVelocity + massOne * elasticity * (firstVelocity - secondVelocity)) / (massOne + massTwo);
          item.collided = true;
        }
        item.first.rotation.z += item.firstVelocity * frameSeconds;
        item.second.rotation.z += item.secondVelocity * frameSeconds;
      }

      if (item.type === "projectile" && !item.landed) {
        item.verticalVelocity -= (parameters.gravitation || 9.81) * frameSeconds * .035;
        item.ball.position.x += item.horizontalVelocity * frameSeconds;
        item.ball.position.y += item.verticalVelocity * frameSeconds;
        item.points.push(item.ball.position.clone());
        if (item.points.length > 60) item.points.shift();
        const trailGeometry = new THREE.BufferGeometry().setFromPoints(item.points);
        item.trail.geometry.dispose();
        item.trail.geometry = trailGeometry;
        if (item.ball.position.y <= -.9) {
          item.ball.position.y = -.9;
          item.landed = true;
        }
      }

      if (item.type === "spin") item.object.rotation.y += .012;

    });

    if (waveMesh) { const position = waveMesh.geometry.attributes.position; const frequency = parameters.frequenz || 1; const amplitude = (parameters.amplitude || 20) / 100; const speed = parameters.geschwindigkeit || 4; for (let index = 0; index < position.count; index += 1) { const x = position.getX(index); position.setZ(index, amplitude * Math.sin(x * frequency * 1.7 - elapsed * speed) + amplitude * .55 * Math.sin((10 - x) * frequency * 1.7 - elapsed * speed)); } position.needsUpdate = true; waveMesh.geometry.computeVertexNormals(); }

  }

  animate.previousClock = clock;

  renderer.render(scene, camera);

}

window.physics3d = {

  select(id, values) { if (id === "circuitBuilder") resetCircuitWorkspace(); parameters = { ...values }; construct(id); },

  update(values) { parameters = { ...values }; construct(experimentId); },

  setCircuit(parts) {
    circuitParts = { ...parts };
    circuitCables = circuitCables.filter(([first, second]) => circuitParts[first.split(":")[0]] && circuitParts[second.split(":")[0]]);
    if (experimentId === "circuitBuilder") construct(experimentId);
  },

  setRunning(value) { running = value; },

};

renderer.domElement.addEventListener("pointerdown", (event) => {
  if (experimentId !== "circuitBuilder") return;
  const object = circuitObjectAt(event);
  if (object?.userData.terminal) {
    connectCircuitTerminal(object.userData.terminal);
    return;
  }
  if (!object?.userData.draggable) return;
  setCircuitPointer(event);
  const point = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(circuitPlane, point)) return;
  const part = object.userData.circuitPart;
  circuitDrag = { part, offset: new THREE.Vector3(...circuitLayout[part]).sub(point) };
  renderer.domElement.setPointerCapture(event.pointerId);
  event.preventDefault();
});

renderer.domElement.addEventListener("pointermove", (event) => {
  if (!circuitDrag) return;
  setCircuitPointer(event);
  const point = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(circuitPlane, point)) return;
  const position = point.add(circuitDrag.offset);
  circuitLayout[circuitDrag.part] = [
    THREE.MathUtils.clamp(position.x, -4.2, 4.2),
    THREE.MathUtils.clamp(position.y, -2.25, 2.35),
    0
  ];
  construct("circuitBuilder");
});

renderer.domElement.addEventListener("pointerup", (event) => {
  if (!circuitDrag) return;
  circuitDrag = undefined;
  if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
});

window.addEventListener("resize", resize);

resize();

construct("accelerator");

requestAnimationFrame(animate);