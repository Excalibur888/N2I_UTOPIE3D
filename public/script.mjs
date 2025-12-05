import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const fileInput = document.getElementById("input-file");
const renderDiv = document.getElementById("file-render");
const modelColorInput = document.getElementById("color-picker");
const lightColorInput = document.getElementById("light-picker");
const infoFields = {
    height: document.getElementById("height-field"),
    width: document.getElementById("width-field"),
    depth: document.getElementById("depth-field"),
    volume: document.getElementById("volume-field")
};

let stlModel = null;
let stlFile = null;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const light = new THREE.HemisphereLight(0xffffff, 0x9e9e9e, 5);
scene.add(light);

const camera = new THREE.PerspectiveCamera(
    75,
    renderDiv.clientWidth / renderDiv.clientHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(renderDiv.clientWidth, renderDiv.clientHeight);
renderDiv.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const stlLoader = new STLLoader();

function loadStlGeometry(geometry) {

    if (stlModel) scene.remove(stlModel);

    geometry.computeBoundingBox();
    const box = geometry.boundingBox;

    const lengthX = box.max.x - box.min.x;
    const lengthY = box.max.y - box.min.y;
    const lengthZ = box.max.z - box.min.z;

    let volume = 0;
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
        const ax = pos.getX(i), ay = pos.getY(i), az = pos.getZ(i);
        const bx = pos.getX(i + 1), by = pos.getY(i + 1), bz = pos.getZ(i + 1);
        const cx = pos.getX(i + 2), cy = pos.getY(i + 2), cz = pos.getZ(i + 2);

        volume += (ax * (by * cz - bz * cy) -
            ay * (bx * cz - bz * cx) +
            az * (bx * cy - by * cx)) / 6;
    }
    volume = Math.abs(volume);

    infoFields.height.textContent = lengthY.toFixed(2);
    infoFields.width.textContent = lengthX.toFixed(2);
    infoFields.depth.textContent = lengthZ.toFixed(2);
    infoFields.volume.textContent = volume.toFixed(2);

    const material = new THREE.MeshStandardMaterial({
        color: 0x606060,
        metalness: 0.3,
        roughness: 0.8
    });

    stlModel = new THREE.Mesh(geometry, material);

    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;

    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 5 / maxDim;
    stlModel.scale.setScalar(scaleFactor);

    const center = new THREE.Vector3();
    bbox.getCenter(center);
    stlModel.position.set(
        -center.x * scaleFactor,
        -center.y * scaleFactor,
        -center.z * scaleFactor
    );

    scene.add(stlModel);

    const sphere = new THREE.Sphere();
    bbox.getBoundingSphere(sphere);
    const radius = sphere.radius * scaleFactor;

    camera.position.set(0, radius * 2, radius * 2);

    controls.target.set(0, 0, 0);
    controls.update();
}

function onWindowResize() {
    camera.aspect = renderDiv.clientWidth / renderDiv.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(renderDiv.clientWidth, renderDiv.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (stlModel) {
        stlModel.rotation.y += 0.01;
    }
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', onWindowResize, false);

fileInput.onchange = function () {
    const file = this.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.stl')) {
        alert('Please select a valid STL file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        stlFile = e.target.result;
        const geometry = stlLoader.parse(stlFile);
        loadStlGeometry(geometry);
    };
    reader.readAsArrayBuffer(file);

    animate();
    document.getElementById("file-upload").style.display = "none";
    document.getElementById("info-popup").style.opacity = "1";
    document.getElementById("controls-popup").style.opacity = "1";
    document.getElementById("render").style.opacity = "1";
}

function dropHandler(ev) {
    ev.preventDefault();

    const files = [...ev.dataTransfer.items]
        .map(item => item.getAsFile())
        .filter(file => file && file.name.endsWith('.stl'));

    if (!files.length) return;

    const dt = new DataTransfer();
    files.forEach(file => dt.items.add(file));

    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event('change'));
}

const dropZone = document.getElementById("drop-zone");
dropZone.addEventListener("drop", dropHandler);

window.addEventListener("drop", (e) => {
    if ([...e.dataTransfer.items].some((item) => item.kind === "file")) {
        e.preventDefault();
    }
});

dropZone.addEventListener("dragover", (e) => {
    const fileItems = [...e.dataTransfer.items].filter(
        (item) => item.kind === "file",
    );
    if (fileItems.length > 0) {
        e.preventDefault();
        dropZone.classList.add("hovered");
        e.dataTransfer.dropEffect = "copy";
    }
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("hovered");
});

window.addEventListener("dragover", (e) => {
    const fileItems = [...e.dataTransfer.items].filter(
        (item) => item.kind === "file",
    );
    if (fileItems.length > 0) {
        e.preventDefault();
        if (!dropZone.contains(e.target)) {
            e.dataTransfer.dropEffect = "none";
        }
    }
});

modelColorInput.onchange = function () {
    if (stlModel) {
        stlModel.material.color.set(this.value);
    }
}

lightColorInput.onchange = function () {
    light.color.set(this.value);
}