import * as THREE from "three";
import GUI from "lil-gui";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { clock, pauseClock, resumeClock } from "./clock";

let vertexMeshes;

// Debug UI using lil-gui ------------------------------------------------------
const debugObject = {
  wireframe: false,
  displayCube: false,
  cubeSegmentation: 4,
  cubeSize: 6,
  displayPoints: true,
  rotation: true,
  sphereRadius: 0.05
};

const gui = new GUI({
  width: 340,
  title: "Demo",
});

// Hide/Show the debug window on keypress('h')
window.addEventListener("keydown", (event) => {
  if (event.key == "h") {
    gui._hidden ? gui.show() : gui.hide();
  }
});
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// * Base
const canvas = document.querySelector("canvas.webgl");

// Raycaster: Look it up
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Constants for the canvas area dimensions.
const renderSizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75, // fov(vertical)
  renderSizes.width / renderSizes.height,
  0.1, // Near clipping
  100 // Far clipping
);

camera.position.x = 5;
camera.position.y = 5;
camera.position.z = 8;

// Orbit Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; // momentum

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(renderSizes.width, renderSizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Cube
const cubeSize = debugObject.cubeSize;
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize, 4, 4, 4),
  new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);
cube.visible = false;

// Setup debug UI controls for the cube
const debugCubeFolder = gui.addFolder("Cube");

debugCubeFolder.add(cube, "visible").name("Cube Visible");
debugCubeFolder
  .add(cube.material, "wireframe")
  .name("Wireframe")
  .setValue(true);
debugCubeFolder
  .add(debugObject, "cubeSegmentation")
  .min(1)
  .max(20)
  .step(1)
  .onFinishChange(redrawCube);
debugCubeFolder
  .add(debugObject, "cubeSize")
  .min(2)
  .max(15)
  .step(1)
  .name("Cube Size")
  .onFinishChange(redrawCube);
debugCubeFolder
  .add(debugObject, "rotation")
  .name("Rotation")
  .onChange(() => {
    clock.running ? pauseClock() : resumeClock();
  });

scene.add(cube);

// -----------------------------------------------------------------------------

// * Let's try to find the vertices now
// Making this a function to redraw it when segmentation changes(check above.)

vertexMeshes = generateVertexMeshes();
scene.add(vertexMeshes);

// -----------------------------------------------------------------------------

// Vertex Points Debug UI setup
debugCubeFolder
  .add(debugObject, "displayPoints")
  .onChange((value) => {
    vertexMeshes.visible = value;
  })
  .name("Display Vertices");

// -----------------------------------------------------------------------------

// Animation

// This seems to work like crap with the controls for now.
// function animate() {
//   renderer.render(scene, camera);
// }
// renderer.setAnimationLoop(animate);

function tick() {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Rotate the cube. might add a control in the debug ui later.
  if (debugObject.rotation) {
    cube.rotation.y = elapsedTime * 0.15;
    cube.rotation.x = elapsedTime * 0.075;
    vertexMeshes.rotation.y = elapsedTime * 0.15;
    vertexMeshes.rotation.x = elapsedTime * 0.075;
  }

  // Render the scene.
  renderer.render(scene, camera);

  // Call tick again on the next frame.
  window.requestAnimationFrame(tick);
}

// -----------------------------------------------------------------------------
function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  handleMouseOver();
}

function handleMouseOver() {
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(vertexMeshes.children);
  if (intersects.length > 0) {
    // No idea why. there's always one object being intersected
    for (let i = 0; i < intersects.length; i++) {
      const child = intersects[i].object;
      child.material.color.set(0x00ff00);

      child.geometry.dispose();
      child.geometry = new THREE.SphereGeometry(debugObject.sphereRadius * 1.5, 16, 16);
    }
    // console.log(intersects);
  }
}

function generateVertexMeshes() {
  const vertexPoints = new THREE.Group();

  const vertices = cube.geometry.attributes.position.array;
  console.log(vertices);

  // Gonna render them separately using sphere geometry to make them interactive.
  // Could've used points, but making them spheres that way was a pain plus
  //   no interaction.

  // Reusing the same material for all spheres.
  const sphereRadius = debugObject.sphereRadius;
  for (let i = 0; i < vertices.length; i += 3) {
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 16, 16);
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(vertices[i], vertices[i + 1], vertices[i + 2]);
    vertexPoints.add(sphere);
  }
  return vertexPoints;
}

function onWindowResize() {
  // Set new width and height for render
  console.log("resizing...");
  renderSizes.width = window.innerWidth;
  renderSizes.height = window.innerHeight;

  // This will also mess with our camera (creates distortion). Needs reset.
  camera.aspect = renderSizes.width / renderSizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(renderSizes.width, renderSizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function redrawCube() {
  // Redraw the cube with the new geometry.
  const cubeSegments = debugObject.cubeSegmentation;
  cube.geometry.dispose();
  const cubeSize = debugObject.cubeSize;
  cube.geometry = new THREE.BoxGeometry(
    cubeSize,
    cubeSize,
    cubeSize,
    cubeSegments,
    cubeSegments,
    cubeSegments
  );
  // Remove the current points and reset.
  scene.remove(vertexMeshes);
  vertexMeshes.remove();
  vertexMeshes = generateVertexMeshes();
  vertexMeshes.visible = debugObject.displayPoints;
  scene.add(vertexMeshes);
}

window.addEventListener("pointermove", onPointerMove);
window.addEventListener("resize", onWindowResize);
// -----------------------------------------------------------------------------

tick();
