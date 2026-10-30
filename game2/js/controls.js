import { keys, stickInput, gameState } from './state.js';
import { triggerAttack, toggleTacticalMode, executeChargeCommand, setAlliesStateFollow } from './main.js';
import { camera, raycaster, mouseVec } from './scene.js';
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export function setupControls() {
    window.addEventListener('keydown', (e) => {
        if (!gameState.gameStarted) return;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
        if (e.key === 'Shift' || e.key === 'q' || e.key === 'Q') toggleTacticalMode();
        if (e.key === ' ' || e.key === 'Enter') {
            if (!gameState.isTacticalMode) triggerAttack();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    });

    window.addEventListener('wheel', (e) => {
        if (!gameState.gameStarted) return;
        gameState.cameraZoom = Math.max(0.4, Math.min(2.5, gameState.cameraZoom + e.deltaY * 0.001));
    }, { passive: true });

    let initialPinchDist = null;
    window.addEventListener('touchmove', (e) => {
        if (!gameState.gameStarted) return;
        if (e.touches.length === 2) {
            const x1 = e.touches[0].clientX;
            const y1 = e.touches[0].clientY;
            const x2 = e.touches[1].clientX;
            const y2 = e.touches[1].clientY;
            const dist = Math.hypot(x2 - x1, y2 - y1);

            if (initialPinchDist === null) {
                initialPinchDist = dist;
            } else {
                const diff = initialPinchDist - dist;
                gameState.cameraZoom = Math.max(0.4, Math.min(2.5, gameState.cameraZoom + diff * 0.005));
                initialPinchDist = dist;
            }
        }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            initialPinchDist = null;
        }
    });

    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    let isDragging = false;
    let maxRadius = 45;

    if (zone && knob) {
        zone.addEventListener('pointerdown', (e) => {
            isDragging = true;
            updateStick(e);
        });

        window.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            updateStick(e);
        });

        window.addEventListener('pointerup', () => {
            isDragging = false;
            stickInput.x = 0;
            stickInput.z = 0;
            knob.style.transform = `translate(0px, 0px)`;
        });
    }

    function updateStick(e) {
        const rect = zone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let dx = e.clientX - centerX;
        let dy = e.clientY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxRadius) {
            dx = (dx / dist) * maxRadius;
            dy = (dy / dist) * maxRadius;
        }

        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        stickInput.x = dx / maxRadius;
        stickInput.z = dy / maxRadius;
    }

    const attackBtn = document.getElementById('btn-attack');
    if (attackBtn) {
        attackBtn.addEventListener('click', () => {
            if (gameState.gameStarted && !gameState.isTacticalMode) triggerAttack();
        });
    }

    const chargeBtn = document.getElementById('btn-charge');
    if (chargeBtn) {
        chargeBtn.addEventListener('click', () => {
            if (gameState.gameStarted) toggleTacticalMode();
        });
    }

    const cmdReturnBtn = document.getElementById('btn-cmd-return');
    if (cmdReturnBtn) {
        cmdReturnBtn.addEventListener('click', () => {
            if (gameState.gameStarted) setAlliesStateFollow();
        });
    }

    window.addEventListener('pointerdown', (e) => {
        if (!gameState.gameStarted) return;
        if (e.target.tagName !== 'CANVAS') return;

        if (gameState.isTacticalMode) {
            mouseVec.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouseVec.y = -(e.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouseVec, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);

            for (let hit of intersects) {
                if (hit.object.name === "ground_plane" || hit.object.geometry instanceof THREE.PlaneGeometry) {
                    executeChargeCommand(hit.point.x, hit.point.z);
                    break;
                }
            }
        } else {
            triggerAttack();
        }
    });
}