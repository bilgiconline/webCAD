import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth / 1.35, window.innerHeight / 1.4);
camera.position.z = 35;

// Function to fit camera view to the element
function fitViewToElement(element) {
  const box = new THREE.Box3().setFromObject(element);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

  camera.position.copy(center);
  camera.position.z += cameraZ;
  camera.lookAt(center);
}

// Orbit controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// Render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update();
}


export function createGeometry(fullPoints){
    let newGeometryPoints = [];
    newGeometryPoints.pop();
  //  clearScene(scene);
    // fullPoints dizisindeki her noktayı THREE.Vector3 nesnesine dönüştürüp newGeometryPoints dizisine ekliyoruz
    fullPoints.forEach(function (point) {
        newGeometryPoints.push(new THREE.Vector2(point[0], point[1])); 
    });

// shape
var geomShape = new THREE.ShapeGeometry(new THREE.Shape(newGeometryPoints));
var matShape = new THREE.MeshBasicMaterial({color:"blue"});
var shape = new THREE.Mesh(geomShape, matShape);
scene.add(shape);
const extrudeSettings = {
	steps: 2,
	depth: 7,
	bevelEnabled: true,
	bevelThickness: 1,
	bevelSize: 0,
	bevelOffset: 0,
	bevelSegments: 1
};
const geometry = new THREE.ExtrudeGeometry( new THREE.Shape(newGeometryPoints), extrudeSettings );
const material = new THREE.MeshBasicMaterial( { color: "yellow" } );
const mesh = new THREE.Mesh( geometry, material ) ;
scene.add( mesh );
const edges = new THREE.EdgesGeometry( geometry ); 
const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial( { color: "black" } ) ); 
scene.add( line );
    fitViewToElement(shape);
    // Render scene
    animate();
}

// Function to clear scene
function clearScene(scene) {
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
}


// Exported function to show Three.js content in popup
export function showThreeJS() {
    const container = document.getElementById('threejs-popup-container');
    if (container.children.length === 0) {
        container.appendChild(renderer.domElement);
    }
}
