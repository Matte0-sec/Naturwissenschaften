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

  const orbit = mesh(new THREE.TorusGeometry(orbitRadius, .018, 6, 80), 0x63d6ce, [0, 0, 0]);

  orbit.rotation.x = Math.PI / 2;

  const body = mesh(new THREE.SphereGeometry(.22, 20, 16), 0xf4be46, [orbitRadius, 0, 0], 0x694700);

  movingObjects.push({ object: body, type: "orbit", radius: orbitRadius, tilted: blackHole });

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

function makeDefault() {

  ground();

  const radius = experimentId === "collision" ? .4 + (parameters.masse1 || 1) / 14 : experimentId === "drag" ? .5 + (parameters.flaeche || .1) : 1.2;
  const sphere = mesh(new THREE.SphereGeometry(radius, 32, 24), 0x63d6ce, [0, 0, 0], 0x073a38);

  movingObjects.push({ object: sphere, type: "spin" });

}

function construct(id) {

  clearScene();

  experimentId = id;

  if (id === "accelerator") makeAccelerator();

  else if (id === "magnetism") makeMagnet();

  else if (id === "gravity") makeOrbit();

  else if (id === "blackhole") makeOrbit(true);

  else if (id === "rocket") makeRocket();

  else if (id === "waves") makeWaves();

  else if (id === "pendulum") makePendulum();

  else if (id === "optics") makeOptics();

  else if (id === "drag") makeDrag();

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

      if (item.type === "orbit") { const speed = experimentId === "accelerator" ? .4 + (parameters.spannung || 10) / 100 : .15 + (parameters.geschwindigkeit || 3) / 14; item.object.position.set(Math.cos(elapsed * speed) * item.radius, item.tilted ? Math.sin(elapsed * speed * 1.7) * .6 : 0, Math.sin(elapsed * speed) * item.radius); }

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

      if (item.type === "spin") item.object.rotation.y += .012;

    });

    if (waveMesh) { const position = waveMesh.geometry.attributes.position; const frequency = parameters.frequenz || 1; const amplitude = (parameters.amplitude || 20) / 100; const speed = parameters.geschwindigkeit || 4; for (let index = 0; index < position.count; index += 1) { const x = position.getX(index); position.setZ(index, amplitude * Math.sin(x * frequency * 1.7 - elapsed * speed) + amplitude * .55 * Math.sin((10 - x) * frequency * 1.7 - elapsed * speed)); } position.needsUpdate = true; waveMesh.geometry.computeVertexNormals(); }

  }

  animate.previousClock = clock;

  renderer.render(scene, camera);

}

window.physics3d = {

  select(id, values) { parameters = { ...values }; construct(id); },

  update(values) { parameters = { ...values }; construct(experimentId); },

  setRunning(value) { running = value; },

};

window.addEventListener("resize", resize);

resize();

construct("accelerator");

requestAnimationFrame(animate);