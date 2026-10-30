import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export function createArticulatedHumanoid(isPlayer, baseColor = 0x2563eb, bodyType = 'normal', isAlly = false) {
    const root = new THREE.Group();

    let scaleY = 1.0, scaleW = 1.0;
    if (!isPlayer && !isAlly) {
        if (bodyType === 'tall_slim') { scaleY = 1.15; scaleW = 0.85; }
        else if (bodyType === 'short_stocky') { scaleY = 0.9; scaleW = 1.25; }
    }

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 });
    const armorMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.5 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });

    const pelvis = new THREE.Group();
    pelvis.position.y = 1.0 * scaleY;
    root.add(pelvis);
    
    const pelvisMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32 * scaleW, 0.18, 0.24 * scaleW), darkMat);
    pelvis.add(pelvisMesh);

    const abdomen = new THREE.Group();
    abdomen.position.y = 0.14;
    pelvis.add(abdomen);
    const abMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scaleW, 0.2 * scaleW, 0.28, 6), darkMat);
    abMesh.position.y = 0.14;
    abdomen.add(abMesh);

    const chest = new THREE.Group();
    chest.position.y = 0.32;
    abdomen.add(chest);
    const chestMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scaleW, 0.22 * scaleW, 0.45, 6), armorMat);
    chestMesh.position.y = 0.22;
    chest.add(chestMesh);

    const neck = new THREE.Group();
    neck.position.y = 0.48;
    chest.add(neck);
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.14, 6), skinMat);
    neckMesh.position.y = 0.07;
    neck.add(neckMesh);

    const head = new THREE.Group();
    head.position.y = 0.15;
    neck.add(head);
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.17, 6, 6), skinMat);
    headMesh.position.y = 0.1;
    head.add(headMesh);
    const helmetMesh = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.28, 6), armorMat);
    helmetMesh.position.set(0, 0.3, 0);
    head.add(helmetMesh);

    const leftShoulder = new THREE.Group(); leftShoulder.position.set(-0.35 * scaleW, 0.4, 0.05); chest.add(leftShoulder);
    const leftUA = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.4, 4), armorMat); leftUA.position.y = -0.2; leftShoulder.add(leftUA);
    const leftElbow = new THREE.Group(); leftElbow.position.y = -0.4; leftShoulder.add(leftElbow);
    const leftLA = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.38, 4), skinMat); leftLA.position.y = -0.19; leftElbow.add(leftLA);
    const leftWrist = new THREE.Group(); leftWrist.position.y = -0.38; leftElbow.add(leftWrist);
    
    const rightShoulder = new THREE.Group(); rightShoulder.position.set(0.35 * scaleW, 0.4, 0.05); chest.add(rightShoulder);
    const rightUA = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.4, 4), armorMat); rightUA.position.y = -0.2; rightShoulder.add(rightUA);
    const rightElbow = new THREE.Group(); rightElbow.position.y = -0.4; rightShoulder.add(rightElbow);
    const rightLA = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.38, 4), skinMat); rightLA.position.y = -0.19; rightElbow.add(rightLA);
    const rightWrist = new THREE.Group(); rightWrist.position.y = -0.38; rightElbow.add(rightWrist);

    const leftHip = new THREE.Group(); leftHip.position.set(-0.13 * scaleW, -0.09, 0); pelvis.add(leftHip);
    const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.65 * scaleY, 4), darkMat); leftThigh.position.set(0, -0.32 * scaleY, 0); leftHip.add(leftThigh);
    const leftKnee = new THREE.Group(); leftKnee.position.set(0, -0.65 * scaleY, 0); leftHip.add(leftKnee);
    const leftShin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.65 * scaleY, 4), darkMat); leftShin.position.set(0, -0.32 * scaleY, 0); leftKnee.add(leftShin);

    const rightHip = new THREE.Group(); rightHip.position.set(0.13 * scaleW, -0.09, 0); pelvis.add(rightHip);
    const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.65 * scaleY, 4), darkMat); rightThigh.position.set(0, -0.32 * scaleY, 0); rightHip.add(rightThigh);
    const rightKnee = new THREE.Group(); rightKnee.position.set(0, -0.65 * scaleY, 0); rightHip.add(rightKnee);
    const rightShin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.65 * scaleY, 4), darkMat); rightShin.position.set(0, -0.32 * scaleY, 0); rightKnee.add(rightShin);

    if (isPlayer) {
        const katanaGroup = new THREE.Group();
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.4, 0.14), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 }));
        blade.position.set(0, 0.8, 0.04);
        katanaGroup.add(blade);
        katanaGroup.position.set(0, -0.1, 0.12);
        katanaGroup.rotation.x = 0.5;
        rightWrist.add(katanaGroup);
    } else {
        const weaponGroup = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.5), new THREE.MeshStandardMaterial({ color: isAlly ? 0x1d4ed8 : 0x5c4033 }));
        pole.position.y = 1.0;
        weaponGroup.add(pole);
        rightWrist.add(weaponGroup);
        root.userData.weapon = weaponGroup;

        if (isAlly) {
            const flagStaff = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8), new THREE.MeshBasicMaterial({ color: 0x1e293b }));
            flagStaff.position.set(0, 0.9, -0.2);
            const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.7), new THREE.MeshBasicMaterial({ color: 0x2563eb, side: THREE.DoubleSide }));
            flag.position.set(0.2, 1.2, -0.2);
            chest.add(flagStaff);
            chest.add(flag);
        }
    }

    root.traverse((child) => {
        child.frustumCulled = false;
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    root.matrixAutoUpdate = true;
    root.updateMatrixWorld(true);

    root.userData.skeleton = { pelvis, abdomen, chest, leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist, leftHip, rightHip, leftKnee, rightKnee };
    return root;
}