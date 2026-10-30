export const gameState = {
    totalEnemyGoal: 1000,
    remainingEnemies: 1000,
    defeatCount: 0,
    gameStarted: false,
    isTacticalMode: false,
    cameraZoom: 1.0,
    enemies: [],
    allies: [],
    corpses: [],
    effects: []
};

export const player = {
    x: 0,
    z: 0,
    baseSpeed: 0.28,
    speed: 0.28,
    angle: 0,
    isAttacking: false,
    attackTimer: 0,
    comboStep: 0,
    comboResetTimer: 0,
    walkCycle: 0,
    // レベル100 主人公ステータス
    level: 100,
    maxHp: 2000,
    hp: 2000,
    attackPower: 150,
    defense: 80,
    maxStamina: 500,
    stamina: 500
};

export const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    shift: false
};

export const stickInput = {
    x: 0,
    z: 0
};