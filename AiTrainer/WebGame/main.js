// ============================================================================
// AI TRAINER - WARM-UP BATTLE v3.1 (Battle Logic Refactor)
// UI text normalized. Hit logic audited. Integrity-based victory. 2025-01-27
// Heat affects accuracy. RNG transparency. endTurn() cleanup. System Integrity UI.
// ============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ============================================================================
// GAME STATE
// ============================================================================

const gameState = {
    scene: 'LOADING',
    images: {},
    loaded: false,
    currentBg: null,
    battle: null,
    selectedMove: null,
    currentEnemy: null,
    challengeEnemy: null,
    uiAnimations: {
        hitMiss: null,
        frame: 0,
        duration: 0
    },
    fullscreen: {
        visible: true,
        hideTimer: null,
        lastInteraction: Date.now(),
        pressed: false  // Visual feedback for button press
    },
    firstInteraction: false
};

// ============================================================================
// ASSET PATHS
// ============================================================================

const ASSETS = {
    menu: 'Art/Sprites/UI/MainMenueScrene.png',
    playButton: 'Art/Sprites/UI/_0000s_0004_Play-button.png',
    uiBoxTopLeft: 'Art/Sprites/UI/_0000s_0001_TopLeftTextBox_UI.png',
    uiBoxBottomRight: 'Art/Sprites/UI/_0000s_0000_BottomRightTextBox_UI.png',
    iconMarquee: 'Art/Sprites/UI/_0000s_0000s_0000_Marquee-Icon.png',
    iconEnemy: 'Art/Sprites/UI/_0000s_0000s_0001_Enemy-icon.png',
    iconGpu: 'Art/Sprites/UI/_0000s_0016_Gpu.png',
    iconCpu: 'Art/Sprites/UI/_0000s_0014_Cpu.png',
    iconRam: 'Art/Sprites/UI/_0000s_0012_Ram.png',
    miss: 'Art/Sprites/UI/_0000s_0009_Miss.png',
    directHitReceived: 'Art/Sprites/UI/_0000s_0001s_0000_Received-direct-hit-main.png',
    directHitLanded: 'Art/Sprites/UI/_0000s_0001s_0003_Direct-hit-landed.-Main.png',
    youWin: 'Art/Sprites/UI/_0000s_0003_You-win.png',
    youLose: 'Art/Sprites/UI/_0000s_0007_Loss.png',
    giveUp: 'Art/Sprites/UI/_0000s_0008_Give-up.png',
    backgrounds: [
        'Art/Sprites/BackGround/_0004s_0009_Bacground1.png',
        'Art/Sprites/BackGround/_0004s_0007_Bacground2.png',
        'Art/Sprites/BackGround/_0004s_0006_Bacground3.png',
        'Art/Sprites/BackGround/_0004s_0005_Bacground4.png',
        'Art/Sprites/BackGround/_0004s_0004_Bacground5.png'
    ],
    tabia: {
        idle: 'Art/Sprites/Player/_0001s_0009_TabiaIdle1.png',
        win: 'Art/Sprites/Player/_0001s_0007_Tabia_Win.png',
        loss: 'Art/Sprites/Player/_0001s_0008_Tabia_Loss.png',
        surprised: 'Art/Sprites/Player/_0001s_0003_Front_Tabia_-Surprised.png',
        thinking: 'Art/Sprites/Player/_0001s_0002_Front_Tabia_-Thinking.png',
        jumpPoint: 'Art/Sprites/Player/_0001s_0006_Tabia_JumpPoint.png'
    },
    bot: {
        idle: 'Art/Sprites/Bots/_0002s_0006_MarqueeBot1_Idle.png',
        attack: 'Art/Sprites/Bots/_0002s_0003_MarqueeBot1_Attack1.png',
        victory: 'Art/Sprites/Bots/_0002s_0004_MarqueeBot1_-Victory.png'
    },
    enemy: {
        idle: 'Art/Sprites/Enemy/_0003s_0008_Enemy1_Idle.png',
        attack: 'Art/Sprites/Enemy/_0003s_0000_Enemy1_Attack2.png',
        hit: 'Art/Sprites/Enemy/_0003s_0006_Enemy1_Hit.png',
        defeated: 'Art/Sprites/Enemy/_0003s_0003_Enemy1_-Defeated.png',
        victory: 'Art/Sprites/Enemy/_0003s_0005_Enemy1_Victory.png'
    }
};

// ============================================================================
// AUDIO SETUP
// ============================================================================

const BGM_TRACKS = [
    'Audio/CoolGamePlayBackgroundMusic.mp3',
    'Audio/CoolGamePlayBackgroundMusic2.mp3'
];

const audio = {
    bgm: null,
    attack: new Audio('Audio/attack_laser.wav'),
    hit: new Audio('Audio/hit_blip.wav'),
    miss: new Audio('Audio/miss_swoosh.wav'),
    victory: new Audio('Audio/victory_jingle.wav'),
    defeat: new Audio('Audio/defeat_jingle.wav'),
    drop: new Audio('Audio/A. I. TrainerDropSound.mp3')
};

audio.attack.volume = 0.3;
audio.hit.volume = 0.4;
audio.miss.volume = 0.35;
audio.victory.volume = 0.6;
audio.defeat.volume = 0.6;
audio.drop.volume = 0.5;

function playSound(soundName) {
    try {
        const sound = audio[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(err => console.log('Audio play blocked:', err));
        }
    } catch (err) {
        console.log('Audio error:', err);
    }
}

function playBGM() {
    try {
        const randomTrack = BGM_TRACKS[Math.floor(Math.random() * BGM_TRACKS.length)];
        audio.bgm = new Audio(randomTrack);
        audio.bgm.loop = true;
        audio.bgm.volume = 0.4;
        audio.bgm.play().catch(err => console.log('BGM blocked:', err));
    } catch (err) {
        console.log('BGM error:', err);
    }
}

function playDropSoundOnce() {
    if (!gameState.firstInteraction) {
        gameState.firstInteraction = true;
        playSound('drop');
    }
}

function stopBGM() {
    if (audio.bgm) {
        audio.bgm.pause();
        audio.bgm.currentTime = 0;
    }
}

// ============================================================================
// ROBOT DATA & STATS
// ============================================================================

const PLAYER_MOVES = [
    { name: "Pulse Beam", slot: "GPU", description: "Standard attack", compute: 35, heat: 25, accuracy: 85, effect: null },
    { name: "Flash BIOS", slot: "CPU", description: "2x dmg if hit, -1 if miss", compute: 50, heat: 30, accuracy: 60, effect: "FLASH_BIOS" },
    { name: "Overclock", slot: "System", description: "Dodge - boost miss chance", compute: 0, heat: 15, accuracy: 100, effect: "OVERCLOCK" },
    { name: "Reboot", slot: "Thermal", description: "Recover health", compute: 0, heat: -30, accuracy: 100, effect: "REBOOT" }
];

const ENEMY_ROBOTS = [
    {
        name: "CacheCutter v3",
        stats: { compute: 30, logic: 45, memory: 20, network: 25, io: 75, power: 100, thermals: 68 },
        integrity: 100,
        moves: [
            { name: "Cache Burst", compute: 30, heat: 20, accuracy: 80 },
            { name: "Memory Leak", compute: 20, heat: 15, accuracy: 85, effect: "DRAIN" }
        ]
    },
    {
        name: "ArrayBreaker",
        stats: { compute: 40, logic: 35, memory: 15, network: 30, io: 70, power: 100, thermals: 73 },
        integrity: 100,
        moves: [
            { name: "Array Smash", compute: 40, heat: 25, accuracy: 75 },
            { name: "Index Overflow", compute: 25, heat: 18, accuracy: 80 }
        ]
    },
    {
        name: "Overclock Lynx",
        stats: { compute: 35, logic: 55, memory: 25, network: 20, io: 80, power: 100, thermals: 71 },
        integrity: 100,
        moves: [
            { name: "OC Spike", compute: 45, heat: 35, accuracy: 70 },
            { name: "Quick Execute", compute: 20, heat: 10, accuracy: 90 }
        ]
    },
    {
        name: "NullStack Prime",
        stats: { compute: 50, logic: 40, memory: 30, network: 35, io: 65, power: 100, thermals: 75 },
        integrity: 100,
        moves: [
            { name: "Null Pointer", compute: 50, heat: 30, accuracy: 65 },
            { name: "Stack Overflow", compute: 35, heat: 25, accuracy: 75, effect: "OVERHEAT" }
        ]
    }
];

class Battle {
    constructor(enemyData) {
        this.player = {
            name: "MarqueeBot1",
            stats: { compute: 35, logic: 50, memory: 20, network: 30, io: 80, power: 100, thermals: 60 },
            integrity: 100,
            heat: 0,
            hits: 0,
            dodgeBoost: 0,
            moves: PLAYER_MOVES,
            statusEffects: []
        };

        this.enemy = {
            name: enemyData.name,
            stats: { ...enemyData.stats },
            integrity: enemyData.integrity,
            heat: 0,
            hits: 0,
            moves: enemyData.moves,
            statusEffects: []
        };

        this.turnCount = 0;
        this.running = true;
        this.log = [];
        this.rewards = { dataPackets: 0, partsGained: [], xp: 0, pmp: 0 };

        this.playerSprites = { tabia: ASSETS.tabia.idle, bot: ASSETS.bot.idle };
        this.enemySprite = ASSETS.enemy.idle;

        this.playerBotX = -300;
        this.enemyBotX = 1500;
        this.slideComplete = false;
    }

    addLog(message) {
        this.log.push(message);
        console.log(message);
    }

    determineTurnOrder(playerMove, enemyMove) {
        return this.player.stats.logic >= this.enemy.stats.logic ? 'player' : 'enemy';
    }

    calculateDamage(attacker, defender, move) {
        // Handle special moves first
        if (move.effect === 'OVERCLOCK') {
            attacker.dodgeBoost = 30; // +30% dodge chance for next enemy attack
            attacker.heat += move.heat;
            return { hit: true, damage: 0, critical: false, effect: 'OVERCLOCK' };
        }

        if (move.effect === 'REBOOT') {
            const healAmount = 30;
            attacker.integrity = Math.min(100, attacker.integrity + healAmount);
            attacker.heat += move.heat;
            return { hit: true, damage: -healAmount, critical: false, effect: 'REBOOT' };
        }

        let damage = attacker.stats.compute + move.compute;
        let accuracy = move.accuracy * (attacker.stats.io / 100);

        // Apply heat penalty to accuracy BEFORE hit roll
        if (attacker.heat > attacker.stats.power) {
            accuracy *= 0.8; // -20% accuracy when overheating
            this.addLog(`${attacker.name} is OVERHEATING! Accuracy reduced!`);
        }

        // Apply dodge boost if defender has it
        if (defender.dodgeBoost > 0) {
            accuracy -= defender.dodgeBoost;
            defender.dodgeBoost = 0; // Consume dodge boost
        }

        let hitRoll = Math.random() * 100;

        // [RNG] Log hit roll for transparency
        console.log(`[RNG] ${attacker.name} hit roll: ${hitRoll.toFixed(1)}% vs ${accuracy.toFixed(1)}% accuracy`);

        if (hitRoll > accuracy) {
            // Flash BIOS miss penalty
            if (move.effect === 'FLASH_BIOS') {
                attacker.hits = Math.max(0, attacker.hits - 1);
                return { hit: false, damage: 0, critical: false, effect: 'FLASH_BIOS_MISS' };
            }
            return { hit: false, damage: 0, critical: false };
        }

        // Flash BIOS hit bonus
        if (move.effect === 'FLASH_BIOS') {
            damage *= 2;
        }

        const critRoll = Math.random();
        const critical = critRoll < 0.1;

        // [RNG] Log critical roll for transparency
        console.log(`[RNG] ${attacker.name} critical roll: ${critRoll.toFixed(3)} vs 0.100 threshold (crit=${critical})`);

        if (critical) {
            damage *= 1.5;
        }

        attacker.heat += move.heat;

        return { hit: true, damage: Math.floor(damage), critical };
    }
}

// ============================================================================
// ASSET LOADING
// ============================================================================

function loadImage(path) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = path;
    });
}

async function loadAllAssets() {
    console.log('Loading assets...');

    try {
        for (const [key, path] of Object.entries(ASSETS)) {
            if (typeof path === 'string') {
                gameState.images[path] = await loadImage(path);
            } else if (typeof path === 'object') {
                for (const subPath of Object.values(path)) {
                    gameState.images[subPath] = await loadImage(subPath);
                }
            }
        }

        for (const bg of ASSETS.backgrounds) {
            gameState.images[bg] = await loadImage(bg);
        }

        gameState.loaded = true;
        gameState.scene = 'MENU';
        console.log('All assets loaded!');

        drawMainMenu();
    } catch (error) {
        console.error('Asset loading failed:', error);
    }
}

// ============================================================================
// RENDERING WITH PIXEL FONT
// ============================================================================

function drawPixelText(text, x, y, size, color, align = 'left', bold = false) {
    ctx.font = `${bold ? 'bold ' : ''}${size}px "Press Start 2P", "Courier New", monospace`;
    ctx.textAlign = align;

    // Add thick black outline for readability
    ctx.strokeStyle = '#000000';
   // ctx.lineWidth = Math.max(3, size / 4);
   // ctx.lineJoin = 'round';
   // ctx.miterLimit = 0;
    ctx.strokeText(text, x, y);//

    // Fill with color
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

// ============================================================================
// LOADING SCREEN
// ============================================================================
function drawLoadingScreen() {
    // Background color
    ctx.fillStyle = '#1a1a2e';  // ADJUST: Loading screen background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Loading text
    const loadingText = 'Loading...';
    drawPixelText(loadingText, canvas.width / 2, canvas.height / 2 - 30, 32, '#FFFFFF', 'center', true);

    // Pulsing dots animation
    const dotCount = Math.floor((Date.now() / 300) % 4);
    const dots = '.'.repeat(dotCount);
    drawPixelText('Please wait' + dots, canvas.width / 2, canvas.height / 2 + 20, 20, '#4ECDC4', 'center', false);
}

// ============================================================================
// FULLSCREEN BUTTON SYSTEM
// ============================================================================
function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement ||
              document.mozFullScreenElement || document.msFullscreenElement);
}

function requestFullscreen() {
    console.log('[FULLSCREEN] Button clicked - attempting fullscreen...');
    const elem = document.documentElement;

    // Log available APIs
    console.log('[FULLSCREEN] Available APIs:', {
        standard: !!elem.requestFullscreen,
        webkit: !!elem.webkitRequestFullscreen,
        webkitEnter: !!elem.webkitEnterFullscreen,
        moz: !!elem.mozRequestFullScreen,
        ms: !!elem.msRequestFullscreen
    });

    // Try standard fullscreen API first
    if (elem.requestFullscreen) {
        console.log('[FULLSCREEN] Using standard requestFullscreen API');
        elem.requestFullscreen().then(() => {
            console.log('[FULLSCREEN] Success!');
        }).catch(err => {
            console.log('[FULLSCREEN] Standard API failed:', err);
        });
    }
    // WebKit (Safari, Chrome on iOS/Android)
    else if (elem.webkitRequestFullscreen) {
        console.log('[FULLSCREEN] Using webkit requestFullscreen API');
        elem.webkitRequestFullscreen();
    }
    // iOS Safari specific - try canvas element
    else if (elem.webkitEnterFullscreen) {
        console.log('[FULLSCREEN] Using webkit enterFullscreen API');
        elem.webkitEnterFullscreen();
    }
    // Firefox
    else if (elem.mozRequestFullScreen) {
        console.log('[FULLSCREEN] Using Firefox mozRequestFullScreen API');
        elem.mozRequestFullScreen();
    }
    // IE/Edge
    else if (elem.msRequestFullscreen) {
        console.log('[FULLSCREEN] Using IE/Edge msRequestFullscreen API');
        elem.msRequestFullscreen();
    }
    // Mobile fallback - try to maximize viewport
    else {
        console.log('[FULLSCREEN] No document-level API, trying canvas...');
        // Try canvas-specific fullscreen
        const canvas = document.getElementById('gameCanvas');
        if (canvas && canvas.requestFullscreen) {
            console.log('[FULLSCREEN] Using canvas requestFullscreen');
            canvas.requestFullscreen().catch(err => {
                console.log('[FULLSCREEN] Canvas fullscreen failed:', err);
            });
        } else if (canvas && canvas.webkitRequestFullscreen) {
            console.log('[FULLSCREEN] Using canvas webkit requestFullscreen');
            canvas.webkitRequestFullscreen();
        } else {
            console.log('[FULLSCREEN] API not supported on this device');
            console.log('[FULLSCREEN] User agent:', navigator.userAgent);
            // Don't alert - just log for debugging
        }
    }
}

function updateFullscreenButton() {
    // Show button if not in fullscreen
    if (!isFullscreen()) {
        gameState.fullscreen.visible = true;

        // Auto-hide after 3 seconds of no interaction
        clearTimeout(gameState.fullscreen.hideTimer);
        gameState.fullscreen.hideTimer = setTimeout(() => {
            gameState.fullscreen.visible = false;
        }, 3000);
    } else {
        gameState.fullscreen.visible = false;
    }
}

function drawFullscreenButton() {
    if (!gameState.fullscreen.visible || isFullscreen() || gameState.scene === 'LOADING') {
        return;
    }

    // Button position - bottom-center for easy mobile access
    const btnWidth = 180;  // ADJUST: Button width (wider for easier clicking)
    const btnHeight = 60;  // ADJUST: Button height
    const btnX = (canvas.width - btnWidth) / 2;  // Centered horizontally
    const btnY = canvas.height - btnHeight - 15; // ADJUST: Distance from bottom

    // Modern transparent background with subtle gradient
    // Brighter when pressed for visual feedback
    const opacity = gameState.fullscreen.pressed ? 0.15 : 0.08;
    const gradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, ${opacity * 0.4})`);

    // Rounded rectangle background
    ctx.fillStyle = gradient;
    ctx.beginPath();
    const radius = 12;  // ADJUST: Corner radius for smooth look
    ctx.moveTo(btnX + radius, btnY);
    ctx.lineTo(btnX + btnWidth - radius, btnY);
    ctx.arcTo(btnX + btnWidth, btnY, btnX + btnWidth, btnY + radius, radius);
    ctx.lineTo(btnX + btnWidth, btnY + btnHeight - radius);
    ctx.arcTo(btnX + btnWidth, btnY + btnHeight, btnX + btnWidth - radius, btnY + btnHeight, radius);
    ctx.lineTo(btnX + radius, btnY + btnHeight);
    ctx.arcTo(btnX, btnY + btnHeight, btnX, btnY + btnHeight - radius, radius);
    ctx.lineTo(btnX, btnY + radius);
    ctx.arcTo(btnX, btnY, btnX + radius, btnY, radius);
    ctx.closePath();
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';  // ADJUST: Border opacity
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw modern fullscreen icon - four expanding arrows
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';  // ADJUST: Icon color/opacity
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const centerX = btnX + btnWidth / 2 - 35;
    const centerY = btnY + btnHeight / 2;
    const iconSize = 16;  // Size of the icon
    const arrowSize = 6;

    // Top-left arrow
    ctx.beginPath();
    ctx.moveTo(centerX + iconSize, centerY - iconSize);
    ctx.lineTo(centerX, centerY - iconSize);
    ctx.lineTo(centerX, centerY - iconSize + arrowSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + iconSize - arrowSize, centerY - iconSize);
    ctx.lineTo(centerX, centerY - iconSize);
    ctx.stroke();

    // Top-right arrow
    ctx.beginPath();
    ctx.moveTo(centerX + iconSize * 2, centerY - iconSize + arrowSize);
    ctx.lineTo(centerX + iconSize * 2, centerY - iconSize);
    ctx.lineTo(centerX + iconSize * 2 - arrowSize, centerY - iconSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + iconSize * 2, centerY - iconSize);
    ctx.lineTo(centerX + iconSize * 2, centerY - iconSize + arrowSize);
    ctx.stroke();

    // Bottom-left arrow
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + iconSize - arrowSize);
    ctx.lineTo(centerX, centerY + iconSize);
    ctx.lineTo(centerX + arrowSize, centerY + iconSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + iconSize);
    ctx.lineTo(centerX + iconSize, centerY + iconSize);
    ctx.stroke();

    // Bottom-right arrow
    ctx.beginPath();
    ctx.moveTo(centerX + iconSize * 2 - arrowSize, centerY + iconSize);
    ctx.lineTo(centerX + iconSize * 2, centerY + iconSize);
    ctx.lineTo(centerX + iconSize * 2, centerY + iconSize - arrowSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + iconSize * 2, centerY + iconSize);
    ctx.lineTo(centerX + iconSize, centerY + iconSize);
    ctx.stroke();

    // Text label for clarity
    ctx.font = 'bold 14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('FULLSCREEN', btnX + btnWidth / 2 + 15, centerY + 5);

    // Store button bounds for click detection (larger hit area)
    gameState.fullscreenButton = {
        x: btnX - 10,  // Extra padding for easier clicking
        y: btnY - 10,
        w: btnWidth + 20,
        h: btnHeight + 20
    };
}

function handleFullscreenButtonClick(clickX, clickY) {
    const btn = gameState.fullscreenButton;
    if (btn && clickX >= btn.x && clickX <= btn.x + btn.w &&
        clickY >= btn.y && clickY <= btn.y + btn.h) {

        // Visual feedback - button pressed
        gameState.fullscreen.pressed = true;

        // Request fullscreen
        requestFullscreen();

        // Reset pressed state after short delay
        setTimeout(() => {
            gameState.fullscreen.pressed = false;
        }, 200);

        return true;
    }
    return false;
}

// ============================================================================
// CHALLENGE ACCEPTANCE SCREEN
// ============================================================================
function drawChallengeScreen() {
    // Background
    ctx.fillStyle = '#000';                                            // ADJUST: Base background color (if no image)
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bg = gameState.images[gameState.currentBg];
    if (bg) {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    }

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.29)';                             // ADJUST: Overlay darkness (R, G, B, opacity)
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ============================================================================
    // CHALLENGE TEXT
    // ============================================================================
    drawPixelText('YOU HAVE BEEN CHALLENGED!', canvas.width / 2, 250, 28, '#FFFFFF', 'center', true);

    if (gameState.challengeEnemy) {
        drawPixelText(`${gameState.challengeEnemy.name} wants to battle!`, canvas.width / 2, 300, 24, '#FFD700', 'center', false);
    }

    drawPixelText('DO YOU ACCEPT?', canvas.width / 2, 350, 24, '#FFFFFF', 'center', true);

    // ============================================================================
    // "BRING IT ON!" BUTTON (ACCEPT) - LEFT SIDE
    // ============================================================================
    const acceptBtnW = 310;                                            // ADJUST: Accept button width
    const acceptBtnH = 70;                                             // ADJUST: Accept button height
    const acceptBtnX = canvas.width / 2 - acceptBtnW - 20;             // ADJUST: Left button position (offset from center)
    const acceptBtnY = 520;                                            // ADJUST: Button Y position from top

    ctx.fillStyle = 'rgba(71, 255, 64, 0.8)';                         // ADJUST: Accept button fill color
    ctx.fillRect(acceptBtnX, acceptBtnY, acceptBtnW, acceptBtnH);
   ctx.strokeStyle = '#ffffffff';                                       // ADJUST: Accept button border color
   ctx.lineWidth = 3;                                                 // ADJUST: Accept button border thickness
    ctx.strokeRect(acceptBtnX, acceptBtnY, acceptBtnW, acceptBtnH);

    drawPixelText('BRING IT ON!', acceptBtnX + acceptBtnW / 2, acceptBtnY + 40, 20, '#FFFFFF', 'center', true);  // ADJUST: Button text

    gameState.acceptButtonBounds = { x: acceptBtnX, y: acceptBtnY, w: acceptBtnW, h: acceptBtnH };

    // ============================================================================
    // "NOT RIGHT NOW" BUTTON (DECLINE) - RIGHT SIDE
    // ============================================================================
    const declineBtnW = 310;                                           // ADJUST: Decline button width
    const declineBtnH = 70;                                            // ADJUST: Decline button height
    const declineBtnX = canvas.width / 2 + 20;                         // ADJUST: Right button position (offset from center)
    const declineBtnY = 520;                                           // ADJUST: Button Y position from top

    ctx.fillStyle = 'rgba(255, 107, 107, 0.6)';                        // ADJUST: Decline button fill color
    ctx.fillRect(declineBtnX, declineBtnY, declineBtnW, declineBtnH);
   ctx.strokeStyle = '#ffffffff';                                       // ADJUST: Decline button border color
   ctx.lineWidth = 3;                                                 // ADJUST: Decline button border thickness
    ctx.strokeRect(declineBtnX, declineBtnY, declineBtnW, declineBtnH);

    drawPixelText('NOT RIGHT NOW', declineBtnX + declineBtnW / 2, declineBtnY + 40, 20, '#FFFFFF', 'center', true);  // ADJUST: Button text

    gameState.declineButtonBounds = { x: declineBtnX, y: declineBtnY, w: declineBtnW, h: declineBtnH };
}

// ============================================================================
// MAIN MENU SCREEN
// ============================================================================
function drawMainMenu() {
    // Background
    ctx.fillStyle = '#aaaaaaff';                                            // ADJUST: Base background color (if no image)
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const menuImg = gameState.images[ASSETS.menu];
    if (menuImg) {
        ctx.drawImage(menuImg, 0, 0, canvas.width, canvas.height);
    }

    // ============================================================================
    // PLAY BUTTON - ANCHORED BOTTOM-RIGHT
    // ============================================================================
    const playBtn = gameState.images[ASSETS.playButton];
    if (playBtn) {
        const btnScale = 1.2;                                          // ADJUST: Play button size (1.2 = 120% of original)
        const btnW = playBtn.width * btnScale;
        const btnH = playBtn.height * btnScale;
        const btnX = canvas.width - btnW - 220;                        // ADJUST: Distance from right edge
        const btnY = canvas.height - btnH - 220;                       // ADJUST: Distance from bottom edge

        ctx.drawImage(playBtn, btnX, btnY, btnW, btnH);
        gameState.playButtonBounds = { x: btnX, y: btnY, w: btnW, h: btnH };
    }

    // ============================================================================
    // "BACK TO LANDING PAGE" BUTTON - ANCHORED TOP-LEFT
    // ============================================================================
    const backBtnX = 30;                                               // ADJUST: Distance from left edge
    const backBtnY = 30;                                               // ADJUST: Distance from top edge
    const backBtnW = 200;                                              // ADJUST: Back button width
    const backBtnH = 40;                                               // ADJUST: Back button height

    ctx.fillStyle = 'rgba(78, 205, 196, 0.8)';                         // ADJUST: Back button fill color
    ctx.fillRect(backBtnX, backBtnY, backBtnW, backBtnH);
    ctx.strokeStyle = '#4ECDC4';                                       // ADJUST: Back button border color
    ctx.lineWidth = 3;                                                 // ADJUST: Back button border thickness
    ctx.strokeRect(backBtnX, backBtnY, backBtnW, backBtnH);

    drawPixelText('< BACK', backBtnX + backBtnW / 2, backBtnY + 27, 27, '#FFFFFF', 'center', true);  // ADJUST: Back button text

    gameState.backToLandingBounds = { x: backBtnX, y: backBtnY, w: backBtnW, h: backBtnH };
}

function drawBattle() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bg = gameState.images[gameState.currentBg];
    if (bg) {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    }

    const battle = gameState.battle;
    if (!battle) {
        console.log('No battle object!');
        return;
    }

    // ============================================================================
    // DEBUG INFO (can remove or hide later)
    // ============================================================================
   // ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    //ctx.fillRect(10, canvas.height - 60, 500, 55);
   // ctx.fillStyle = '#00FF00';
   // ctx.font = '12px monospace';
   // ctx.fillText(`Scene: ${gameState.scene} | SlideComplete: ${battle.slideComplete}`, 15, canvas.height - 45);
   // ctx.fillText(`PlayerBotX: ${battle.playerBotX} | EnemyBotX: ${battle.enemyBotX}`, 15, canvas.height - 30);
   // ctx.fillText(`Target: PlayerX >= 450, EnemyX <= 850`, 15, canvas.height - 15);

    // ============================================================================
    // CHARACTER POSITIONS (ADJUST HERE)
    // ============================================================================
    // These values control where bots appear on screen
    const playerBotX = battle.slideComplete ? 450 : battle.playerBotX;  // ADJUST: Player bot X position (450 = final position)
    const enemyBotX = battle.slideComplete ? 650 : battle.enemyBotX;    // ADJUST: Enemy bot X position (850 = final position)

    // ============================================================================
    // TABIA (Player Character) - ANCHORED BOTTOM-LEFT
    // ============================================================================
    const tabiaImg = gameState.images[battle.playerSprites.tabia];
    if (tabiaImg) {
        const tabiaScale = 0.5;                                        // ADJUST: Tabia size (0.5 = 50% of original)
        const tabiaW = tabiaImg.width * tabiaScale;
        const tabiaH = tabiaImg.height * tabiaScale;
        const tabiaX = 100;                                            // ADJUST: Tabia X position from left edge
        const tabiaY = canvas.height - tabiaH - 10;                    // ADJUST: -80 = distance from bottom
        ctx.drawImage(tabiaImg, tabiaX, tabiaY, tabiaW, tabiaH);
    }

    // ============================================================================
    // PLAYER BOT (MarqueeBot) - ANCHORED BOTTOM-CENTER-LEFT
    // ============================================================================
    const botImg = gameState.images[battle.playerSprites.bot];
    if (botImg) {
        const botScale = 0.30;                                         // ADJUST: Bot size (0.35 = 35% of original)
        const botW = botImg.width * botScale;
        const botH = botImg.height * botScale;
        const botY = canvas.height - botH - 65;                        // ADJUST: -80 = distance from bottom
        ctx.drawImage(botImg, playerBotX, botY, botW, botH);
    }

    // ============================================================================
    // ENEMY BOT - ANCHORED BOTTOM-CENTER-RIGHT
    // ============================================================================
    const enemyImg = gameState.images[battle.enemySprite];
    if (enemyImg) {
        const enemyScale = 0.5;                                        // ADJUST: Enemy size (0.4 = 40% of original)
        const enemyW = enemyImg.width * enemyScale;
        const enemyH = enemyImg.height * enemyScale;
        const enemyY = canvas.height - enemyH - 250;                   // ADJUST: -200 = distance from bottom (higher than player)
        ctx.drawImage(enemyImg, enemyBotX, enemyY, enemyW, enemyH);
    }

    drawStatPanelsWithIcons();

    if (gameState.uiAnimations.hitMiss) {
        drawHitMissAnimation();
    }

    if (gameState.scene === 'TURN_SELECT') {
        drawCommandInterface();
    }

    if (gameState.scene === 'MOVE_SELECT') {
        drawMoveSelectionSidePanel();
    }
}

function drawStatPanelsWithIcons() {
    const battle = gameState.battle;
    if (!battle) return;

    // ============================================================================
    // PLAYER STAT PANEL - ANCHORED TOP-LEFT
    // ============================================================================
    const topLeftBox = gameState.images[ASSETS.uiBoxTopLeft];
    if (topLeftBox) {
        const panelX = 0;                                             // ADJUST: Distance from left edge
        const panelY = 0;                                             // ADJUST: Distance from top edge
        const panelW = 320;                                            // ADJUST: Panel width
        const panelH = 320;                                            // ADJUST: Panel height
        ctx.drawImage(topLeftBox, panelX, panelY, panelW, panelH);

        // Player icon
        const iconMarquee = gameState.images[ASSETS.iconMarquee];
        if (iconMarquee) {
            ctx.drawImage(iconMarquee, panelX + 10, panelY + 10, 32, 32);  // ADJUST: Icon position relative to panel
        }

        // Player name (title-sized, bold)
        drawPixelText(battle.player.name, panelX + 50, panelY + 35, 24, '#FFD700', 'left', true);

        // System Integrity (consistent label size, uniform rhythm)
        drawPixelText('INTEGRITY', panelX + 10, panelY + 80, 20, '#FFFFFF', 'left', false);
        drawPixelText(`${battle.player.integrity}%`, panelX + 220, panelY + 80, 20, '#00FF00', 'left', true);

        // Heat bar (consistent label size)
        drawPixelText('HEAT', panelX + 10, panelY + 120, 20, '#FFFFFF', 'left', false);
        const heatPercent = Math.min(battle.player.heat / battle.player.stats.power, 1);
        const hpBarWidth = 200;
        const hpBarHeight = 20;
        ctx.fillStyle = '#222';
        ctx.fillRect(panelX + 10, panelY + 130, hpBarWidth, hpBarHeight);
        const heatColor = heatPercent > 0.8 ? '#FF0000' : heatPercent > 0.5 ? '#FF8C00' : '#FFFF00';
        ctx.fillStyle = heatColor;
        ctx.fillRect(panelX + 10, panelY + 130, hpBarWidth * heatPercent, hpBarHeight);

        // Stat icons
       // const iconGpu = gameState.images[ASSETS.iconGpu];
       // const iconCpu = gameState.images[ASSETS.iconCpu];
       // const iconRam = gameState.images[ASSETS.iconRam];

       // if (iconGpu) ctx.drawImage(iconGpu, panelX + 10, panelY + 115, 22, 20);                    // ADJUST: GPU icon position & size
      //  drawPixelText(`${battle.player.stats.compute}`, panelX + 37, panelY + 132, 20, '#ff0000ff', 'left', false);  // ADJUST: GPU stat position & size & color

      //  if (iconCpu) ctx.drawImage(iconCpu, panelX + 90, panelY + 115, 22, 20);                    // ADJUST: CPU icon position & size
      //  drawPixelText(`${battle.player.stats.logic}`, panelX + 117, panelY + 132, 20, '#f50000ff', 'left', false);  // ADJUST: CPU stat position & size & color

     //   if (iconRam) ctx.drawImage(iconRam, panelX + 170, panelY + 115, 22, 20);                   // ADJUST: RAM icon position & size

        // Stats: Left column (GPU, CPU, I/O) and Right column (NET, MEM) with uniform spacing
        const statY = panelY + 180;  // Start after heat bar
        const statStep = 30;         // Uniform y-step between stats

        drawPixelText(`GPU:${battle.player.stats.compute}`, panelX + 10, statY, 20, '#FFFFFF', 'left', false);
        drawPixelText(`CPU:${battle.player.stats.logic}`, panelX + 10, statY + statStep, 20, '#FFFFFF', 'left', false);
        drawPixelText(`I/O:${battle.player.stats.io}`, panelX + 10, statY + statStep * 2, 20, '#FFFFFF', 'left', false);

        drawPixelText(`NET:${battle.player.stats.network}`, panelX + 150, statY, 20, '#FFFFFF', 'left', false);
        drawPixelText(`MEM:${battle.player.stats.memory}`, panelX + 150, statY + statStep, 20, '#FFFFFF', 'left', false);
       
        
    }

    // ============================================================================
    // ENEMY STAT PANEL - ANCHORED TOP-RIGHT
    // ============================================================================
    const bottomRightBox = gameState.images[ASSETS.uiBoxBottomRight];
    if (bottomRightBox) {
        const panelW = 320;                                            // ADJUST: Panel width
        const panelH = 320;                                            // ADJUST: Panel height
        const panelX = canvas.width - panelW - 0;                     // ADJUST: Distance from right edge (-10)
        const panelY = 0;                                             // ADJUST: Distance from top edge
        ctx.drawImage(bottomRightBox, panelX, panelY, panelW, panelH);

        // Enemy icon
      //  const iconEnemy = gameState.images[ASSETS.iconEnemy];
     //   if (iconEnemy) {
      //      ctx.drawImage(iconEnemy, panelX + 0, panelY + 50, 32, 32);  // ADJUST: Icon position relative to panel
     //   }

        // Enemy name (title-sized, bold - matches player)
        drawPixelText(battle.enemy.name, panelX + 0, panelY + 35, 24, '#ffffffff', 'left', true);

        // System Integrity (matches player rhythm)
        drawPixelText('INTEGRITY', panelX + 10, panelY + 80, 20, '#FFFFFF', 'left', false);
        drawPixelText(`${battle.enemy.integrity}%`, panelX + 230, panelY + 80, 20, '#00b7ffff', 'left', true);

        // Heat bar (matches player rhythm)
        drawPixelText('HEAT', panelX + 10, panelY + 120, 20, '#FFFFFF', 'left', false);
        const heatPercent = Math.min(battle.enemy.heat / battle.enemy.stats.power, 1);
        const hpBarWidth = 200;
        const hpBarHeight = 20;
        ctx.fillStyle = '#222';
        ctx.fillRect(panelX + 10, panelY + 130, hpBarWidth, hpBarHeight);
        const heatColor = heatPercent > 0.8 ? '#FF0000' : heatPercent > 0.5 ? '#FF8C00' : '#FFFF00';
        ctx.fillStyle = heatColor;
        ctx.fillRect(panelX + 10, panelY + 130, hpBarWidth * heatPercent, hpBarHeight);

        // Stats: Left column (GPU, CPU, I/O) and Right column (NET, MEM) - matches player
        const statY = panelY + 180;  // Start after heat bar
        const statStep = 30;         // Uniform y-step between stats

        drawPixelText(`GPU:${battle.enemy.stats.compute}`, panelX + 10, statY, 20, '#FFFFFF', 'left', false);
        drawPixelText(`CPU:${battle.enemy.stats.logic}`, panelX + 10, statY + statStep, 20, '#FFFFFF', 'left', false);
        drawPixelText(`I/O:${battle.enemy.stats.io}`, panelX + 10, statY + statStep * 2, 20, '#FFFFFF', 'left', false);

        drawPixelText(`NET:${battle.enemy.stats.network}`, panelX + 150, statY, 20, '#FFFFFF', 'left', false);
        drawPixelText(`MEM:${battle.enemy.stats.memory}`, panelX + 150, statY + statStep, 20, '#FFFFFF', 'left', false);
    }
}

// ============================================================================
// HIT/MISS/CRITICAL HIT ANIMATION SYSTEM
// ============================================================================
function drawHitMissAnimation() {
    const anim = gameState.uiAnimations.hitMiss;
    if (!anim) return;

    const sprite = gameState.images[anim.sprite];
    if (sprite) {
        const scale = 1;                                             // ADJUST: Animation sprite size (1.5 = 150% of original)
        const w = sprite.width * scale;
        const h = sprite.height * scale;
        const x = (canvas.width - w) / 2;                              // ADJUST: Centered horizontally (change to move left/right)
        const y = 200;                                                 // ADJUST: Y position from top of screen

        const progress = anim.frame / anim.duration;
        ctx.globalAlpha = 1 - progress;                                // Fade out effect
        ctx.drawImage(sprite, x, y, w, h);
        ctx.globalAlpha = 1;
    }

    anim.frame++;
    if (anim.frame >= anim.duration) {
        gameState.uiAnimations.hitMiss = null;
    }
}

function showHitMissSprite(spriteKey) {
    gameState.uiAnimations.hitMiss = {
        sprite: spriteKey,
        frame: 0,
        duration: 60                                                   // ADJUST: Animation duration in frames (60 = 1 second at 60fps)
    };
}

function drawCommandInterface() {
    console.log('Drawing command interface');

    // ============================================================================
    // COMMAND INTERFACE PANEL - ANCHORED BOTTOM-RIGHT CORNER
    // ============================================================================
    const panelWidth = 280;                                            // ADJUST: Panel width
    const panelHeight = 300;                                           // ADJUST: Panel height (tall enough for vertical list)
    const panelX = canvas.width - panelWidth - 10;                     // ADJUST: 10px from right edge
    const panelY = canvas.height - panelHeight - 10;                   // ADJUST: 10px from bottom edge

    // Background panel - Use light UI textbox sprite
    const commandPanelBox = gameState.images[ASSETS.blacTextbox];
    if (commandPanelBox) {
        // Draw the textbox sprite as background (light background)
        ctx.drawImage(commandPanelBox, panelX, panelY, panelWidth, panelHeight);
    } else {
        // Fallback to light color if sprite not loaded
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';                  // ADJUST: Light panel background color
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    }

    // Border
    ctx.strokeStyle = '#00ff2aff';                                       // ADJUST: Panel border color
    ctx.lineWidth = 3;                                                 // ADJUST: Border thickness
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Title text - centered in panel
    drawPixelText('COMMANDS', panelX + panelWidth / 2, panelY + 30, 10, '#2bff00ff', 'center', true);

    // ============================================================================
    // COMMAND BUTTONS LAYOUT - VERTICAL LIST (TOP TO BOTTOM)
    // ============================================================================
    const btnWidth = 240;                                              // ADJUST: Button width
    const btnHeight = 40;                                              // ADJUST: Button height
    const btnSpacing = 10;                                             // ADJUST: Vertical space between buttons
    const btnX = panelX + (panelWidth - btnWidth) / 2;                 // Center buttons in panel
    const startY = panelY + 90;                                        // ADJUST: Start below title

    const commands = [
        { text: 'EXECUTE', enabled: true, key: 'execute' },
        { text: 'TOOL', enabled: false, key: 'tool' },
        { text: 'SWAP', enabled: false, key: 'swap' },
        { text: 'CONCEDE', enabled: true, key: 'concede' }
    ];

    gameState.commandButtons = [];

    commands.forEach((cmd, i) => {
        const btnY = startY + (btnHeight + btnSpacing) * i;            // Stack vertically

        // Button background
        ctx.fillStyle = cmd.enabled ? 'rgba(0, 0, 0, 1)' : 'rgba(200, 200, 200, 0.5)';
        ctx.fillRect(btnX, btnY, btnWidth, btnHeight);

        // Button border
        ctx.strokeStyle = cmd.enabled ? '#15ff00ff' : '#999';
        ctx.lineWidth = 3;
        ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

        // Button text - centered and vertically balanced
        drawPixelText(cmd.text, btnX + btnWidth / 2, btnY + btnHeight / 2 + 5, 10, cmd.enabled ? '#00ff15ff' : '#999', 'center', true);

        if (cmd.enabled) {
            gameState.commandButtons.push({ key: cmd.key, x: btnX, y: btnY, w: btnWidth, h: btnHeight });
        }
    });
}

// ============================================================================
// MOVE SELECTION SIDE PANEL - ANCHORED RIGHT (OVERLAYS BATTLE SCREEN)
// ============================================================================
function drawMoveSelectionSidePanel() {
    const battle = gameState.battle;
    if (!battle) return;

    // ============================================================================
    // PANEL BACKGROUND
    // ============================================================================
    const panelWidth = 500;                                            // ADJUST: Panel width
    const panelX = canvas.width - panelWidth;                          // Anchored to right edge

    // Use light UI textbox sprite for background
    const movePanelBox = gameState.images[ASSETS.uiBoxBottomRight];
    if (movePanelBox) {
        // Draw the textbox sprite as background (light background)
        ctx.drawImage(movePanelBox, panelX, 0, panelWidth, canvas.height);
    } else {
        // Fallback to light color if sprite not loaded
        ctx.fillStyle = 'rgba(240, 240, 240, 0.95)';                   // ADJUST: Light panel background color
        ctx.fillRect(panelX, 0, panelWidth, canvas.height);
    }

   // ctx.strokeStyle = '#ffffffff';                                       // ADJUST: Panel border color
 //   ctx.lineWidth = -1;                                                 // ADJUST: Panel border thickness
    ctx.strokeRect(panelX, 0, panelWidth, canvas.height);

    // Panel title - Dark text on light background
    drawPixelText('SELECT FUNCTION', panelX + panelWidth / 2, 80, 24, '#ffffffff', 'center', true);  // ADJUST: Title position & size & color (dark text)

    // ============================================================================
    // MOVE BUTTONS LAYOUT
    // ============================================================================
    const moves = battle.player.moves;
    const btnWidth = 460;                                              // ADJUST: Move button width
    const btnHeight = 120;                                              // ADJUST: Move button height
    const startY = 100;                                                 // ADJUST: First button Y position from top
    const spacing = 20;                                                // ADJUST: Vertical space between move buttons

    gameState.moveButtons = [];

    moves.forEach((move, i) => {
        const btnX = panelX + 20;                                      // ADJUST: Button X offset from panel edge
        const btnY = startY + (btnHeight + spacing) * i;

        // Button background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';                    // ADJUST: Move button fill color
        ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
        ctx.strokeStyle = '#ffffffff';                                   // ADJUST: Move button border color
        ctx.lineWidth = 3;                                             // ADJUST: Move button border thickness
        ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

        // Move text (left side) - consistent margins and spacing
        drawPixelText(move.name, btnX + 15, btnY + 30, 20, '#FFFFFF', 'left', true);
        drawPixelText(`[${move.slot}]`, btnX + 15, btnY + 60, 10, '#CCCCCC', 'left', false);
        drawPixelText(move.description, btnX + 15, btnY + 85, 10, '#999999', 'left', false);

        // Move stats (right side) - single consistent right x-column
        const rightStatX = btnX + btnWidth - 15;
        drawPixelText(`DMG:${move.compute}`, rightStatX, btnY + 30, 15, '#CC0000', 'right', false);
        drawPixelText(`HEAT:${move.heat > 0 ? '+' : ''}${move.heat}`, rightStatX, btnY + 60, 15, '#CC6600', 'right', false);
        drawPixelText(`ACC:${move.accuracy}%`, rightStatX, btnY + 90, 15, '#008B8B', 'right', false);

        gameState.moveButtons.push({ move: move, x: btnX, y: btnY, w: btnWidth, h: btnHeight });
    });

    // ============================================================================
    // BACK BUTTON - ANCHORED BOTTOM OF PANEL
    // ============================================================================
    const backBtnW = 460;                                              // ADJUST: Back button width
    const backBtnH = 45;                                               // ADJUST: Back button height
    const backBtnX = panelX + 20;                                      // ADJUST: Back button X offset from panel edge
    const backBtnY = canvas.height - 70;                               // ADJUST: Distance from bottom of screen

    ctx.fillStyle = 'rgba(255, 107, 107, 0.4)';                        // ADJUST: Back button fill color
    ctx.fillRect(backBtnX, backBtnY, backBtnW, backBtnH);
    ctx.strokeStyle = '#FF6B6B';                                       // ADJUST: Back button border color
    ctx.lineWidth = 3;                                                 // ADJUST: Back button border thickness
    ctx.strokeRect(backBtnX, backBtnY, backBtnW, backBtnH);

    drawPixelText('BACK', backBtnX + backBtnW / 2, backBtnY + 30, 28, '#818181ff', 'center', true);  // ADJUST: Back text position & size & color (dark text)

    gameState.backButton = { x: backBtnX, y: backBtnY, w: backBtnW, h: backBtnH };
}

// ============================================================================
// POST-BATTLE WITH VICTORY/DEFEAT ANIMATIONS
// ============================================================================
function drawPostBattleWithAnimations() {
    const battle = gameState.battle;
    if (!battle) return;

    // Draw background
    ctx.fillStyle = '#00000042';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bg = gameState.images[gameState.currentBg];
    if (bg) {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    }

    // Determine winner and set appropriate sprites
    let winner;
    if (battle.enemy.integrity <= 0) {
        winner = 'player';
    } else if (battle.player.integrity <= 0) {
        winner = 'enemy';
    } else {
        winner = 'concede';
    }

    // Draw victory/defeat character animations
    if (winner === 'player') {
        // Player wins - show victory animations
        // Tabia win pose (left side)
        const tabiaWin = gameState.images[ASSETS.tabia.win];
        if (tabiaWin) {
            const scale = 0.6;
            const w = tabiaWin.width * scale;
            const h = tabiaWin.height * scale;
            const x = 150;
            const y = canvas.height - h - 50;
            ctx.drawImage(tabiaWin, x, y, w, h);
        }

        // Bot victory pose (center-left)
        const botVictory = gameState.images[ASSETS.bot.victory];
        if (botVictory) {
            const scale = 0.45;
            const w = botVictory.width * scale;
            const h = botVictory.height * scale;
            const x = 400;
            const y = canvas.height - h - 50;
            ctx.drawImage(botVictory, x, y, w, h);
        }
    } else if (winner === 'enemy') {
        // Enemy wins - show defeat animations
        // Tabia loss pose (left side)
        const tabiaLoss = gameState.images[ASSETS.tabia.loss];
        if (tabiaLoss) {
            const scale = 0.6;
            const w = tabiaLoss.width * scale;
            const h = tabiaLoss.height * scale;
            const x = 150;
            const y = canvas.height - h - 50;
            ctx.drawImage(tabiaLoss, x, y, w, h);
        }

        // Enemy victory pose (right side)
        const enemySprite = gameState.images[battle.enemySprite];
        if (enemySprite) {
            const scale = 0.5;
            const w = enemySprite.width * scale;
            const h = enemySprite.height * scale;
            const x = canvas.width - w - 150;
            const y = canvas.height - h - 50;
            ctx.drawImage(enemySprite, x, y, w, h);
        }
    }

    // Draw result screen on top
    drawPostBattle(winner);
}

// ============================================================================
// POST-BATTLE RESULT SCREEN
// ============================================================================
function drawPostBattle(winner) {
    // Background overlay - semi-transparent so victory animations show through
    ctx.fillStyle = 'rgba(0, 0, 0, 0.17)';                              // ADJUST: Background overlay color - lighter to show animations
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const battle = gameState.battle;

    // ============================================================================
    // RESULT SPRITE (YOU WIN / YOU LOSE / GIVE UP)
    // ============================================================================
    let resultSprite;
    if (winner === 'concede') {
        resultSprite = gameState.images[ASSETS.giveUp];
    } else if (winner === 'player') {
        resultSprite = gameState.images[ASSETS.youWin];
    } else {
        resultSprite = gameState.images[ASSETS.youLose];
    }

    if (resultSprite) {
        const scale = 1.5;                                             // ADJUST: Result sprite size (1.5 = 150% of original)
        const w = resultSprite.width * scale;
        const h = resultSprite.height * scale;
        const x = (canvas.width - w) / 2;                              // Centered horizontally
        const y = 80;                                                  // ADJUST: Y position from top
        ctx.drawImage(resultSprite, x, y, w, h);
    }

    // ============================================================================
    // BATTLE SUMMARY SECTION
    // ============================================================================
    drawPixelText('BATTLE SUMMARY', canvas.width / 2, 375, 28, '#FFD700', 'center', true);

    const summaryX = canvas.width / 2 - 300;
    let summaryY = 420;

    // Rewards list - consistent size and spacing
    drawPixelText(`Data Packets: ${battle.rewards.dataPackets}`, summaryX, summaryY, 20, '#FFFFFF', 'left', false);
    summaryY += 30;
    drawPixelText(`XP Gained: ${battle.rewards.xp}`, summaryX, summaryY, 20, '#FFFFFF', 'left', false);
    summaryY += 30;
    drawPixelText(`PMP: +${battle.rewards.pmp}`, summaryX, summaryY, 20, '#FFFFFF', 'left', false);
    summaryY += 30;
    drawPixelText(`Parts: ${battle.rewards.partsGained.length > 0 ? battle.rewards.partsGained.join(', ') : 'None'}`, summaryX, summaryY, 20, '#FFFFFF', 'left', false);
    summaryY += 40;

    // Integrity status
    drawPixelText(`Player: ${battle.player.integrity}%  Enemy: ${battle.enemy.integrity}%`, summaryX, summaryY, 20, '#CCCCCC', 'left', false);

    // Return prompt - ANCHORED BOTTOM
    drawPixelText('Click to return to menu', canvas.width / 2, canvas.height - 60, 24, '#4ECDC4', 'center', true);
}

// ============================================================================
// GAME LOGIC
// ============================================================================

function startBattle() {
    console.log('Showing challenge screen...');
    gameState.currentBg = ASSETS.backgrounds[Math.floor(Math.random() * ASSETS.backgrounds.length)];
    gameState.challengeEnemy = ENEMY_ROBOTS[Math.floor(Math.random() * ENEMY_ROBOTS.length)];
    gameState.scene = 'CHALLENGE';
}

function acceptChallenge() {
    console.log('Challenge accepted! Starting battle...');
    gameState.currentEnemy = gameState.challengeEnemy;

    // Create battle with bots already in position (no slide animation)
    gameState.battle = new Battle(gameState.currentEnemy);
    gameState.battle.playerBotX = 450;  // Already in position
    gameState.battle.enemyBotX = 850;   // Already in position
    gameState.battle.slideComplete = true;  // Skip animation

    console.log('Battle created:', gameState.battle);

    gameState.battle.addLog('=== BATTLE START ===');
    gameState.battle.addLog(`${gameState.battle.player.name} vs ${gameState.battle.enemy.name}`);

    playBGM();

    // Go straight to TURN_SELECT (no delay needed)
    gameState.scene = 'TURN_SELECT';
    console.log('Scene now TURN_SELECT');
}

function declineChallenge() {
    console.log('Challenge declined');
    gameState.scene = 'MENU';
    gameState.challengeEnemy = null;
}

function animateSlideIn() {
    const battle = gameState.battle;
    console.log('Starting slide animation...', 'playerBotX:', battle.playerBotX, 'enemyBotX:', battle.enemyBotX);
    // Animation will be handled by game loop
}

function selectMove(move) {
    gameState.selectedMove = move;
    gameState.scene = 'TURN_EXECUTE';
    executeTurn(move);
}

function endTurn() {
    const battle = gameState.battle;

    // Clear temporary UI state
    gameState.selectedMove = null;
    gameState.uiAnimations.hitMiss = null;

    // Reset temporary buffs
    if (battle.player.dodgeBoost) {
        battle.player.dodgeBoost = 0;
    }
    if (battle.enemy.dodgeBoost) {
        battle.enemy.dodgeBoost = 0;
    }

    // Transition to next turn
    gameState.scene = 'TURN_SELECT';
    drawBattle();
}

function executeTurn(playerMove) {
    const battle = gameState.battle;
    battle.turnCount++;

    const enemyMove = battle.enemy.moves[Math.floor(Math.random() * battle.enemy.moves.length)];
    battle.addLog(`\n--- TURN ${battle.turnCount} ---`);

    const firstAttacker = battle.determineTurnOrder(playerMove, enemyMove);

    if (firstAttacker === 'player') {
        executePlayerAttack(playerMove, () => {
            if (battle.enemy.integrity <= 0) {
                endBattle('player');
            } else {
                setTimeout(() => {
                    executeEnemyAttack(enemyMove, () => {
                        if (battle.player.integrity <= 0) {
                            endBattle('enemy');
                        } else {
                            setTimeout(() => {
                                endTurn();
                            }, 1000);
                        }
                    });
                }, 1000);
            }
        });
    } else {
        executeEnemyAttack(enemyMove, () => {
            if (battle.player.integrity <= 0) {
                endBattle('enemy');
            } else {
                setTimeout(() => {
                    executePlayerAttack(playerMove, () => {
                        if (battle.enemy.integrity <= 0) {
                            endBattle('player');
                        } else {
                            setTimeout(() => {
                                endTurn();
                            }, 1000);
                        }
                    });
                }, 1000);
            }
        });
    }
}

function executePlayerAttack(move, callback) {
    const battle = gameState.battle;

    battle.addLog(`${battle.player.name} executed ${move.name}!`);

    battle.playerSprites.tabia = ASSETS.tabia.thinking;
    battle.playerSprites.bot = ASSETS.bot.attack;
    drawBattle();
    playSound('attack');

    setTimeout(() => {
        const result = battle.calculateDamage(battle.player, battle.enemy, move);

        // [HITCHECK] Log attack result for debugging
        console.log("[HITCHECK] attacker=PLAYER hit=%s dmg=%d crit=%s", result.hit, result.damage, !!result.critical);

        // Handle special effects
        if (result.effect === 'OVERCLOCK') {
            battle.addLog(`${battle.player.name} OVERCLOCKED! +30% dodge next turn!`);
            playSound('hit');
            battle.playerSprites.tabia = ASSETS.tabia.jumpPoint;
        } else if (result.effect === 'REBOOT') {
            battle.addLog(`${battle.player.name} REBOOTED! +30 HP restored!`);
            playSound('hit');
            battle.playerSprites.tabia = ASSETS.tabia.win;
        } else if (result.effect === 'FLASH_BIOS_MISS') {
            battle.addLog('FLASH BIOS FAILED! -1 HIT PENALTY!');
            playSound('miss');
            battle.playerSprites.tabia = ASSETS.tabia.loss;
            showHitMissSprite(ASSETS.miss);
        } else if (!result.hit) {
            battle.addLog('Miss!');
            playSound('miss');
            battle.playerSprites.tabia = ASSETS.tabia.surprised;
            showHitMissSprite(ASSETS.miss);
        } else {
            // Regular hit - apply damage to ENEMY and increment PLAYER's score
            battle.player.hits++;           // Player's score increases (successful hit)
            battle.enemy.integrity -= result.damage;  // Enemy takes damage

            // [APPLY] Log hit application for debugging
            console.log("[APPLY] to=ENEMY enemy.integrity=%d player.hits=%d", battle.enemy.integrity, battle.player.hits);

            if (result.critical) {
                battle.addLog(`CRITICAL DATA HIT! ${result.damage} damage! Enemy integrity: ${battle.enemy.integrity}%`);
                showHitMissSprite(ASSETS.directHitLanded);
            } else {
                battle.addLog(`Hit! ${result.damage} damage dealt. Enemy integrity: ${battle.enemy.integrity}%`);
            }
            playSound('hit');
            battle.playerSprites.tabia = ASSETS.tabia.jumpPoint;
            battle.enemySprite = ASSETS.enemy.hit;

            if (battle.enemy.integrity <= 0) {
                battle.addLog(`${battle.enemy.name} SYSTEM INTEGRITY COMPROMISED!`);
            }
        }

        setTimeout(() => {
            battle.playerSprites.bot = ASSETS.bot.idle;
            battle.playerSprites.tabia = ASSETS.tabia.idle;
            battle.enemySprite = ASSETS.enemy.idle;
            drawBattle();
            callback();
        }, 600);
    }, 500);
}

function executeEnemyAttack(move, callback) {
    const battle = gameState.battle;

    battle.addLog(`${battle.enemy.name} executed ${move.name}!`);

    battle.enemySprite = ASSETS.enemy.attack;
    drawBattle();
    playSound('attack');

    setTimeout(() => {
        const result = battle.calculateDamage(battle.enemy, battle.player, move);

        // [HITCHECK] Log attack result for debugging
        console.log("[HITCHECK] attacker=ENEMY hit=%s dmg=%d crit=%s", result.hit, result.damage, !!result.critical);

        if (!result.hit) {
            battle.addLog('Enemy missed!');
            playSound('miss');
            battle.playerSprites.tabia = ASSETS.tabia.surprised;
            showHitMissSprite(ASSETS.miss);
        } else {
            // Enemy hit - increment ENEMY's score and apply damage to PLAYER
            battle.enemy.hits++;              // Enemy's score increases (successful hit)
            battle.player.integrity -= result.damage;  // Player takes damage

            // [APPLY] Log hit application for debugging
            console.log("[APPLY] to=PLAYER player.integrity=%d enemy.hits=%d", battle.player.integrity, battle.enemy.hits);

            if (result.critical) {
                battle.addLog(`ENEMY CRITICAL HIT! ${result.damage} damage! Player integrity: ${battle.player.integrity}%`);
                showHitMissSprite(ASSETS.directHitReceived);
            } else {
                battle.addLog(`Enemy hit! ${result.damage} damage received. Player integrity: ${battle.player.integrity}%`);
            }
            playSound('hit');
            battle.playerSprites.tabia = ASSETS.tabia.surprised;

            if (battle.player.integrity <= 0) {
                battle.addLog(`${battle.player.name} SYSTEM INTEGRITY COMPROMISED!`);
            }
        }

        setTimeout(() => {
            battle.enemySprite = ASSETS.enemy.idle;
            battle.playerSprites.tabia = ASSETS.tabia.idle;
            drawBattle();
            callback();
        }, 600);
    }, 500);
}

function endBattle(winner) {
    const battle = gameState.battle;
    battle.running = false;

    stopBGM();

    if (winner === 'player') {
        battle.addLog('=== VICTORY ===');
        battle.playerSprites.bot = ASSETS.bot.victory;
        battle.playerSprites.tabia = ASSETS.tabia.win;
        battle.enemySprite = ASSETS.enemy.defeated;
        playSound('victory');

        battle.rewards.dataPackets = 50 + Math.floor(Math.random() * 50);
        battle.rewards.xp = 100 + Math.floor(Math.random() * 100);
        battle.rewards.pmp = 10 + Math.floor(Math.random() * 10);
        battle.rewards.partsGained = ['Thermal Core', 'GPU Chip'];
    } else {
        battle.addLog('=== DEFEAT ===');
        battle.playerSprites.bot = ASSETS.bot.idle;
        battle.playerSprites.tabia = ASSETS.tabia.loss;
        battle.enemySprite = ASSETS.enemy.victory;
        playSound('defeat');

        battle.rewards.pmp = 5;
        battle.rewards.xp = 25;
    }

    gameState.scene = 'POST_BATTLE';

    setTimeout(() => {
        drawPostBattle(winner);
    }, 1500);
}

function handleConcede() {
    const battle = gameState.battle;
    battle.running = false;
    battle.addLog('Player chose to concede.');
    battle.addLog('Parts protected. Persistent Memory Points awarded.');

    stopBGM();

    // Show Give-up animation sprite
    battle.playerSprites.tabia = ASSETS.tabia.loss;
    showHitMissSprite(ASSETS.giveUp);

    battle.rewards.pmp = 15;
    battle.rewards.xp = 10;

    gameState.scene = 'POST_BATTLE';

    setTimeout(() => {
        drawPostBattle('concede');
    }, 1000);
}

// ============================================================================
// INPUT HANDLING
// ============================================================================

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Handle user interaction for fullscreen button visibility
    updateFullscreenButton();

    // Check if fullscreen button was clicked (works on all screens)
    if (handleFullscreenButtonClick(clickX, clickY)) {
        return;
    }

    // Play drop sound on first interaction
    playDropSoundOnce();

    if (gameState.scene === 'MENU') {
        const backBtn = gameState.backToLandingBounds;
        if (backBtn && clickX >= backBtn.x && clickX <= backBtn.x + backBtn.w &&
            clickY >= backBtn.y && clickY <= backBtn.y + backBtn.h) {
            window.location.href = '../../index.html';
            return;
        }

        const btn = gameState.playButtonBounds;
        if (btn && clickX >= btn.x && clickX <= btn.x + btn.w &&
            clickY >= btn.y && clickY <= btn.y + btn.h) {
            startBattle();
        }
    } else if (gameState.scene === 'CHALLENGE') {
        // Check accept button
        const acceptBtn = gameState.acceptButtonBounds;
        if (acceptBtn && clickX >= acceptBtn.x && clickX <= acceptBtn.x + acceptBtn.w &&
            clickY >= acceptBtn.y && clickY <= acceptBtn.y + acceptBtn.h) {
            acceptChallenge();
            return;
        }

        // Check decline button
        const declineBtn = gameState.declineButtonBounds;
        if (declineBtn && clickX >= declineBtn.x && clickX <= declineBtn.x + declineBtn.w &&
            clickY >= declineBtn.y && clickY <= declineBtn.y + declineBtn.h) {
            declineChallenge();
            return;
        }
    } else if (gameState.scene === 'TURN_SELECT') {
        if (gameState.commandButtons) {
            for (const btn of gameState.commandButtons) {
                if (clickX >= btn.x && clickX <= btn.x + btn.w &&
                    clickY >= btn.y && clickY <= btn.y + btn.h) {
                    if (btn.key === 'execute') {
                        gameState.scene = 'MOVE_SELECT';
                        drawBattle();
                    } else if (btn.key === 'concede') {
                        handleConcede();
                    }
                    return;
                }
            }
        }
    } else if (gameState.scene === 'MOVE_SELECT') {
        if (gameState.moveButtons) {
            for (const btn of gameState.moveButtons) {
                if (clickX >= btn.x && clickX <= btn.x + btn.w &&
                    clickY >= btn.y && clickY <= btn.y + btn.h) {
                    selectMove(btn.move);
                    return;
                }
            }
        }

        const backBtn = gameState.backButton;
        if (backBtn && clickX >= backBtn.x && clickX <= backBtn.x + backBtn.w &&
            clickY >= backBtn.y && clickY <= backBtn.y + backBtn.h) {
            gameState.scene = 'TURN_SELECT';
            drawBattle();
        }
    } else if (gameState.scene === 'POST_BATTLE') {
        gameState.scene = 'MENU';
        gameState.battle = null;
        drawMainMenu();
    }
});

// ============================================================================
// GAME LOOP
// ============================================================================

function gameLoop() {
    // Continuous rendering based on current scene
    if (gameState.scene === 'LOADING') {
        drawLoadingScreen();
    } else if (gameState.scene === 'MENU') {
        drawMainMenu();
    } else if (gameState.scene === 'CHALLENGE') {
        drawChallengeScreen();
    } else if (gameState.scene === 'BATTLE_START' || gameState.scene === 'TURN_SELECT' || gameState.scene === 'MOVE_SELECT' || gameState.scene === 'TURN_EXECUTE') {
        drawBattle();
    } else if (gameState.scene === 'POST_BATTLE') {
        // Draw post battle screen with victory animations
        drawPostBattleWithAnimations();
    }

    // Draw fullscreen button overlay on all screens (except loading)
    drawFullscreenButton();

    requestAnimationFrame(gameLoop);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

window.addEventListener('load', () => {
    console.log('[AI TRAINER - WARM-UP BATTLE v3.1]');
    console.log('Fixed: Continuous render loop');
    console.log('Fixed: Removed duplicate logo');
    console.log('Full UI sprite integration');
    console.log('Pixel font with stroke outline for readability');
    console.log('Hit/Miss/Direct Hit/Give-up animations');
    console.log('Back to landing page button');
    console.log('Added: Loading screen, fullscreen button, drop sound control');
    loadAllAssets();
    gameLoop(); // Start continuous render loop
});

// Listen for fullscreen changes to update button visibility
document.addEventListener('fullscreenchange', () => updateFullscreenButton());
document.addEventListener('webkitfullscreenchange', () => updateFullscreenButton());
document.addEventListener('mozfullscreenchange', () => updateFullscreenButton());
document.addEventListener('msfullscreenchange', () => updateFullscreenButton());

// Show fullscreen button on any user interaction
canvas.addEventListener('touchstart', () => updateFullscreenButton());
canvas.addEventListener('mousedown', () => updateFullscreenButton());
canvas.addEventListener('mousemove', () => updateFullscreenButton());
