import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1614);
scene.fog = new THREE.FogExp2(0x1a1614, 0.005);

export const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 18, 14);

export const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

export const raycaster = new THREE.Raycaster();
export const mouseVec = new THREE.Vector2();

export const chargeTargetMesh = new THREE.Mesh(
    new THREE.RingGeometry(1, 2.5, 16),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
);
chargeTargetMesh.rotation.x = -Math.PI / 2;
chargeTargetMesh.position.y = 0.05;
chargeTargetMesh.visible = false;
scene.add(chargeTargetMesh);

export function initScene() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.3);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const planeGeo = new THREE.PlaneGeometry(1200, 1200);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x24201c, roughness: 0.9 });
    const floor = new THREE.Mesh(planeGeo, planeMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = "ground_plane";
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(1200, 120, 0x442222, 0x332822);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    createMassiveHumanArmy();
}

function createMassiveHumanArmy() {
    const armyGroup = new THREE.Group();
    armyGroup.position.set(0, 0, -380);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 256);
    skyGrad.addColorStop(0, '#1a0505');
    skyGrad.addColorStop(1, '#7c2d12');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1024, 256);

    const texture = new THREE.CanvasTexture(canvas);
    const bgMat = new THREE.MeshBasicMaterial({ map: texture, fog: false });
    const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(900, 200), bgMat);
    bgMesh.position.set(0, 85, 0);
    armyGroup.add(bgMesh);

    const count = 1500;
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 });

    const chestMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.18, 0.6, 4), bodyMat, count);
    const headMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 6, 6), skinMat, count);

    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let row = 0; row < 12; row++) {
        for (let col = 0; col < 125; col++) {
            if (idx >= count) break;
            const posX = (col - 62) * 3.5 + (row % 2) * 1.7;
            const posZ = row * 4.0;

            dummy.position.set(posX, 0.7, posZ);
            dummy.updateMatrix();
            chestMesh.setMatrixAt(idx, dummy.matrix);

            dummy.position.set(posX, 1.25, posZ);
            dummy.updateMatrix();
            headMesh.setMatrixAt(idx, dummy.matrix);
            idx++;
        }
    }
    chestMesh.instanceMatrix.needsUpdate = true;
    headMesh.instanceMatrix.needsUpdate = true;
    armyGroup.add(chestMesh);
    armyGroup.add(headMesh);
    scene.add(armyGroup);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});