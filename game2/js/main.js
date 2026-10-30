import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { scene, camera, renderer, initScene, chargeTargetMesh } from './scene.js';
import { gameState, player, keys, stickInput } from './state.js';
import { createArticulatedHumanoid } from './humanoid.js';
import { spawnGoreEffect } from './effects.js';
import { setupControls } from './controls.js';

initScene();
setupControls();

const playerGroup = createArticulatedHumanoid(true, 0x1d4ed8, 'normal');
scene.add(playerGroup);

let chargeDestination = null;
let totalSpawnedCount = 0;

window.startGame = function(count) {
    gameState.totalEnemyGoal = count;
    gameState.remainingEnemies = count;
    gameState.defeatCount = 0;
    gameState.isTacticalMode = false;
    chargeTargetMesh.visible = false;
    totalSpawnedCount = 0;

    // 主人公ステータス (Lv.100)
    player.maxHp = 5000;
    player.hp = 5000;
    player.attackPower = 120;
    player.defense = 90;
    player.maxStamina = 500;
    player.stamina = 500;
    player.x = 0;
    player.z = 0;

    const overlay = document.getElementById('tactical-overlay');
    if (overlay) overlay.classList.add('hidden');

    updateHudValues();

    const statusMsg = document.getElementById('status-msg');
    if (statusMsg) statusMsg.innerText = "✅ 合戦開始！全軍突撃せよ！";
    
    const modeBtns = document.getElementById('mode-buttons');
    if (modeBtns) modeBtns.style.display = 'grid';

    const clearActs = document.getElementById('clear-actions');
    if (clearActs) clearActs.style.display = 'none';

    const modalDesc = document.getElementById('modal-desc');
    if (modalDesc) modalDesc.innerText = "討ち取る敵軍の規模を選択せよ！";

    const startModal = document.getElementById('start-modal');
    if (startModal) startModal.style.display = 'none';
    
    gameState.gameStarted = true;

    gameState.enemies.forEach(e => scene.remove(e.mesh)); gameState.enemies = [];
    gameState.allies.forEach(a => scene.remove(a.mesh)); gameState.allies = [];
    gameState.corpses.forEach(c => scene.remove(c.mesh)); gameState.corpses = [];
    gameState.effects.forEach(f => scene.remove(f.mesh)); gameState.effects = [];

    playerGroup.position.set(0, 0, 0);

    spawnAllies(100);
    
    // 初期の敵軍勢ウェーブを生成
    for (let i = 0; i < 6; i++) {
        spawnRandomWave(-250 - i * 45);
    }
};

window.returnToStageSelect = function() {
    gameState.gameStarted = false;
    const modeBtns = document.getElementById('mode-buttons');
    if (modeBtns) modeBtns.style.display = 'grid';

    const clearActs = document.getElementById('clear-actions');
    if (clearActs) clearActs.style.display = 'none';

    const startModal = document.getElementById('start-modal');
    if (startModal) startModal.style.display = 'flex';
};

function updateHudValues() {
    const enemyCountVal = document.getElementById('enemy-count-val');
    if (enemyCountVal) enemyCountVal.innerText = gameState.remainingEnemies;

    const scoreVal = document.getElementById('score-val');
    if (scoreVal) scoreVal.innerText = gameState.defeatCount;

    const playerHpVal = document.getElementById('player-hp-val');
    if (playerHpVal) playerHpVal.innerText = `${Math.max(0, Math.floor(player.hp))} / ${player.maxHp}`;

    const playerStaminaVal = document.getElementById('player-stamina-val');
    if (playerStaminaVal) playerStaminaVal.innerText = `${Math.max(0, Math.floor(player.stamina))} / ${player.maxStamina}`;
}

// プレイヤーを中心として四方を取り囲む陣形配置
function spawnAllies(count) {
    for (let i = 0; i < count; i++) {
        const allyMesh = createArticulatedHumanoid(false, 0x1d4ed8, 'normal', true);
        
        let ox = 0, oz = 0;
        const perSide = Math.ceil(count / 4);
        const sideIdx = Math.floor(i / perSide);
        const rankIdx = i % perSide;
        const row = Math.floor(rankIdx / 6);
        const col = (rankIdx % 6) - 2.5;

        if (sideIdx === 0) {
            ox = col * 2.2;
            oz = -2.5 - row * 2.2;
        } else if (sideIdx === 1) {
            ox = col * 2.2;
            oz = 3.5 + row * 2.2;
        } else if (sideIdx === 2) {
            ox = 4.0 + row * 2.2;
            oz = (rankIdx % 8) - 4.0;
        } else {
            ox = -4.0 - row * 2.2;
            oz = (rankIdx % 8) - 4.0;
        }

        const initialX = player.x + ox;
        const initialZ = player.z + oz;

        allyMesh.position.set(initialX, 0, initialZ);
        scene.add(allyMesh);

        gameState.allies.push({
            mesh: allyMesh,
            x: initialX,
            z: initialZ,
            vx: 0,
            vz: 0,
            offsetX: ox,
            offsetZ: oz,
            speed: 0.24,
            maxHp: 800,
            hp: 800,
            attackPower: 25,
            defense: 35,
            isAlive: true,
            state: 'follow',
            animPhase: Math.random() * Math.PI * 2
        });
    }
    const allyCountVal = document.getElementById('ally-count-val');
    if (allyCountVal) allyCountVal.innerText = gameState.allies.length;
}

export function toggleTacticalMode() {
    gameState.isTacticalMode = !gameState.isTacticalMode;
    const overlay = document.getElementById('tactical-overlay');
    const statusMsg = document.getElementById('status-msg');
    if (gameState.isTacticalMode) {
        if (overlay) overlay.classList.remove('hidden');
        if (statusMsg) statusMsg.innerText = "🚩 【戦術俯瞰モード】突撃目標をマップ上でクリックせよ";
    } else {
        if (overlay) overlay.classList.add('hidden');
        if (statusMsg) statusMsg.innerText = "✅ 合戦再開！";
    }
}

export function executeChargeCommand(targetX, targetZ) {
    chargeDestination = { x: targetX, z: targetZ };
    chargeTargetMesh.position.set(targetX, 0.05, targetZ);
    chargeTargetMesh.visible = true;

    gameState.allies.forEach(ally => {
        if (!ally.isAlive) return;
        ally.state = 'charge';
    });

    gameState.isTacticalMode = false;
    const overlay = document.getElementById('tactical-overlay');
    if (overlay) overlay.classList.add('hidden');
    const statusMsg = document.getElementById('status-msg');
    if (statusMsg) statusMsg.innerText = "🔥 味方軍団、指定地点へ突撃＆交戦開始！";
}

export function setAlliesStateFollow() {
    gameState.allies.forEach(ally => {
        if (!ally.isAlive) return;
        ally.state = 'follow';
    });
    chargeTargetMesh.visible = false;
    const statusMsg = document.getElementById('status-msg');
    if (statusMsg) statusMsg.innerText = "🔄 味方軍団：陣形に復帰（追従）";
}

// 敵の大軍勢ウェーブ生成
function spawnRandomWave(customZ = null) {
    if (totalSpawnedCount >= gameState.totalEnemyGoal) return;
    
    const needed = gameState.totalEnemyGoal - totalSpawnedCount;
    const waveSize = Math.min(50, needed);
    if (waveSize <= 0) return;

    totalSpawnedCount += waveSize;
    const startZ = customZ !== null ? customZ : player.z - 300 - Math.random() * 50;
    const groupCenterX = player.x + (Math.random() - 0.5) * 220;

    for (let i = 0; i < waveSize; i++) {
        const enemyMesh = createArticulatedHumanoid(false, 0x991b1b, 'normal', false);
        const col = i % 8;
        const row = Math.floor(i / 8);
        const ox = groupCenterX + (col - 3.5) * 2.5;
        const oz = startZ - row * 3.0;

        enemyMesh.position.set(ox, 0, oz);
        scene.add(enemyMesh);

        gameState.enemies.push({
            mesh: enemyMesh,
            x: ox,
            z: oz,
            vx: 0,
            vz: 0,
            speed: 0.16,
            maxHp: 450,
            hp: 450,
            attackPower: 30,
            defense: 25,
            isAlive: true,
            walkPhase: Math.random() * Math.PI * 2
        });
    }
}

// 主人公の斬撃攻撃処理
export function triggerAttack() {
    if (gameState.remainingEnemies <= 0 || player.hp <= 0) return;

    if (player.comboResetTimer > 0 && !player.isAttacking) {
        player.comboStep = (player.comboStep + 1) % 4;
    } else if (!player.isAttacking) {
        player.comboStep = 0;
    }

    if (!player.isAttacking) {
        player.isAttacking = true;
        player.attackTimer = 18;
        player.comboResetTimer = 35;

        player.stamina = Math.max(0, player.stamina - 15);

        const comboNames = ["一之太刀：右薙ぎ", "二之太刀：左逆袈裟", "三之太刀：唐竹割り", "奥義：旋風円月斬り"];
        const comboDisplay = document.getElementById('combo-display');
        if (comboDisplay) comboDisplay.innerText = `コンボ: ${comboNames[player.comboStep]}`;
        const reach = player.comboStep === 3 ? 7.0 : 5.0;
        
        const staminaRatio = player.stamina / player.maxStamina;
        const effectiveAtk = player.attackPower * (0.5 + 0.5 * staminaRatio);

        gameState.enemies.forEach(enemy => {
            if (!enemy.isAlive) return;
            const dist = Math.hypot(enemy.x - player.x, enemy.z - player.z);
            if (dist < reach) {
                const damage = Math.max(15, effectiveAtk - enemy.defense);
                enemy.hp -= damage;

                if (enemy.hp <= 0 && enemy.isAlive) {
                    enemy.isAlive = false;
                    gameState.defeatCount++;
                    gameState.remainingEnemies = Math.max(0, gameState.remainingEnemies - 1);

                    if (gameState.remainingEnemies === 0) {
                        const statusMsg = document.getElementById('status-msg');
                        if (statusMsg) statusMsg.innerText = "🏆 大勝利！敵軍を討ち果した！";
                        setTimeout(() => {
                            const modeBtns = document.getElementById('mode-buttons');
                            if (modeBtns) modeBtns.style.display = 'none';

                            const clearActs = document.getElementById('clear-actions');
                            if (clearActs) clearActs.style.display = 'block';

                            const modalDesc = document.getElementById('modal-desc');
                            if (modalDesc) modalDesc.innerText = `🏆 大勝利！ ${gameState.totalEnemyGoal}人の軍勢を討伐しました！`;

                            const startModal = document.getElementById('start-modal');
                            if (startModal) startModal.style.display = 'flex';
                        }, 800);
                    }

                    spawnGoreEffect(enemy.x, 1.0, enemy.z, enemy.mesh.rotation.y);
                    scene.remove(enemy.mesh);
                    enemy.mesh.position.set(enemy.x, 0.1, enemy.z);
                    scene.add(enemy.mesh);
                    
                    // 【即座のフェードアウト用】マテリアルを半透明化可能にして死体リストへ登録
                    enemy.mesh.traverse((child) => {
                        if (child.isMesh) {
                            child.material = child.material.clone();
                            child.material.transparent = true;
                        }
                    });
                    gameState.corpses.push({ mesh: enemy.mesh, life: 30 }); // 約0.5秒（30フレーム）ですぐに消滅
                }
            }
        });
    }
}

// 死体を即座にフェードアウトさせて消去する専用関数
function updateCorpsesFast() {
    for (let i = gameState.corpses.length - 1; i >= 0; i--) {
        const corpse = gameState.corpses[i];
        corpse.life--;
        
        const opacity = corpse.life / 30;
        corpse.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.opacity = Math.max(0, opacity);
            }
        });

        if (corpse.life <= 0) {
            scene.remove(corpse.mesh);
            gameState.corpses.splice(i, 1);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (!gameState.gameStarted) return;

    if (player.stamina < player.maxStamina) {
        player.stamina = Math.min(player.maxStamina, player.stamina + 0.4);
    }
    const staminaRatio = player.stamina / player.maxStamina;
    const currentSpeed = player.baseSpeed * (0.6 + 0.4 * staminaRatio);

    let moveX = stickInput.x;
    let moveZ = stickInput.z;
    if (keys.up) moveZ -= 1;
    if (keys.down) moveZ += 1;
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;

    let isMoving = (Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05);
    const pSk = playerGroup.userData.skeleton;

    if (isMoving && !gameState.isTacticalMode && player.hp > 0) {
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        const mX = (moveX / len) * currentSpeed;
        const mZ = (moveZ / len) * currentSpeed;

        // 【マップ外制限】プレイヤーがマップ境界（±550）を超えないようにクランプ
        player.x = Math.max(-550, Math.min(550, player.x + mX));
        player.z = Math.max(-550, Math.min(550, player.z + mZ));

        player.angle = Math.atan2(mX, mZ);
        playerGroup.rotation.y = player.angle;
        player.walkCycle += 0.45;

        pSk.pelvis.position.y = 1.0 + Math.abs(Math.sin(player.walkCycle)) * 0.12;
        pSk.leftHip.rotation.x = Math.sin(player.walkCycle) * 0.8;
        pSk.rightHip.rotation.x = -Math.sin(player.walkCycle) * 0.8;
    }

    playerGroup.position.set(player.x, 0, player.z);

    // --- 味方AI処理 ---
    let aliveAlliesCount = 0;
    gameState.allies.forEach((ally, i) => {
        if (!ally.isAlive) return;
        aliveAlliesCount++;

        ally.walkPhase += 0.35;
        const aSk = ally.mesh.userData.skeleton;
        
        let targetX = player.x + ally.offsetX;
        let targetZ = player.z + ally.offsetZ;

        if (ally.state === 'charge' && chargeDestination) {
            const distToDest = Math.hypot(chargeDestination.x - ally.x, chargeDestination.z - ally.z);
            if (distToDest > 5.0) {
                targetX = chargeDestination.x + ally.offsetX * 0.3;
                targetZ = chargeDestination.z + ally.offsetZ * 0.3;
            }
        }

        let nearestEnemy = null;
        let minDist = 9999;
        for (let enemy of gameState.enemies) {
            if (!enemy.isAlive) continue;
            const d = Math.hypot(enemy.x - ally.x, enemy.z - ally.z);
            if (d < minDist) {
                minDist = d;
                nearestEnemy = enemy;
            }
        }

        if (nearestEnemy && (minDist < 18.0 || ally.state === 'auto')) {
            targetX = nearestEnemy.x;
            targetZ = nearestEnemy.z;

            if (minDist < 2.2) {
                ally.hp -= Math.max(1, nearestEnemy.attackPower - ally.defense);
                nearestEnemy.hp -= Math.max(1, ally.attackPower - nearestEnemy.defense);

                const pushAngle = Math.atan2(ally.x - nearestEnemy.x, ally.z - nearestEnemy.z);
                ally.vx += Math.sin(pushAngle) * 0.025;
                ally.vz += Math.cos(pushAngle) * 0.025;
                nearestEnemy.vx -= Math.sin(pushAngle) * 0.025;
                nearestEnemy.vz -= Math.cos(pushAngle) * 0.025;

                if (ally.hp <= 0 && ally.isAlive) {
                    ally.isAlive = false;
                    scene.remove(ally.mesh);
                    ally.mesh.position.set(ally.x, 0.1, ally.z);
                    scene.add(ally.mesh);
                    
                    ally.mesh.traverse((child) => {
                        if (child.isMesh) {
                            child.material = child.material.clone();
                            child.material.transparent = true;
                        }
                    });
                    gameState.corpses.push({ mesh: ally.mesh, life: 30 });
                }

                if (nearestEnemy.hp <= 0 && nearestEnemy.isAlive) {
                    nearestEnemy.isAlive = false;
                    gameState.defeatCount++;
                    gameState.remainingEnemies = Math.max(0, gameState.remainingEnemies - 1);

                    if (gameState.remainingEnemies === 0) {
                        const statusMsg = document.getElementById('status-msg');
                        if (statusMsg) statusMsg.innerText = "🏆 大勝利！敵軍を討ち果した！";
                        setTimeout(() => {
                            const modeBtns = document.getElementById('mode-buttons');
                            if (modeBtns) modeBtns.style.display = 'none';

                            const clearActs = document.getElementById('clear-actions');
                            if (clearActs) clearActs.style.display = 'block';

                            const modalDesc = document.getElementById('modal-desc');
                            if (modalDesc) modalDesc.innerText = `🏆 大勝利！ ${gameState.totalEnemyGoal}人の軍勢を討伐しました！`;

                            const startModal = document.getElementById('start-modal');
                            if (startModal) startModal.style.display = 'flex';
                        }, 800);
                    }

                    spawnGoreEffect(nearestEnemy.x, 1.0, nearestEnemy.z, nearestEnemy.mesh.rotation.y);
                    scene.remove(nearestEnemy.mesh);
                    nearestEnemy.mesh.position.set(nearestEnemy.x, 0.1, nearestEnemy.z);
                    scene.add(nearestEnemy.mesh);
                    
                    nearestEnemy.mesh.traverse((child) => {
                        if (child.isMesh) {
                            child.material = child.material.clone();
                            child.material.transparent = true;
                        }
                    });
                    gameState.corpses.push({ mesh: nearestEnemy.mesh, life: 30 });
                }
            }
        }

        // 味方同士のコリジョン
        for (let j = i + 1; j < gameState.allies.length; j++) {
            const other = gameState.allies[j];
            if (!other.isAlive) continue;
            const dx = other.x - ally.x;
            const dz = other.z - ally.z;
            const dist = Math.hypot(dx, dz);
            const minSpace = 1.1;
            if (dist < minSpace && dist > 0.001) {
                const overlap = (minSpace - dist) * 0.5;
                ally.x -= (dx / dist) * overlap;
                ally.z -= (dz / dist) * overlap;
                other.x += (dx / dist) * overlap;
                other.z += (dz / dist) * overlap;
            }
        }

        ally.x += ally.vx;
        ally.z += ally.vz;
        ally.vx *= 0.75;
        ally.vz *= 0.75;

        // 【マップ外制限】味方がマップ外に出ないようにクランプ
        ally.x = Math.max(-570, Math.min(570, ally.x));
        ally.z = Math.max(-570, Math.min(570, ally.z));

        if (isNaN(ally.x) || isNaN(ally.z)) {
            ally.x = player.x + ally.offsetX;
            ally.z = player.z + ally.offsetZ;
        }

        const dx = targetX - ally.x;
        const dz = targetZ - ally.z;
        const dist = Math.hypot(dx, dz);
        const stopDist = (nearestEnemy && minDist < 2.2) ? 1.8 : 0.1;

        if (dist > stopDist) {
            const moveStep = Math.min(dist - stopDist, ally.speed);
            ally.x += (dx / dist) * moveStep;
            ally.z += (dz / dist) * moveStep;
            ally.mesh.rotation.y = Math.atan2(dx, dz);

            aSk.pelvis.position.y = 1.0 + Math.abs(Math.sin(ally.walkPhase)) * 0.1;
            aSk.leftHip.rotation.x = Math.sin(ally.walkPhase) * 0.7;
            aSk.rightHip.rotation.x = -Math.sin(ally.walkPhase) * 0.7;
        } else {
            ally.walkPhase = (ally.walkPhase || 0) + 0.15;
            aSk.chest.rotation.x = 0.4 + Math.sin(ally.walkPhase) * 0.3;
        }

        ally.mesh.position.set(ally.x, 0, ally.z);
    });

    const allyCountVal = document.getElementById('ally-count-val');
    if (allyCountVal) allyCountVal.innerText = aliveAlliesCount;

    // --- 敵AI処理 ---
    const RENDER_DISTANCE = 180;
    gameState.enemies.forEach((enemy, i) => {
        if (!enemy.isAlive) return;

        const distToPlayer = Math.hypot(enemy.x - player.x, enemy.z - player.z);
        if (distToPlayer > RENDER_DISTANCE) {
            enemy.mesh.visible = false;
            return;
        }
        enemy.mesh.visible = true;

        let nearestTarget = { x: player.x, z: player.z, isPlayer: true };
        let minTDist = distToPlayer;

        for (let ally of gameState.allies) {
            if (!ally.isAlive) continue;
            const d = Math.hypot(ally.x - enemy.x, ally.z - enemy.z);
            if (d < minTDist) {
                minTDist = d;
                nearestTarget = { x: ally.x, z: ally.z, isPlayer: false };
            }
        }

        // 敵同士のコリジョン
        for (let j = i + 1; j < gameState.enemies.length; j++) {
            const other = gameState.enemies[j];
            if (!other.isAlive) continue;
            const dx = other.x - enemy.x;
            const dz = other.z - enemy.z;
            const dist = Math.hypot(dx, dz);
            const minSpace = 1.1;
            if (dist < minSpace && dist > 0.001) {
                const overlap = (minSpace - dist) * 0.5;
                enemy.x -= (dx / dist) * overlap;
                enemy.z -= (dz / dist) * overlap;
                other.x += (dx / dist) * overlap;
                other.z += (dz / dist) * overlap;
            }
        }

        enemy.x += enemy.vx;
        enemy.z += enemy.vz;
        enemy.vx *= 0.75;
        enemy.vz *= 0.75;

        // 【マップ外制限】敵がマップ外に出ないようにクランプ
        enemy.x = Math.max(-570, Math.min(570, enemy.x));
        enemy.z = Math.max(-570, Math.min(570, enemy.z));

        const dirX = nearestTarget.x - enemy.x;
        const dirZ = nearestTarget.z - enemy.z;
        const actualLen = Math.hypot(dirX, dirZ);
        const eSk = enemy.mesh.userData.skeleton;

        if (actualLen > 0.01) {
            const enemyStopDist = 1.8;
            if (actualLen > enemyStopDist) {
                enemy.walkPhase += 0.35;
                const moveStep = Math.min(actualLen - enemyStopDist, enemy.speed);
                enemy.x += (dirX / actualLen) * moveStep;
                enemy.z += (dirZ / actualLen) * moveStep;
                enemy.mesh.rotation.y = Math.atan2(dirX, dirZ);

                eSk.pelvis.position.y = 1.0 + Math.abs(Math.sin(enemy.walkPhase)) * 0.1;
                eSk.leftHip.rotation.x = Math.sin(enemy.walkPhase) * 0.8;
                eSk.rightHip.rotation.x = -Math.sin(enemy.walkPhase) * 0.8;
            } else {
                enemy.walkPhase += 0.2;
                eSk.pelvis.position.y = 0.92;
                eSk.chest.rotation.x = 0.5 + Math.sin(enemy.walkPhase) * 0.4;

                if (nearestTarget.isPlayer && distToPlayer < 2.5) {
                    player.hp = Math.max(0, player.hp - Math.max(1, enemy.attackPower - player.defense));
                }
            }
        }
        enemy.mesh.position.set(enemy.x, 0, enemy.z);
    });

    gameState.enemies = gameState.enemies.filter(e => e.isAlive);
    gameState.allies = gameState.allies.filter(a => a.isAlive);

    // 【即座のフェードアウト処理を実行】
    updateCorpsesFast();
    updateHudValues();

    const activeEnemiesCount = gameState.enemies.length;
    if (gameState.remainingEnemies > 0 && activeEnemiesCount < 180 && totalSpawnedCount < gameState.totalEnemyGoal) {
        spawnRandomWave(player.z - 300);
    }

    if (player.isAttacking) {
        player.attackTimer--;
        const progress = (18 - player.attackTimer) / 18;

        if (player.comboStep === 0) {
            pSk.abdomen.rotation.y = Math.sin(progress * Math.PI) * 0.8;
            pSk.chest.rotation.y = Math.sin(progress * Math.PI) * 0.6;
            pSk.rightShoulder.rotation.z = -Math.sin(progress * Math.PI) * 1.5;
        } else if (player.comboStep === 1) {
            pSk.abdomen.rotation.y = -Math.sin(progress * Math.PI) * 0.8;
            pSk.chest.rotation.y = -Math.sin(progress * Math.PI) * 0.6;
            pSk.rightShoulder.rotation.z = Math.sin(progress * Math.PI) * 1.5;
        } else if (player.comboStep === 2) {
            pSk.abdomen.rotation.x = -0.3 + Math.sin(progress * Math.PI) * 0.7;
            pSk.chest.rotation.x = -0.3 + Math.sin(progress * Math.PI) * 0.7;
        } else {
            playerGroup.rotation.y = player.angle + progress * Math.PI * 2;
            pSk.chest.rotation.y = Math.sin(progress * Math.PI * 2) * 1.2;
        }

        if (player.attackTimer <= 0) {
            player.isAttacking = false;
            playerGroup.rotation.y = player.angle;
            pSk.abdomen.rotation.set(0, 0, 0);
            pSk.chest.rotation.set(0, 0, 0);
            pSk.rightShoulder.rotation.set(0.4, 0, 0.3);
        }
    }

    playerGroup.position.z = player.z;

    const zoom = gameState.cameraZoom;
    if (gameState.isTacticalMode) {
        camera.position.set(player.x, 90, player.z + 20);
        camera.lookAt(player.x, 0, player.z);
        chargeTargetMesh.visible = true;
    } else {
        camera.position.set(player.x, 16 * zoom, player.z + 14 * zoom);
        camera.lookAt(player.x, 1.0, player.z - 12);
    }

    renderer.render(scene, camera);
}

animate();