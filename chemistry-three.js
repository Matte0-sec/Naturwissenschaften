import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const host = document.querySelector("#chemistryThreeViewport");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x071417, 1);
host.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 16 / 9, .1, 100);
camera.position.set(0, 5.4, 12);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xd8ffe4, 0x102426, 2.4));
const light = new THREE.DirectionalLight(0xffffff, 2.3);
light.position.set(5, 8, 7);
scene.add(light);

const group = new THREE.Group();
scene.add(group);
let bubbles = [];
let reactive = false;
let running = false;
const cameraState = { yaw: 0, pitch: .42, radius: 13.1, drag: undefined };

function updateCamera() {
  const horizontal = cameraState.radius * Math.cos(cameraState.pitch);
  camera.position.set(horizontal * Math.sin(cameraState.yaw), cameraState.radius * Math.sin(cameraState.pitch), horizontal * Math.cos(cameraState.yaw));
  camera.lookAt(0, 0, 0);
}

function resetCamera() { cameraState.yaw = 0; cameraState.pitch = .42; cameraState.radius = 13.1; updateCamera(); }

const labels = document.createElement("div");
labels.className = "chemistry-3d-labels";
labels.innerHTML = "<span>Vor der Säure</span><span>Nach der Säure</span>";
host.append(labels);

function material(color, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: emissive ? .7 : 0, metalness: .55, roughness: .3 });
}

function add(geometry, materialValue, position) {
  const object = new THREE.Mesh(geometry, materialValue);
  object.position.set(...position);
  group.add(object);
  return object;
}

function clear() {
  group.clear();
  bubbles = [];
}

function platform(x) {
  add(new THREE.CylinderGeometry(2.5, 2.5, .2, 48), material(0x294447), [x, -1.75, 0]);
  add(new THREE.CylinderGeometry(2.22, 2.22, .06, 48), material(0x315c62), [x, -1.62, 0]);
}

function sample(x, scale, color, damaged = false) {
  const piece = add(new THREE.DodecahedronGeometry(.95, 1), material(color, damaged ? 0x5c210f : 0x17242a), [x, -.55, 0]);
  piece.scale.set(scale, scale * 1.25, scale);
  piece.rotation.set(.25, .45, .1);
  if (damaged) {
    for (let index = 0; index < 5; index += 1) {
      const pit = add(new THREE.SphereGeometry(.1 + index % 2 * .045, 12, 10), material(0x1a3435), [x + (index - 2) * .19, -.42 + (index % 3 - 1) * .22, .75]);
      pit.scale.setScalar(scale);
    }
  }
}

function cellTissue(x, functional) {
  const damaged = Math.round(12 * (1 - functional / 100));
  for (let index = 0; index < 12; index += 1) {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const impaired = index < damaged;
    const cellX = x - .9 + column * .6;
    const cellY = -.15 + (1 - row) * .62;
    const membrane = add(new THREE.SphereGeometry(.22, 18, 14), material(impaired ? 0xe76f51 : 0x75c6b5, impaired ? 0x50130d : 0x124a42), [cellX, cellY, 0]);
    membrane.scale.y = 1.12;
    const nucleus = add(new THREE.SphereGeometry(.09, 14, 12), material(impaired ? 0x421e22 : 0x405c9d, impaired ? 0x21090b : 0x111b52), [cellX, cellY, .19]);
    if (impaired) add(new THREE.SphereGeometry(.045, 10, 8), material(0xf4be46, 0x7a4800), [cellX + .08, cellY - .04, .25]);
  }
}

function build(materialName, initialMass, remainingMass, functional) {
  clear();
  const materials = {
    magnesium: { color: 0xdfeee7, reactive: true },
    zinc: { color: 0x9aabb0, reactive: true },
    iron: { color: 0xb66d4e, reactive: true },
    copper: { color: 0xe76f51, reactive: false },
  };
  const selected = materials[materialName] || materials.magnesium;
  if (materialName === "cells") {
    const functionValue = functional ?? 100;
    labels.innerHTML = `<span>Vor der Säure<br><b>12 / 12 aktiv</b></span><span>Nach der Säure<br><b>${functionValue.toFixed(1)} % aktiv</b><small>${Math.round(12 * (1 - functionValue / 100))} von 12 geschädigt</small></span>`;
    platform(-3.1);
    platform(3.1);
    cellTissue(-3.1, 100);
    cellTissue(3.1, functionValue);
    reactive = false;
    return;
  }
  reactive = selected.reactive && remainingMass < initialMass;
  const lossPercent = Math.max(0, (1 - remainingMass / initialMass) * 100);
  const afterScale = Math.max(.16, 1 - lossPercent / 18);
  labels.innerHTML = `<span>Vor der Säure<br><b>${initialMass.toFixed(2)} g</b></span><span>Nach der Säure<br><b>${remainingMass.toFixed(2)} g</b><small>−${lossPercent.toFixed(1)} % Masse</small></span>`;
  platform(-3.1);
  platform(3.1);
  sample(-3.1, 1, selected.color);
  sample(3.1, afterScale, selected.color, reactive);

  if (reactive) {
    for (let index = 0; index < 7; index += 1) {
      const debris = add(new THREE.DodecahedronGeometry(.05 + index % 3 * .025, 0), material(0x8a4d31), [2.45 + (index % 4) * .38, -1.5, -.35 + Math.floor(index / 4) * .4]);
      debris.rotation.set(index, index * .7, 0);
    }
    for (let index = 0; index < 14; index += 1) {
      const bubble = add(new THREE.SphereGeometry(.055 + index % 3 * .025, 12, 10), material(0xd8fff4, 0x357b75), [3.1 + (index % 4 - 1.5) * .45, -.8 + (index % 5) * .25, (index % 3 - 1) * .35]);
      bubbles.push({ object: bubble, offset: index * .47 });
    }
  }
}

function resize() {
  const width = host.clientWidth;
  const height = host.clientHeight;
  if (!width || !height) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function animate(now) {
  if (running && reactive) {
    bubbles.forEach(({ object, offset }) => {
      const phase = (now * .001 + offset) % 1.8;
      object.position.y = -.8 + phase * 1.35;
      object.visible = phase < 1.45;
    });
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.chemistry3d = {
  compare(materialName, initialMass, remainingMass, functional) {
    build(materialName, initialMass, remainingMass, functional);
    resize();
  },
  setRunning(value) { running = value; },
};

renderer.domElement.addEventListener("pointerdown", (event) => { cameraState.drag = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }; renderer.domElement.setPointerCapture(event.pointerId); });
renderer.domElement.addEventListener("pointermove", (event) => { if (!cameraState.drag) return; cameraState.yaw -= (event.clientX - cameraState.drag.x) * .012; cameraState.pitch = THREE.MathUtils.clamp(cameraState.pitch + (event.clientY - cameraState.drag.y) * .012, -.45, 1.15); cameraState.drag.x = event.clientX; cameraState.drag.y = event.clientY; updateCamera(); });
renderer.domElement.addEventListener("pointerup", (event) => { if (!cameraState.drag) return; cameraState.drag = undefined; if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId); });
renderer.domElement.addEventListener("wheel", (event) => { event.preventDefault(); cameraState.radius = THREE.MathUtils.clamp(cameraState.radius + event.deltaY * .012, 6, 24); updateCamera(); }, { passive: false });
document.querySelector("[data-camera-reset='chemistry']").addEventListener("click", resetCamera);

window.addEventListener("resize", resize);
resetCamera();
requestAnimationFrame(animate);
