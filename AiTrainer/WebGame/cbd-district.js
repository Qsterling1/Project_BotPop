(function (root) {
    const TILE_SIZE = 64;
    const MAP_COLS = 28;
    const MAP_ROWS = 20;
    const SCENE_NAME = 'CBD_DISTRICT';

    const TILE = {
        BUILDING: 'building',
        ROAD: 'road',
        SIDEWALK: 'sidewalk',
        CROSSWALK: 'crosswalk',
        TREE: 'tree',
        BUSH: 'bush',
        DOOR: 'door'
    };

    const TILE_ASSETS = {
        building: 'Art/Sprites/Environment/CBD/building_roof.png',
        road: 'Art/Sprites/Environment/CBD/road.png',
        sidewalk: 'Art/Sprites/Environment/CBD/sidewalk.png',
        crosswalk: 'Art/Sprites/Environment/CBD/crosswalk.png',
        tree: 'Art/Sprites/Environment/CBD/tree.png',
        bush: 'Art/Sprites/Environment/CBD/bush.png',
        door: 'Art/Sprites/Environment/CBD/door.png'
    };

    const WALKABLE = new Set([TILE.SIDEWALK, TILE.CROSSWALK]);

    function createGrid() {
        const grid = Array.from({ length: MAP_ROWS }, () =>
            Array.from({ length: MAP_COLS }, () => TILE.BUILDING)
        );

        const roadCols = new Set([7, 8, 17, 18]);
        const roadRows = new Set([6, 7, 14, 15]);

        for (let y = 0; y < MAP_ROWS; y++) {
            for (let x = 0; x < MAP_COLS; x++) {
                if (roadCols.has(x) || roadRows.has(y)) {
                    grid[y][x] = TILE.ROAD;
                }
            }
        }

        for (let y = 0; y < MAP_ROWS; y++) {
            for (let x = 0; x < MAP_COLS; x++) {
                if (grid[y][x] !== TILE.BUILDING) continue;
                if (isNextToRoad(x, y, roadCols, roadRows)) {
                    grid[y][x] = TILE.SIDEWALK;
                }
            }
        }

        const crossingCols = [7, 8, 17, 18];
        const crossingRows = [6, 7, 14, 15];
        for (const y of crossingRows) {
            for (const x of crossingCols) {
                grid[y][x] = TILE.CROSSWALK;
            }
        }

        const midCrosswalks = [
            { cols: [7, 8], rows: [2, 3] },
            { cols: [7, 8], rows: [10, 11] },
            { cols: [17, 18], rows: [10, 11] },
            { cols: [17, 18], rows: [18, 19] },
            { cols: [2, 3], rows: [6, 7] },
            { cols: [12, 13], rows: [6, 7] },
            { cols: [22, 23], rows: [14, 15] }
        ];

        for (const crossing of midCrosswalks) {
            for (const y of crossing.rows) {
                for (const x of crossing.cols) {
                    if (isInBounds(x, y)) grid[y][x] = TILE.CROSSWALK;
                }
            }
        }

        const props = [
            [5, 5, TILE.TREE], [10, 5, TILE.TREE], [16, 5, TILE.BUSH],
            [20, 5, TILE.TREE], [6, 13, TILE.BUSH], [16, 13, TILE.TREE],
            [19, 13, TILE.BUSH], [24, 13, TILE.TREE], [5, 16, TILE.TREE],
            [10, 16, TILE.BUSH], [20, 18, TILE.TREE]
        ];

        for (const [x, y, type] of props) {
            if (isInBounds(x, y)) grid[y][x] = type;
        }

        const doors = [[2, 5], [12, 5], [21, 13], [25, 16]];
        for (const [x, y] of doors) {
            if (isInBounds(x, y)) grid[y][x] = TILE.DOOR;
        }

        return grid;
    }

    function isNextToRoad(x, y, roadCols, roadRows) {
        return roadCols.has(x - 1) || roadCols.has(x + 1) ||
            roadRows.has(y - 1) || roadRows.has(y + 1);
    }

    function isInBounds(tileX, tileY) {
        return tileX >= 0 && tileY >= 0 && tileX < MAP_COLS && tileY < MAP_ROWS;
    }

    function createDistrictState() {
        return {
            sceneName: SCENE_NAME,
            tileSize: TILE_SIZE,
            cols: MAP_COLS,
            rows: MAP_ROWS,
            width: MAP_COLS * TILE_SIZE,
            height: MAP_ROWS * TILE_SIZE,
            grid: createGrid(),
            player: { x: 1 * TILE_SIZE + 32, y: 5 * TILE_SIZE + 32, radius: 14 },
            camera: { x: 0, y: 0, zoom: 1 },
            keys: {},
            paused: false,
            debugLog: ['CBD Core loaded.'],
            lastAction: 'Ready'
        };
    }

    let state = createDistrictState();
    let canvasRef = null;
    let ctxRef = null;
    let images = {};
    let initialized = false;

    function init(canvas, ctx) {
        canvasRef = canvas;
        ctxRef = ctx;

        if (!initialized && typeof window !== 'undefined') {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            canvas.addEventListener('wheel', handleWheel, { passive: false });
            canvas.addEventListener('contextmenu', (event) => event.preventDefault());
            initialized = true;
        }
    }

    async function loadAssets(loadImage) {
        const entries = Object.entries(TILE_ASSETS);
        for (const [key, path] of entries) {
            images[key] = await loadImage(path);
        }
    }

    function reset() {
        state = createDistrictState();
    }

    function handleKeyDown(event) {
        if (!isActiveScene()) return;

        const key = event.key.toLowerCase();
        if (key === 'escape' || key === 'p') {
            state.paused = !state.paused;
            state.debugLog.push(state.paused ? 'Paused.' : 'Resumed.');
            event.preventDefault();
            return;
        }

        if (['w', 'a', 's', 'd'].includes(key)) {
            state.keys[key] = true;
            event.preventDefault();
        }
    }

    function handleKeyUp(event) {
        const key = event.key.toLowerCase();
        if (['w', 'a', 's', 'd'].includes(key)) {
            state.keys[key] = false;
            event.preventDefault();
        }
    }

    function handleWheel(event) {
        if (!isActiveScene()) return;
        event.preventDefault();

        const direction = event.deltaY > 0 ? -0.1 : 0.1;
        state.camera.zoom = clamp(state.camera.zoom + direction, 0.75, 1.45);
        state.debugLog.push(`Zoom ${state.camera.zoom.toFixed(2)}x`);
    }

    function handleClick(clickX, clickY, button) {
        if (button === 2) {
            logTileAtPlayer('Scan');
            return;
        }

        logTileAtPlayer('Action');
    }

    function logTileAtPlayer(prefix) {
        const tileX = Math.floor(state.player.x / TILE_SIZE);
        const tileY = Math.floor(state.player.y / TILE_SIZE);
        const tile = getTile(state, tileX, tileY);
        state.lastAction = `${prefix}: ${tile} at ${tileX},${tileY}`;
        state.debugLog.push(state.lastAction);
        trimDebugLog();
    }

    function update() {
        if (!canvasRef || state.paused) return;

        let dx = 0;
        let dy = 0;
        const speed = 3;

        if (state.keys.w) dy -= speed;
        if (state.keys.s) dy += speed;
        if (state.keys.a) dx -= speed;
        if (state.keys.d) dx += speed;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        if (dx || dy) {
            state = tryMovePlayer(state, dx, dy);
        }

        updateCamera();
    }

    function tryMovePlayer(districtState, dx, dy) {
        const movedX = moveAxis(districtState, dx, 0);
        return moveAxis(movedX, 0, dy);
    }

    function moveAxis(districtState, dx, dy) {
        const next = {
            ...districtState,
            player: {
                ...districtState.player,
                x: clamp(districtState.player.x + dx, 0, districtState.width),
                y: clamp(districtState.player.y + dy, 0, districtState.height)
            }
        };

        if (canStandAt(next, next.player.x, next.player.y)) {
            return next;
        }

        return districtState;
    }

    function canStandAt(districtState, x, y) {
        const radius = districtState.player.radius;
        const points = [
            [x - radius, y - radius],
            [x + radius, y - radius],
            [x - radius, y + radius],
            [x + radius, y + radius],
            [x, y]
        ];

        return points.every(([px, py]) => {
            const tileX = Math.floor(px / TILE_SIZE);
            const tileY = Math.floor(py / TILE_SIZE);
            return isTileWalkable(districtState, tileX, tileY);
        });
    }

    function isTileWalkable(districtState, tileX, tileY) {
        if (!isInBounds(tileX, tileY)) return false;
        return WALKABLE.has(getTile(districtState, tileX, tileY));
    }

    function getTile(districtState, tileX, tileY) {
        if (!isInBounds(tileX, tileY)) return TILE.BUILDING;
        return districtState.grid[tileY][tileX];
    }

    function updateCamera() {
        const viewW = canvasRef.width / state.camera.zoom;
        const viewH = canvasRef.height / state.camera.zoom;
        state.camera.x = clamp(state.player.x - viewW / 2, 0, Math.max(0, state.width - viewW));
        state.camera.y = clamp(state.player.y - viewH / 2, 0, Math.max(0, state.height - viewH));
    }

    function draw() {
        if (!ctxRef || !canvasRef) return;

        update();

        ctxRef.save();
        ctxRef.fillStyle = '#08111f';
        ctxRef.fillRect(0, 0, canvasRef.width, canvasRef.height);
        ctxRef.scale(state.camera.zoom, state.camera.zoom);
        ctxRef.translate(-state.camera.x, -state.camera.y);
        drawMap();
        drawDistrictLabels();
        drawPlayer();
        ctxRef.restore();

        drawHud();
        if (state.paused) drawPauseOverlay();
    }

    function drawMap() {
        for (let y = 0; y < state.rows; y++) {
            for (let x = 0; x < state.cols; x++) {
                const tile = state.grid[y][x];
                const img = images[tile];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;

                if (img) {
                    ctxRef.drawImage(img, px, py, TILE_SIZE, TILE_SIZE);
                } else {
                    drawFallbackTile(tile, px, py);
                }
            }
        }
    }

    function drawFallbackTile(tile, x, y) {
        const colors = {
            building: '#2b3144',
            road: '#202734',
            sidewalk: '#6f7584',
            crosswalk: '#d6d8df',
            tree: '#1f6b45',
            bush: '#2c8a5f',
            door: '#385b8f'
        };

        ctxRef.fillStyle = colors[tile] || '#2b3144';
        ctxRef.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }

    function drawDistrictLabels() {
        drawMapLabel('DATA SYNC', 1, 1);
        drawMapLabel('DRURY TOWERS', 10, 2);
        drawMapLabel('CLOUD CORE', 20, 3);
        drawMapLabel('AXIOM CORP', 20, 11);
        drawMapLabel('NOVA SQUARE', 10, 17);
    }

    function drawMapLabel(text, tileX, tileY) {
        const x = tileX * TILE_SIZE + 8;
        const y = tileY * TILE_SIZE + 36;
        ctxRef.fillStyle = 'rgba(8, 21, 42, 0.85)';
        ctxRef.fillRect(x - 4, y - 28, text.length * 10 + 8, 34);
        ctxRef.strokeStyle = '#40dfff';
        ctxRef.lineWidth = 2;
        ctxRef.strokeRect(x - 4, y - 28, text.length * 10 + 8, 34);
        ctxRef.fillStyle = '#8df8ff';
        ctxRef.font = '12px "Press Start 2P", monospace';
        ctxRef.fillText(text, x, y - 6);
    }

    function drawPlayer() {
        ctxRef.fillStyle = '#ffd24d';
        ctxRef.beginPath();
        ctxRef.arc(state.player.x, state.player.y, state.player.radius, 0, Math.PI * 2);
        ctxRef.fill();
        ctxRef.strokeStyle = '#231500';
        ctxRef.lineWidth = 3;
        ctxRef.stroke();
    }

    function drawHud() {
        ctxRef.fillStyle = 'rgba(0, 0, 0, 0.62)';
        ctxRef.fillRect(16, 16, 420, 92);
        ctxRef.strokeStyle = '#4ecdc4';
        ctxRef.lineWidth = 3;
        ctxRef.strokeRect(16, 16, 420, 92);
        ctxRef.fillStyle = '#ffffff';
        ctxRef.font = '14px "Press Start 2P", monospace';
        ctxRef.fillText('CBD CORE', 34, 46);
        ctxRef.font = '10px "Press Start 2P", monospace';
        ctxRef.fillText('WASD MOVE  LEFT CLICK ACTION  P/ESC PAUSE', 34, 78);
        ctxRef.fillText(state.lastAction, 34, 98);
    }

    function drawPauseOverlay() {
        ctxRef.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctxRef.fillRect(0, 0, canvasRef.width, canvasRef.height);
        ctxRef.fillStyle = '#ffffff';
        ctxRef.font = '24px "Press Start 2P", monospace';
        ctxRef.fillText('PAUSED', 64, 88);
        ctxRef.font = '12px "Press Start 2P", monospace';
        ctxRef.fillText('P / ESC: RESUME', 64, 132);
        ctxRef.fillText(`PLAYER ${Math.round(state.player.x)}, ${Math.round(state.player.y)}`, 64, 174);
        ctxRef.fillText(`ZOOM ${state.camera.zoom.toFixed(2)}x`, 64, 206);
        ctxRef.fillText('DEBUG LOG', 64, 258);

        const lines = state.debugLog.slice(-8);
        for (let i = 0; i < lines.length; i++) {
            ctxRef.fillText(lines[i], 64, 292 + i * 28);
        }
    }

    function trimDebugLog() {
        if (state.debugLog.length > 30) {
            state.debugLog = state.debugLog.slice(-30);
        }
    }

    function isActiveScene() {
        return root.gameState && root.gameState.scene === SCENE_NAME;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    const api = {
        SCENE_NAME,
        TILE,
        createDistrictState,
        isTileWalkable,
        tryMovePlayer,
        init,
        loadAssets,
        reset,
        draw,
        handleClick
    };

    root.CBDDistrict = api;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CBDDistrict: api };
    }
})(typeof window !== 'undefined' ? window : globalThis);
