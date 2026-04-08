// ========================================
// 🐱 CAT CARETAKER GAME - STAGE 1
// Zelda: A Link to the Past inspired 2D game
// ========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Vibrant Zelda LTTP inspired colors
const COLORS = {
    grass1: '#3cb043', grass2: '#2d8a35', grass3: '#4cc654',
    grassHighlight: '#5dd865', grassShadow: '#1e6b28',
    water: '#2e8bc0', waterDark: '#1a5f8a', waterLight: '#5bb5e0',
    waterFoam: '#a8e0ff', waterDeep: '#0d3d5c',
    bridge: '#a0522d', bridgeDark: '#8b4513', bridgeLight: '#cd853f',
    treeTop: '#228b22', treeMid: '#2e8b2e', treeHighlight: '#32cd32',
    treeShadow: '#0d5d0d', treeTrunk: '#5d4037', treeTrunkDark: '#3e2723',
    corral: '#b8860b', corralDark: '#8b6508', corralInner: '#f4e4bc',
    hay: '#d4a017', hayDark: '#b8860b',
    path: '#c2956e', pathDark: '#a67c52', pathLight: '#d4a76a',
    flower1: '#ff69b4', flower2: '#ffd700', flower3: '#9370db',
    flower4: '#ff6347', flower5: '#00ced1',
    house: '#deb887', houseRoof: '#cd5c5c', houseRoofDark: '#8b3a3a',
    rock: '#696969', rockLight: '#808080', rockDark: '#505050',
    mushroomRed: '#dc143c', mushroomWhite: '#fffafa'
};

const TILES = {
    GRASS: 0, WATER: 1, BRIDGE: 2, TREE: 3, CORRAL_FENCE: 4,
    CORRAL_INSIDE: 5, PATH: 6, HOUSE: 7, BUSH: 9, ROCK: 10,
    TALL_GRASS: 12, MUSHROOM: 13, STUMP: 14
};

let gameMap = [], flowers = [], decorations = [];

function generateMap() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        gameMap[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            gameMap[y][x] = Math.random() < 0.1 ? TILES.TALL_GRASS : TILES.GRASS;
        }
    }

    const riverY = 12;
    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let ry = 0; ry < 4; ry++) gameMap[riverY + ry][x] = TILES.WATER;
    }

    const bridgeX = 20;
    for (let i = 0; i < 5; i++) {
        for (let ry = 0; ry < 4; ry++) gameMap[riverY + ry][bridgeX + i] = TILES.BRIDGE;
    }

    for (let x = 0; x < MAP_WIDTH; x++) {
        if (Math.random() < 0.12 && (x < bridgeX - 1 || x > bridgeX + 5)) {
            gameMap[riverY - 1][x] = TILES.ROCK;
            if (Math.random() < 0.5) gameMap[riverY + 4][x] = TILES.ROCK;
        }
    }

    const corralX = 3, corralY = 20, corralW = 9, corralH = 7;
    for (let y = corralY; y < corralY + corralH; y++) {
        for (let x = corralX; x < corralX + corralW; x++) {
            if (y === corralY || y === corralY + corralH - 1 || x === corralX || x === corralX + corralW - 1) {
                if (y === corralY + corralH - 1 && x >= corralX + 3 && x <= corralX + 5) {
                    gameMap[y][x] = TILES.CORRAL_INSIDE;
                } else {
                    gameMap[y][x] = TILES.CORRAL_FENCE;
                }
            } else {
                gameMap[y][x] = TILES.CORRAL_INSIDE;
            }
        }
    }

    for (let y = corralY - 1; y < corralY + 5; y++) {
        for (let x = corralX + corralW + 2; x < corralX + corralW + 7; x++) {
            gameMap[y][x] = TILES.HOUSE;
        }
    }

    const forestAreas = [
        { x: 1, y: 1, w: 10, h: 8 }, { x: 13, y: 0, w: 12, h: 10 },
        { x: 28, y: 1, w: 11, h: 9 }, { x: 5, y: 4, w: 6, h: 5 }
    ];

    forestAreas.forEach(area => {
        for (let y = area.y; y < Math.min(area.y + area.h, MAP_HEIGHT); y++) {
            for (let x = area.x; x < Math.min(area.x + area.w, MAP_WIDTH); x++) {
                const r = Math.random();
                if (r < 0.35) gameMap[y][x] = TILES.TREE;
                else if (r < 0.50) gameMap[y][x] = TILES.BUSH;
                else if (r < 0.55) gameMap[y][x] = TILES.MUSHROOM;
                else if (r < 0.60) gameMap[y][x] = TILES.STUMP;
                else if (r < 0.65) gameMap[y][x] = TILES.ROCK;
            }
        }
    });

    for (let i = 0; i < 45; i++) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * (MAP_HEIGHT - 17)) + 17;
        if ((gameMap[y][x] === TILES.GRASS || gameMap[y][x] === TILES.TALL_GRASS) &&
            (x < corralX - 2 || x > corralX + 15 || y < corralY - 2 || y > corralY + corralH + 2)) {
            const r = Math.random();
            if (r < 0.35) gameMap[y][x] = TILES.TREE;
            else if (r < 0.55) gameMap[y][x] = TILES.BUSH;
            else if (r < 0.70) gameMap[y][x] = TILES.ROCK;
            else if (r < 0.85) gameMap[y][x] = TILES.STUMP;
            else gameMap[y][x] = TILES.MUSHROOM;
        }
    }

    const pathStartX = corralX + 4;
    for (let y = corralY + corralH; y < MAP_HEIGHT; y++) {
        for (let px = 0; px < 3; px++) gameMap[y][pathStartX + px] = TILES.PATH;
    }
    for (let y = 0; y < riverY; y++) {
        for (let px = 0; px < 3; px++) gameMap[y][bridgeX + 1 + px] = TILES.PATH;
    }
    for (let y = riverY + 4; y < corralY; y++) {
        for (let px = 0; px < 3; px++) gameMap[y][bridgeX + 1 + px] = TILES.PATH;
    }
    const connectY = corralY + corralH + 2;
    for (let x = Math.min(pathStartX, bridgeX + 1); x <= Math.max(pathStartX + 2, bridgeX + 3); x++) {
        gameMap[connectY][x] = TILES.PATH;
        if (connectY + 1 < MAP_HEIGHT) gameMap[connectY + 1][x] = TILES.PATH;
    }
    for (let x = bridgeX + 5; x < Math.min(bridgeX + 18, MAP_WIDTH); x++) {
        gameMap[riverY + 5][x] = TILES.PATH;
    }

    const flowerColors = [COLORS.flower1, COLORS.flower2, COLORS.flower3, COLORS.flower4, COLORS.flower5];
    for (let i = 0; i < 180; i++) {
        const x = Math.random() * MAP_WIDTH * TILE_SIZE;
        const y = Math.random() * MAP_HEIGHT * TILE_SIZE;
        const tileX = Math.floor(x / TILE_SIZE), tileY = Math.floor(y / TILE_SIZE);
        if (tileY >= 0 && tileY < MAP_HEIGHT && tileX >= 0 && tileX < MAP_WIDTH) {
            const tile = gameMap[tileY][tileX];
            if (tile === TILES.GRASS || tile === TILES.TALL_GRASS) {
                flowers.push({
                    x, y, color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
                    size: 3 + Math.random() * 4, type: Math.floor(Math.random() * 3)
                });
            }
        }
    }
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * MAP_WIDTH * TILE_SIZE;
        const y = Math.random() * MAP_HEIGHT * TILE_SIZE;
        const tileX = Math.floor(x / TILE_SIZE), tileY = Math.floor(y / TILE_SIZE);
        if (tileY >= 0 && tileY < MAP_HEIGHT && tileX >= 0 && tileX < MAP_WIDTH) {
            if (gameMap[tileY][tileX] === TILES.GRASS) {
                decorations.push({ x, y, type: 'grass_tuft', variant: Math.floor(Math.random() * 3) });
            }
        }
    }
}

const player = {
    x: 6 * TILE_SIZE, y: 22 * TILE_SIZE, width: 24, height: 32, speed: 3.5,
    direction: 'down', frame: 0, frameTimer: 0, isMoving: false, carryingCat: null
};

let kittens = [], score = 0, savedCats = [];
const KITTEN_TYPES = { FRIENDLY: 'friendly', SHY: 'shy' };

function spawnKittens() {
    kittens = [];
    const spawnAreas = [{ x: 5, y: 3, w: 25, h: 8 }, { x: 20, y: 17, w: 15, h: 10 }, { x: 3, y: 28, w: 10, h: 2 }];
    for (let i = 0; i < 4; i++) {
        kittens.push(createKitten(spawnAreas[Math.floor(Math.random() * spawnAreas.length)], KITTEN_TYPES.FRIENDLY));
    }
    for (let i = 0; i < 3; i++) {
        kittens.push(createKitten(spawnAreas[Math.floor(Math.random() * spawnAreas.length)], KITTEN_TYPES.SHY));
    }
}

function createKitten(area, type) {
    let x, y, attempts = 0;
    do {
        x = (area.x + Math.random() * area.w) * TILE_SIZE;
        y = (area.y + Math.random() * area.h) * TILE_SIZE;
        attempts++;
    } while (attempts < 50 && !isValidKittenPosition(x, y));
    const colors = ['#ffb366', '#d4a574', '#808080', '#333333', '#ffffff', '#ffcc99'];
    return {
        x, y, type, color: colors[Math.floor(Math.random() * colors.length)],
        state: 'idle', frame: 0, frameTimer: 0, fleeDirection: { x: 0, y: 0 }, fleeTimer: 0, rubbingTimer: 0, caught: false
    };
}

function isValidKittenPosition(x, y) {
    const tileX = Math.floor(x / TILE_SIZE), tileY = Math.floor(y / TILE_SIZE);
    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return false;
    const tile = gameMap[tileY][tileX];
    return tile === TILES.GRASS || tile === TILES.PATH || tile === TILES.TALL_GRASS;
}

const camera = { x: 0, y: 0 };
function updateCamera() {
    const targetX = player.x - CANVAS_WIDTH / 2 + player.width / 2;
    const targetY = player.y - CANVAS_HEIGHT / 2 + player.height / 2;
    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;
    camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH * TILE_SIZE - CANVAS_WIDTH));
    camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT * TILE_SIZE - CANVAS_HEIGHT));
}

const keys = {};
document.addEventListener('keydown', (e) => { keys[e.key] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault(); });
document.addEventListener('keyup', (e) => keys[e.key] = false);

function canMoveTo(x, y, width, height) {
    const points = [{ x: x + 4, y: y + height - 8 }, { x: x + width - 4, y: y + height - 8 },
    { x: x + 4, y: y + height - 2 }, { x: x + width - 4, y: y + height - 2 }];
    for (const p of points) {
        const tx = Math.floor(p.x / TILE_SIZE), ty = Math.floor(p.y / TILE_SIZE);
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return false;
        const t = gameMap[ty][tx];
        if (t === TILES.WATER || t === TILES.TREE || t === TILES.HOUSE || t === TILES.BUSH || t === TILES.ROCK || t === TILES.STUMP) return false;
    }
    return true;
}

function updatePlayer() {
    let dx = 0, dy = 0;
    player.isMoving = false;
    if (keys['ArrowUp'] || keys['w']) { dy = -player.speed; player.direction = 'up'; player.isMoving = true; }
    if (keys['ArrowDown'] || keys['s']) { dy = player.speed; player.direction = 'down'; player.isMoving = true; }
    if (keys['ArrowLeft'] || keys['a']) { dx = -player.speed; player.direction = 'left'; player.isMoving = true; }
    if (keys['ArrowRight'] || keys['d']) { dx = player.speed; player.direction = 'right'; player.isMoving = true; }
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
    if (dx !== 0 && canMoveTo(player.x + dx, player.y, player.width, player.height)) player.x += dx;
    if (dy !== 0 && canMoveTo(player.x, player.y + dy, player.width, player.height)) player.y += dy;
    if (player.isMoving) { player.frameTimer++; if (player.frameTimer >= 8) { player.frameTimer = 0; player.frame = (player.frame + 1) % 4; } }
    else player.frame = 0;
    if (!player.carryingCat) checkKittenPickup();
    if (player.carryingCat) checkCorralDropoff();
}

function checkKittenPickup() {
    for (let k of kittens) {
        if (k.caught) continue;
        const dist = Math.hypot(player.x + player.width / 2 - k.x, player.y + player.height / 2 - k.y);
        if (dist < 30) {
            if (k.type === KITTEN_TYPES.FRIENDLY) {
                if (k.state !== 'rubbing') { k.state = 'rubbing'; k.rubbingTimer = 60; }
                if (k.rubbingTimer <= 0) { k.caught = true; player.carryingCat = k; }
            } else if (k.type === KITTEN_TYPES.SHY && dist < 15) {
                k.caught = true; player.carryingCat = k;
            }
        }
    }
}

function checkCorralDropoff() {
    const corralX = 3, corralY = 20, corralW = 9, corralH = 7;
    const ptx = Math.floor((player.x + player.width / 2) / TILE_SIZE);
    const pty = Math.floor((player.y + player.height / 2) / TILE_SIZE);
    if (ptx >= corralX && ptx < corralX + corralW && pty >= corralY && pty < corralY + corralH) {
        const pts = player.carryingCat.type === KITTEN_TYPES.FRIENDLY ? 1 : 2;
        score += pts;
        scoreElement.textContent = score;
        scoreElement.classList.add('bounce');
        setTimeout(() => scoreElement.classList.remove('bounce'), 300);
        savedCats.push({
            x: (corralX + 1 + Math.random() * (corralW - 2)) * TILE_SIZE,
            y: (corralY + 1 + Math.random() * (corralH - 3)) * TILE_SIZE, color: player.carryingCat.color, frame: 0, frameTimer: Math.random() * 100
        });
        kittens = kittens.filter(k => k !== player.carryingCat);
        player.carryingCat = null;
    }
}

function updateKittens() {
    for (let k of kittens) {
        if (k.caught) continue;
        const dist = Math.hypot(player.x + player.width / 2 - k.x, player.y + player.height / 2 - k.y);
        if (k.type === KITTEN_TYPES.SHY) {
            if (dist < 120) {
                const angle = Math.atan2(k.y - (player.y + player.height / 2), k.x - (player.x + player.width / 2));
                k.fleeDirection = { x: Math.cos(angle), y: Math.sin(angle) };
                k.state = 'fleeing'; k.fleeTimer = 30;
            }
            if (k.state === 'fleeing' && k.fleeTimer > 0) {
                const nx = k.x + k.fleeDirection.x * 3, ny = k.y + k.fleeDirection.y * 3;
                if (isValidKittenPosition(nx, ny)) { k.x = nx; k.y = ny; }
                else { k.fleeDirection.x = -k.fleeDirection.x + (Math.random() - 0.5); k.fleeDirection.y = -k.fleeDirection.y + (Math.random() - 0.5); }
                k.fleeTimer--;
                if (k.fleeTimer <= 0) k.state = 'idle';
            }
        } else if (k.type === KITTEN_TYPES.FRIENDLY && k.state === 'rubbing') {
            k.rubbingTimer--;
            k.x += ((player.x + player.width / 2) - k.x) * 0.1;
            k.y += ((player.y + player.height - 10) - k.y) * 0.1;
        }
        k.frameTimer++;
        if (k.frameTimer >= 15) { k.frameTimer = 0; k.frame = (k.frame + 1) % 2; }
    }
}

function drawTile(x, y, tile) {
    const sx = x * TILE_SIZE - camera.x, sy = y * TILE_SIZE - camera.y;
    if (sx < -TILE_SIZE || sx > CANVAS_WIDTH || sy < -TILE_SIZE || sy > CANVAS_HEIGHT) return;

    switch (tile) {
        case TILES.GRASS:
            ctx.fillStyle = ((x + y) % 2 === 0) ? COLORS.grass1 : COLORS.grass2;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            // Add grass detail
            ctx.fillStyle = COLORS.grassHighlight;
            ctx.fillRect(sx + (x * 7) % 20, sy + (y * 11) % 20, 2, 4);
            ctx.fillRect(sx + (x * 13) % 25 + 5, sy + (y * 17) % 22 + 3, 2, 3);
            break;
        case TILES.TALL_GRASS:
            ctx.fillStyle = ((x + y) % 2 === 0) ? COLORS.grass1 : COLORS.grass2;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.grass3;
            for (let i = 0; i < 6; i++) {
                const gx = sx + (i * 5 + (x * 3) % 5);
                ctx.fillRect(gx, sy + 8, 2, 12 + (i % 3) * 4);
            }
            break;
        case TILES.WATER:
            const wo = Math.sin(Date.now() / 400 + x * 0.5 + y * 0.3);
            ctx.fillStyle = wo > 0 ? COLORS.water : COLORS.waterDark;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.waterLight;
            ctx.beginPath();
            ctx.arc(sx + 10 + wo * 4, sy + 16, 4, 0, Math.PI * 2);
            ctx.arc(sx + 26 - wo * 3, sy + 8, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = COLORS.waterFoam;
            ctx.beginPath();
            ctx.arc(sx + 18 + wo * 2, sy + 22, 2, 0, Math.PI * 2);
            ctx.fill();
            break;
        case TILES.BRIDGE:
            ctx.fillStyle = COLORS.bridge;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.bridgeDark;
            for (let i = 0; i < 4; i++) ctx.fillRect(sx, sy + i * 8, TILE_SIZE, 2);
            ctx.fillStyle = COLORS.bridgeLight;
            ctx.fillRect(sx + 2, sy + 3, TILE_SIZE - 4, 3);
            ctx.fillRect(sx + 2, sy + 11, TILE_SIZE - 4, 3);
            ctx.fillRect(sx + 2, sy + 19, TILE_SIZE - 4, 3);
            ctx.fillRect(sx + 2, sy + 27, TILE_SIZE - 4, 3);
            break;
        case TILES.TREE:
            ctx.fillStyle = ((x + y) % 2 === 0) ? COLORS.grass1 : COLORS.grass2;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.treeTrunkDark;
            ctx.fillRect(sx + 11, sy + 18, 10, 14);
            ctx.fillStyle = COLORS.treeTrunk;
            ctx.fillRect(sx + 12, sy + 18, 8, 14);
            ctx.fillStyle = COLORS.treeShadow;
            ctx.beginPath(); ctx.arc(sx + 16, sy + 14, 16, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.treeTop;
            ctx.beginPath(); ctx.arc(sx + 16, sy + 12, 14, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.treeMid;
            ctx.beginPath(); ctx.arc(sx + 20, sy + 8, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.treeHighlight;
            ctx.beginPath(); ctx.arc(sx + 10, sy + 6, 6, 0, Math.PI * 2); ctx.fill();
            break;
        case TILES.BUSH:
            ctx.fillStyle = ((x + y) % 2 === 0) ? COLORS.grass1 : COLORS.grass2;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.treeShadow;
            ctx.beginPath(); ctx.arc(sx + 16, sy + 22, 14, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.treeTop;
            ctx.beginPath(); ctx.arc(sx + 16, sy + 20, 12, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.treeHighlight;
            ctx.beginPath(); ctx.arc(sx + 10, sy + 16, 6, 0, Math.PI * 2); ctx.fill();
            break;
        case TILES.ROCK:
            ctx.fillStyle = ((x + y) % 2 === 0) ? COLORS.grass1 : COLORS.grass2;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.rockDark;
            ctx.beginPath(); ctx.arc(sx + 16, sy + 20, 12, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.rock;
            ctx.beginPath(); ctx.arc(sx + 16, sy + 18, 11, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.rockLight;
            ctx.beginPath(); ctx.arc(sx + 12, sy + 14, 5, 0, Math.PI * 2); ctx.fill();
            break;
        case TILES.MUSHROOM:
            ctx.fillStyle = ((x + y) % 2 === 0) ? COLORS.grass1 : COLORS.grass2;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#e8dcc8';
            ctx.fillRect(sx + 13, sy + 20, 6, 10);
            ctx.fillStyle = COLORS.mushroomRed;
            ctx.beginPath(); ctx.arc(sx + 16, sy + 18, 10, Math.PI, 0); ctx.fill();
            ctx.fillStyle = COLORS.mushroomWhite;
            ctx.beginPath(); ctx.arc(sx + 12, sy + 14, 3, 0, Math.PI * 2); ctx.arc(sx + 20, sy + 16, 2, 0, Math.PI * 2); ctx.fill();
            break;
        case TILES.STUMP:
            ctx.fillStyle = ((x + y) % 2 === 0) ? COLORS.grass1 : COLORS.grass2;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.treeTrunkDark;
            ctx.fillRect(sx + 8, sy + 16, 16, 14);
            ctx.fillStyle = COLORS.treeTrunk;
            ctx.beginPath(); ctx.ellipse(sx + 16, sy + 16, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#d4a574';
            ctx.beginPath(); ctx.ellipse(sx + 16, sy + 16, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
            break;
        case TILES.CORRAL_FENCE:
            ctx.fillStyle = COLORS.corralInner;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.corralDark;
            ctx.fillRect(sx, sy, 6, TILE_SIZE); ctx.fillRect(sx + TILE_SIZE - 6, sy, 6, TILE_SIZE);
            ctx.fillRect(sx, sy, TILE_SIZE, 6); ctx.fillRect(sx, sy + TILE_SIZE - 6, TILE_SIZE, 6);
            ctx.fillStyle = COLORS.corral;
            ctx.fillRect(sx, sy + 10, TILE_SIZE, 4); ctx.fillRect(sx, sy + 22, TILE_SIZE, 4);
            break;
        case TILES.CORRAL_INSIDE:
            ctx.fillStyle = COLORS.corralInner;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.hay;
            for (let i = 0; i < 8; i++) {
                ctx.fillRect(sx + (x * 7 + i * 11) % 26, sy + (y * 13 + i * 17) % 26, 5, 2);
            }
            break;
        case TILES.PATH:
            ctx.fillStyle = COLORS.path;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.pathDark;
            ctx.beginPath();
            ctx.arc(sx + 8, sy + 10, 5, 0, Math.PI * 2);
            ctx.arc(sx + 24, sy + 22, 4, 0, Math.PI * 2);
            ctx.arc(sx + 16, sy + 6, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = COLORS.pathLight;
            ctx.beginPath();
            ctx.arc(sx + 20, sy + 14, 3, 0, Math.PI * 2);
            ctx.fill();
            break;
        case TILES.HOUSE:
            ctx.fillStyle = COLORS.house;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.houseRoofDark;
            ctx.fillRect(sx, sy, TILE_SIZE, 12);
            ctx.fillStyle = COLORS.houseRoof;
            ctx.fillRect(sx, sy, TILE_SIZE, 10);
            ctx.fillStyle = '#87ceeb';
            ctx.fillRect(sx + 10, sy + 16, 12, 10);
            ctx.fillStyle = '#4a3520';
            ctx.fillRect(sx + 15, sy + 16, 2, 10);
            ctx.fillRect(sx + 10, sy + 20, 12, 2);
            break;
    }
}

function drawFlowers() {
    for (const f of flowers) {
        const sx = f.x - camera.x, sy = f.y - camera.y;
        if (sx < -10 || sx > CANVAS_WIDTH + 10 || sy < -10 || sy > CANVAS_HEIGHT + 10) continue;
        ctx.fillStyle = f.color;
        if (f.type === 0) {
            ctx.beginPath(); ctx.arc(sx, sy, f.size, 0, Math.PI * 2); ctx.fill();
        } else if (f.type === 1) {
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2;
                ctx.beginPath(); ctx.arc(sx + Math.cos(a) * f.size * 0.5, sy + Math.sin(a) * f.size * 0.5, f.size * 0.4, 0, Math.PI * 2); ctx.fill();
            }
        } else {
            ctx.beginPath(); ctx.arc(sx, sy, f.size, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(sx + f.size * 0.6, sy - f.size * 0.4, f.size * 0.6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath(); ctx.arc(sx, sy, f.size * 0.35, 0, Math.PI * 2); ctx.fill();
    }
}

function drawDecorations() {
    for (const d of decorations) {
        const sx = d.x - camera.x, sy = d.y - camera.y;
        if (sx < -10 || sx > CANVAS_WIDTH + 10 || sy < -10 || sy > CANVAS_HEIGHT + 10) continue;
        if (d.type === 'grass_tuft') {
            ctx.fillStyle = COLORS.grassHighlight;
            for (let i = 0; i < 3 + d.variant; i++) {
                ctx.fillRect(sx + i * 3 - 4, sy - 4 - (i % 2) * 3, 2, 6 + (i % 2) * 3);
            }
        }
    }
}

function drawPlayer() {
    const sx = player.x - camera.x, sy = player.y - camera.y;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(sx + player.width / 2, sy + player.height - 2, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
    const bob = player.isMoving ? Math.sin(player.frame * Math.PI / 2) * 2 : 0;

    ctx.fillStyle = '#e8c4a0';
    if (player.direction === 'down' || player.direction === 'up') {
        ctx.beginPath();
        ctx.ellipse(sx + 7, sy + player.height - 3 + (player.isMoving && player.frame % 2 === 0 ? -2 : 0), 5, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(sx + player.width - 7, sy + player.height - 3 + (player.isMoving && player.frame % 2 === 1 ? -2 : 0), 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.beginPath(); ctx.ellipse(sx + player.width / 2, sy + player.height - 3, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = '#4a7090';
    ctx.fillRect(sx + 4, sy + 18 + bob, 7, 12);
    ctx.fillRect(sx + player.width - 11, sy + 18 + bob, 7, 12);
    ctx.fillStyle = '#5d8aa8';
    ctx.fillRect(sx + 3, sy + 10 + bob, player.width - 6, 12);
    ctx.fillStyle = '#4a7a98';
    ctx.fillRect(sx + 5, sy + 6 + bob, 4, 10);
    ctx.fillRect(sx + player.width - 9, sy + 6 + bob, 4, 10);
    ctx.fillStyle = '#e85050';
    ctx.fillRect(sx + 6, sy + 6 + bob, player.width - 12, 6);
    ctx.fillStyle = '#ffd5c0';
    ctx.beginPath(); ctx.arc(sx + player.width / 2, sy + 6 + bob, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8c4a0';
    ctx.beginPath(); ctx.arc(sx + player.width / 2, sy + 6 + bob, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d4a574';
    ctx.beginPath(); ctx.ellipse(sx + player.width / 2, sy + 2 + bob, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(sx + player.width / 2 - 7, sy - 7 + bob, 14, 9);
    ctx.fillStyle = '#c49565';
    ctx.fillRect(sx + player.width / 2 - 7, sy - 2 + bob, 14, 2);

    ctx.fillStyle = '#2a2a2a';
    if (player.direction === 'down') {
        ctx.beginPath();
        ctx.arc(sx + player.width / 2 - 3, sy + 5 + bob, 2, 0, Math.PI * 2);
        ctx.arc(sx + player.width / 2 + 3, sy + 5 + bob, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(sx + player.width / 2, sy + 9 + bob, 3, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    } else if (player.direction === 'left') {
        ctx.beginPath(); ctx.arc(sx + player.width / 2 - 4, sy + 5 + bob, 2, 0, Math.PI * 2); ctx.fill();
    } else if (player.direction === 'right') {
        ctx.beginPath(); ctx.arc(sx + player.width / 2 + 4, sy + 5 + bob, 2, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = '#e8c4a0';
    if (player.carryingCat) {
        ctx.fillRect(sx + 2, sy + 12 + bob, 5, 8);
        ctx.fillRect(sx + player.width - 7, sy + 12 + bob, 5, 8);
        drawKittenSprite(sx + player.width / 2, sy + 18 + bob, player.carryingCat.color, 0, true);
    } else {
        ctx.fillRect(sx, sy + 12 + bob, 4, 10);
        ctx.fillRect(sx + player.width - 4, sy + 12 + bob, 4, 10);
    }
}

function drawKittenSprite(x, y, color, frame, isCarried = false) {
    const s = isCarried ? 0.8 : 1;
    if (!isCarried) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath(); ctx.ellipse(x, y + 10 * s, 8 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(x, y, 10 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 6 * s, y - 3 * s, 7 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 11 * s, y - 8 * s); ctx.lineTo(x - 8 * s, y - 14 * s); ctx.lineTo(x - 5 * s, y - 8 * s);
    ctx.moveTo(x - 5 * s, y - 8 * s); ctx.lineTo(x - 2 * s, y - 14 * s); ctx.lineTo(x + 1 * s, y - 8 * s);
    ctx.fill();
    ctx.fillStyle = '#ffb6c1';
    ctx.beginPath();
    ctx.moveTo(x - 10 * s, y - 8 * s); ctx.lineTo(x - 8 * s, y - 12 * s); ctx.lineTo(x - 6 * s, y - 8 * s);
    ctx.moveTo(x - 4 * s, y - 8 * s); ctx.lineTo(x - 2 * s, y - 12 * s); ctx.lineTo(x * s, y - 8 * s);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(x - 9 * s, y - 4 * s, 2.5 * s, 0, Math.PI * 2); ctx.arc(x - 3 * s, y - 4 * s, 2.5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - 9 * s + 0.8, y - 4.5 * s, 1 * s, 0, Math.PI * 2); ctx.arc(x - 3 * s + 0.8, y - 4.5 * s, 1 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb6c1';
    ctx.beginPath(); ctx.arc(x - 6 * s, y - 1 * s, 2 * s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
    const tw = Math.sin(Date.now() / 200 + frame) * 4;
    ctx.beginPath(); ctx.moveTo(x + 8 * s, y); ctx.quadraticCurveTo(x + 16 * s, y - 6 * s + tw, x + 12 * s, y - 14 * s + tw); ctx.stroke();
    ctx.lineWidth = 1;
}

function drawKittens() {
    for (const k of kittens) {
        if (k.caught) continue;
        const sx = k.x - camera.x, sy = k.y - camera.y;
        if (sx < -30 || sx > CANVAS_WIDTH + 30 || sy < -30 || sy > CANVAS_HEIGHT + 30) continue;
        if (k.type === KITTEN_TYPES.SHY && k.state === 'fleeing') {
            ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 14px Arial'; ctx.fillText('!', sx + 5, sy - 18);
        }
        if (k.type === KITTEN_TYPES.FRIENDLY && k.state === 'rubbing') {
            ctx.fillStyle = '#ff6b9d'; ctx.font = '16px Arial'; ctx.fillText('♥', sx + 8, sy - 20);
        }
        drawKittenSprite(sx, sy, k.color, k.frame);
        if (k.type === KITTEN_TYPES.SHY) {
            ctx.fillStyle = 'rgba(100,100,255,0.6)'; ctx.beginPath(); ctx.arc(sx + 14, sy - 14, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Arial'; ctx.fillText('!', sx + 12, sy - 11);
        }
    }
}

function drawSavedCats() {
    for (const c of savedCats) {
        const sx = c.x - camera.x, sy = c.y - camera.y;
        if (sx < -30 || sx > CANVAS_WIDTH + 30 || sy < -30 || sy > CANVAS_HEIGHT + 30) continue;
        c.frameTimer++;
        if (c.frameTimer >= 60) { c.frameTimer = 0; c.frame = (c.frame + 1) % 2; }
        drawKittenSprite(sx, sy, c.color, c.frame);
        ctx.fillStyle = 'rgba(100,100,255,0.7)'; ctx.font = '12px Arial';
        const zo = Math.sin(Date.now() / 500) * 2;
        ctx.fillText('z', sx + 16 + zo, sy - 12 - zo); ctx.fillText('z', sx + 22 + zo, sy - 18 - zo);
    }
}

function drawUI() {
    const remF = kittens.filter(k => !k.caught && k.type === KITTEN_TYPES.FRIENDLY).length;
    const remS = kittens.filter(k => !k.caught && k.type === KITTEN_TYPES.SHY).length;
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(10, CANVAS_HEIGHT - 65, 190, 55);
    ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 3; ctx.strokeRect(10, CANVAS_HEIGHT - 65, 190, 55);
    ctx.fillStyle = '#3a2a1a'; ctx.font = 'bold 13px Nunito, sans-serif';
    ctx.fillText(`🐱 Tiernos: ${remF}  (1 pt)`, 22, CANVAS_HEIGHT - 42);
    ctx.fillText(`😺 Tímidos: ${remS}  (2 pts)`, 22, CANVAS_HEIGHT - 22);
    if (player.carryingCat) {
        ctx.fillStyle = 'rgba(255,235,210,0.98)'; ctx.fillRect(CANVAS_WIDTH / 2 - 90, 10, 180, 35);
        ctx.strokeStyle = '#e85d75'; ctx.lineWidth = 3; ctx.strokeRect(CANVAS_WIDTH / 2 - 90, 10, 180, 35);
        ctx.fillStyle = '#e85d75'; ctx.font = 'bold 15px Nunito, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🐱 ¡Llevando gatito al corral!', CANVAS_WIDTH / 2, 33); ctx.textAlign = 'left';
    }
    if (kittens.length === 0 && savedCats.length > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.98)'; ctx.fillRect(CANVAS_WIDTH / 2 - 160, CANVAS_HEIGHT / 2 - 55, 320, 110);
        ctx.strokeStyle = '#4CAF50'; ctx.lineWidth = 5; ctx.strokeRect(CANVAS_WIDTH / 2 - 160, CANVAS_HEIGHT / 2 - 55, 320, 110);
        ctx.fillStyle = '#4CAF50'; ctx.font = 'bold 26px Nunito, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🎉 ¡Etapa Completada! 🎉', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 12);
        ctx.font = 'bold 20px Nunito, sans-serif'; ctx.fillStyle = '#e85d75';
        ctx.fillText(`Puntuación: ${score} puntos`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 28); ctx.textAlign = 'left';
    }
}

function gameLoop() {
    ctx.fillStyle = COLORS.grass1; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    updatePlayer(); updateKittens(); updateCamera();
    for (let y = 0; y < MAP_HEIGHT; y++) { for (let x = 0; x < MAP_WIDTH; x++) { drawTile(x, y, gameMap[y][x]); } }
    drawDecorations(); drawFlowers(); drawSavedCats(); drawKittens(); drawPlayer(); drawUI();
    requestAnimationFrame(gameLoop);
}

function init() { generateMap(); spawnKittens(); gameLoop(); console.log('🐱 Cat Caretaker Game Started!'); }
init();
