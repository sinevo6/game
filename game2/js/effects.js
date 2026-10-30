import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { scene } from './scene.js';
import { gameState } from './state.js';

const MAX_CORPSES = 80;

export function spawnGoreEffect(x, y, z, rotY) {
    const bloodMat = new THREE.MeshBasicMaterial({ color: 0x990000 });
    for (let i = 0; i < 10; i++) {
        const bMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), bloodMat);
        bMesh.position.set(x + (Math.random() - 0.5) * 0.8, y + Math.random() * 0.8, z + (Math.random() - 0.5) * 0.8);
        scene.add(bMesh);

        gameState.effects.push({
            mesh: bMesh,
            vx: (Math.random() - 0.5) * 0.2,
            vy: Math.random() * 0.25,
            vz: (Math.random() - 0.5) * 0.2,
            life: 30
        });
    }
}

export function updateEffectsAndCorpses() {
    for (let i = gameState.effects.length - 1; i >= 0; i--) {
        const fx = gameState.effects[i];
        fx.life--;
        fx.mesh.position.x += fx.vx;
        fx.mesh.position.y += fx.vy;
        fx.mesh.position.z += fx.vz;
        fx.vy -= 0.015;

        if (fx.life <= 0) {
            scene.remove(fx.mesh);
            gameState.effects.splice(i, 1);
        }
    }

    while (gameState.corpses.length > MAX_CORPSES) {
        const oldCorpse = gameState.corpses.shift();
        scene.remove(oldCorpse.mesh);
    }

    for (let i = gameState.corpses.length - 1; i >= 0; i--) {
        const c = gameState.corpses[i];
        c.age++;
        const fadeStart = 400;
        const fadeDuration = 100;

        if (c.age > fadeStart) {
            const progress = (c.age - fadeStart) / fadeDuration;
            const opacity = Math.max(0, 1 - progress);
            c.mesh.traverse((child) => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity = opacity;
                }
            });
        }
        if (c.age > fadeStart + fadeDuration) {
            scene.remove(c.mesh);
            gameState.corpses.splice(i, 1);
        }
    }
}