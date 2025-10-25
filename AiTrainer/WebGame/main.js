// ============================================================================
// AI TRAINER - WARM-UP BATTLE v3.0 (Full UI Integration)
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
    }
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
        let hitRoll = Math.random() * 100;
        let accuracy = move.accuracy * (attacker.stats.io / 100);

        // Apply dodge boost if defender has it
        if (defender.dodgeBoost > 0) {
            accuracy -= defender.dodgeBoost;
            defender.dodgeBoost = 0; // Consume dodge boost
        }

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

        const critical = Math.random() < 0.1;
        if (critical) {
            damage *= 1.5;
        }

        attacker.heat += move.heat;

        if (attacker.heat > attacker.stats.power) {
            damage *= 0.7;
            this.addLog(`${attacker.name} is OVERHEATING! Efficiency -30%`);
        }

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

        // Play drop sound ONCE on menu load
        playSound('drop');

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
    ctx.lineWidth = Math.max(3, size / 4);
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(text, x, y);

    // Fill with color
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';                             // ADJUST: Overlay darkness (R, G, B, opacity)
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ============================================================================
    // CHALLENGE TEXT
    // ============================================================================
    drawPixelText('YOU HAVE BEEN CHALLENGED!', canvas.width / 2, 200, 24, '#FF6B6B', 'center', true);  // ADJUST: Main title position & size & color

    if (gameState.challengeEnemy) {
        drawPixelText(`${gameState.challengeEnemy.name} wants to battle!`, canvas.width / 2, 280, 18, '#FFD700', 'center', false);  // ADJUST: Enemy name position & size & color
    }

    drawPixelText('DO YOU ACCEPT?', canvas.width / 2, 350, 20, '#FFFFFF', 'center', true);  // ADJUST: Prompt position & size & color

    // ============================================================================
    // "BRING IT ON!" BUTTON (ACCEPT) - LEFT SIDE
    // ============================================================================
    const acceptBtnW = 300;                                            // ADJUST: Accept button width
    const acceptBtnH = 60;                                             // ADJUST: Accept button height
    const acceptBtnX = canvas.width / 2 - acceptBtnW - 20;             // ADJUST: Left button position (offset from center)
    const acceptBtnY = 420;                                            // ADJUST: Button Y position from top

    ctx.fillStyle = 'rgba(78, 205, 196, 0.8)';                         // ADJUST: Accept button fill color
    ctx.fillRect(acceptBtnX, acceptBtnY, acceptBtnW, acceptBtnH);
    ctx.strokeStyle = '#4ECDC4';                                       // ADJUST: Accept button border color
    ctx.lineWidth = 4;                                                 // ADJUST: Accept button border thickness
    ctx.strokeRect(acceptBtnX, acceptBtnY, acceptBtnW, acceptBtnH);

    drawPixelText('BRING IT ON!', acceptBtnX + acceptBtnW / 2, acceptBtnY + 40, 16, '#FFFFFF', 'center', true);  // ADJUST: Button text

    gameState.acceptButtonBounds = { x: acceptBtnX, y: acceptBtnY, w: acceptBtnW, h: acceptBtnH };

    // ============================================================================
    // "NOT RIGHT NOW" BUTTON (DECLINE) - RIGHT SIDE
    // ============================================================================
    const declineBtnW = 300;                                           // ADJUST: Decline button width
    const declineBtnH = 60;                                            // ADJUST: Decline button height
    const declineBtnX = canvas.width / 2 + 20;                         // ADJUST: Right button position (offset from center)
    const declineBtnY = 420;                                           // ADJUST: Button Y position from top

    ctx.fillStyle = 'rgba(255, 107, 107, 0.6)';                        // ADJUST: Decline button fill color
    ctx.fillRect(declineBtnX, declineBtnY, declineBtnW, declineBtnH);
    ctx.strokeStyle = '#FF6B6B';                                       // ADJUST: Decline button border color
    ctx.lineWidth = 4;                                                 // ADJUST: Decline button border thickness
    ctx.strokeRect(declineBtnX, declineBtnY, declineBtnW, declineBtnH);

    drawPixelText('NOT RIGHT NOW', declineBtnX + declineBtnW / 2, declineBtnY + 40, 16, '#FFFFFF', 'center', true);  // ADJUST: Button text

    gameState.declineButtonBounds = { x: declineBtnX, y: declineBtnY, w: declineBtnW, h: declineBtnH };
}

// ============================================================================
// MAIN MENU SCREEN
// ============================================================================
function drawMainMenu() {
    // Background
    ctx.fillStyle = '#000';                                            // ADJUST: Base background color (if no image)
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
        const btnX = canvas.width - btnW - 120;                        // ADJUST: Distance from right edge
        const btnY = canvas.height - btnH - 120;                       // ADJUST: Distance from bottom edge

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

    drawPixelText('< BACK', backBtnX + backBtnW / 2, backBtnY + 27, 12, '#FFFFFF', 'center', true);  // ADJUST: Back button text

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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, canvas.height - 60, 500, 55);
    ctx.fillStyle = '#00FF00';
    ctx.font = '12px monospace';
    ctx.fillText(`Scene: ${gameState.scene} | SlideComplete: ${battle.slideComplete}`, 15, canvas.height - 45);
    ctx.fillText(`PlayerBotX: ${battle.playerBotX} | EnemyBotX: ${battle.enemyBotX}`, 15, canvas.height - 30);
    ctx.fillText(`Target: PlayerX >= 450, EnemyX <= 850`, 15, canvas.height - 15);

    // ============================================================================
    // CHARACTER POSITIONS (ADJUST HERE)
    // ============================================================================
    // These values control where bots appear on screen
    const playerBotX = battle.slideComplete ? 450 : battle.playerBotX;  // ADJUST: Player bot X position (450 = final position)
    const enemyBotX = battle.slideComplete ? 850 : battle.enemyBotX;    // ADJUST: Enemy bot X position (850 = final position)

    // ============================================================================
    // TABIA (Player Character) - ANCHORED BOTTOM-LEFT
    // ============================================================================
    const tabiaImg = gameState.images[battle.playerSprites.tabia];
    if (tabiaImg) {
        const tabiaScale = 0.5;                                        // ADJUST: Tabia size (0.5 = 50% of original)
        const tabiaW = tabiaImg.width * tabiaScale;
        const tabiaH = tabiaImg.height * tabiaScale;
        const tabiaX = 200;                                            // ADJUST: Tabia X position from left edge
        const tabiaY = canvas.height - tabiaH - 80;                    // ADJUST: -80 = distance from bottom
        ctx.drawImage(tabiaImg, tabiaX, tabiaY, tabiaW, tabiaH);
    }

    // ============================================================================
    // PLAYER BOT (MarqueeBot) - ANCHORED BOTTOM-CENTER-LEFT
    // ============================================================================
    const botImg = gameState.images[battle.playerSprites.bot];
    if (botImg) {
        const botScale = 0.35;                                         // ADJUST: Bot size (0.35 = 35% of original)
        const botW = botImg.width * botScale;
        const botH = botImg.height * botScale;
        const botY = canvas.height - botH - 80;                        // ADJUST: -80 = distance from bottom
        ctx.drawImage(botImg, playerBotX, botY, botW, botH);
    }

    // ============================================================================
    // ENEMY BOT - ANCHORED BOTTOM-CENTER-RIGHT
    // ============================================================================
    const enemyImg = gameState.images[battle.enemySprite];
    if (enemyImg) {
        const enemyScale = 0.4;                                        // ADJUST: Enemy size (0.4 = 40% of original)
        const enemyW = enemyImg.width * enemyScale;
        const enemyH = enemyImg.height * enemyScale;
        const enemyY = canvas.height - enemyH - 200;                   // ADJUST: -200 = distance from bottom (higher than player)
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
        const panelX = 10;                                             // ADJUST: Distance from left edge
        const panelY = 10;                                             // ADJUST: Distance from top edge
        const panelW = 300;                                            // ADJUST: Panel width
        const panelH = 160;                                            // ADJUST: Panel height
        ctx.drawImage(topLeftBox, panelX, panelY, panelW, panelH);

        // Player icon
        const iconMarquee = gameState.images[ASSETS.iconMarquee];
        if (iconMarquee) {
            ctx.drawImage(iconMarquee, panelX + 10, panelY + 10, 32, 32);  // ADJUST: Icon position relative to panel
        }

        // Player name
        drawPixelText(battle.player.name, panelX + 50, panelY + 35, 16, '#FFD700', 'left', true);  // ADJUST: Name position & size & color

        // Hits counter
        drawPixelText('HITS', panelX + 10, panelY + 70, 14, '#FFFFFF', 'left', false);             // ADJUST: Label position & size
        drawPixelText(`${battle.player.hits} / 9`, panelX + 80, panelY + 70, 20, '#00FF00', 'left', true);  // ADJUST: Counter position & size & color

        // Heat bar
        drawPixelText('HEAT', panelX + 10, panelY + 90, 12, '#FFFFFF', 'left', false);             // ADJUST: Heat label position
        const heatPercent = Math.min(battle.player.heat / battle.player.stats.power, 1);
        const hpBarWidth = 200;                                        // ADJUST: Bar width
        const hpBarHeight = 12;                                        // ADJUST: Bar height
        ctx.fillStyle = '#222';                                        // ADJUST: Bar background color
        ctx.fillRect(panelX + 50, panelY + 75, hpBarWidth, hpBarHeight);
        const heatColor = heatPercent > 0.8 ? '#FF0000' : heatPercent > 0.5 ? '#FF8C00' : '#FFFF00';  // ADJUST: Heat colors
        ctx.fillStyle = heatColor;
        ctx.fillRect(panelX + 50, panelY + 75, hpBarWidth * heatPercent, hpBarHeight);

        // Stat icons
        const iconGpu = gameState.images[ASSETS.iconGpu];
        const iconCpu = gameState.images[ASSETS.iconCpu];
        const iconRam = gameState.images[ASSETS.iconRam];

        if (iconGpu) ctx.drawImage(iconGpu, panelX + 10, panelY + 115, 22, 22);                    // ADJUST: GPU icon position & size
        drawPixelText(`${battle.player.stats.compute}`, panelX + 37, panelY + 132, 13, '#CCC', 'left', false);  // ADJUST: GPU stat position & size & color

        if (iconCpu) ctx.drawImage(iconCpu, panelX + 90, panelY + 115, 22, 22);                    // ADJUST: CPU icon position & size
        drawPixelText(`${battle.player.stats.logic}`, panelX + 117, panelY + 132, 13, '#CCC', 'left', false);  // ADJUST: CPU stat position & size & color

        if (iconRam) ctx.drawImage(iconRam, panelX + 170, panelY + 115, 22, 22);                   // ADJUST: RAM icon position & size
        drawPixelText(`${battle.player.stats.io}`, panelX + 197, panelY + 132, 13, '#CCC', 'left', false);  // ADJUST: RAM stat position & size & color

        drawPixelText(`NET:${battle.player.stats.network}`, panelX + 10, panelY + 152, 11, '#CCC', 'left', false);  // ADJUST: NET stat position & size & color
        drawPixelText(`MEM:${battle.player.stats.memory}`, panelX + 110, panelY + 152, 11, '#CCC', 'left', false);  // ADJUST: MEM stat position & size & color
    }

    // ============================================================================
    // ENEMY STAT PANEL - ANCHORED TOP-RIGHT
    // ============================================================================
    const bottomRightBox = gameState.images[ASSETS.uiBoxBottomRight];
    if (bottomRightBox) {
        const panelW = 300;                                            // ADJUST: Panel width
        const panelH = 160;                                            // ADJUST: Panel height
        const panelX = canvas.width - panelW - 10;                     // ADJUST: Distance from right edge (-10)
        const panelY = 10;                                             // ADJUST: Distance from top edge
        ctx.drawImage(bottomRightBox, panelX, panelY, panelW, panelH);

        // Enemy icon
        const iconEnemy = gameState.images[ASSETS.iconEnemy];
        if (iconEnemy) {
            ctx.drawImage(iconEnemy, panelX + 10, panelY + 10, 32, 32);  // ADJUST: Icon position relative to panel
        }

        // Enemy name
        drawPixelText(battle.enemy.name, panelX + 50, panelY + 35, 16, '#FF6B6B', 'left', true);  // ADJUST: Name position & size & color

        // Hits counter
        drawPixelText('HITS', panelX + 10, panelY + 70, 14, '#FFFFFF', 'left', false);             // ADJUST: Label position & size
        drawPixelText(`${battle.enemy.hits} / 9`, panelX + 90, panelY + 70, 20, '#FF6B6B', 'left', true);  // ADJUST: Counter position & size & color

        // Heat bar
        drawPixelText('HEAT', panelX + 10, panelY + 90, 12, '#FFFFFF', 'left', false);             // ADJUST: Heat label position
        const heatPercent = Math.min(battle.enemy.heat / battle.enemy.stats.power, 1);
        const hpBarWidth = 200;                                        // ADJUST: Bar width
        const hpBarHeight = 12;                                        // ADJUST: Bar height
        ctx.fillStyle = '#222';                                        // ADJUST: Bar background color
        ctx.fillRect(panelX + 60, panelY + 75, hpBarWidth, hpBarHeight);
        const heatColor = heatPercent > 0.8 ? '#FF0000' : heatPercent > 0.5 ? '#FF8C00' : '#FFFF00';  // ADJUST: Heat colors
        ctx.fillStyle = heatColor;
        ctx.fillRect(panelX + 60, panelY + 75, hpBarWidth * heatPercent, hpBarHeight);

        // Stats (no icons for enemy - just text)
        drawPixelText(`GPU:${battle.enemy.stats.compute}`, panelX + 10, panelY + 120, 11, '#CCC', 'left', false);  // ADJUST: GPU stat position & size & color
        drawPixelText(`CPU:${battle.enemy.stats.logic}`, panelX + 10, panelY + 137, 11, '#CCC', 'left', false);    // ADJUST: CPU stat position & size & color
        drawPixelText(`I/O:${battle.enemy.stats.io}`, panelX + 10, panelY + 154, 11, '#CCC', 'left', false);       // ADJUST: I/O stat position & size & color
        drawPixelText(`NET:${battle.enemy.stats.network}`, panelX + 125, panelY + 120, 11, '#CCC', 'left', false); // ADJUST: NET stat position & size & color
        drawPixelText(`MEM:${battle.enemy.stats.memory}`, panelX + 125, panelY + 137, 11, '#CCC', 'left', false);  // ADJUST: MEM stat position & size & color
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
        const scale = 1.5;                                             // ADJUST: Animation sprite size (1.5 = 150% of original)
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
    // COMMAND INTERFACE PANEL - ANCHORED BOTTOM (FULL WIDTH)
    // ============================================================================
    const panelHeight = 150;                                           // ADJUST: Panel height
    const panelY = canvas.height - panelHeight;                        // Anchored to bottom

    // Background panel
    ctx.fillStyle = 'rgba(20, 20, 40, 0.95)';                         // ADJUST: Panel background color (R, G, B, opacity)
    ctx.fillRect(0, panelY, canvas.width, panelHeight);
    ctx.strokeStyle = '#4ECDC4';                                       // ADJUST: Panel border color
    ctx.lineWidth = 3;                                                 // ADJUST: Border thickness
    ctx.strokeRect(0, panelY, canvas.width, panelHeight);

    // Optional texture overlay
    const bottomRightBox = gameState.images[ASSETS.uiBoxBottomRight];
    if (bottomRightBox) {
        ctx.globalAlpha = 0.3;                                         // ADJUST: Texture opacity (0.0 to 1.0)
        ctx.drawImage(bottomRightBox, 0, panelY, canvas.width, panelHeight);
        ctx.globalAlpha = 1.0;
    }

    // Title text
    drawPixelText('COMMAND INTERFACE', canvas.width / 2, panelY + 35, 22, '#4ECDC4', 'center', true);  // ADJUST: Title position & size & color

    // ============================================================================
    // COMMAND BUTTONS LAYOUT
    // ============================================================================
    const btnWidth = 250;                                              // ADJUST: Button width
    const btnHeight = 50;                                              // ADJUST: Button height
    const btnSpacing = 25;                                             // ADJUST: Space between buttons
    const startX = (canvas.width - (btnWidth * 4 + btnSpacing * 3)) / 2;  // Auto-centered
    const btnY = panelY + 70;                                          // ADJUST: Distance from panel top

    const commands = [
        { text: 'EXECUTE', enabled: true, key: 'execute' },            // ADJUST: Button text & enabled state
        { text: 'TOOL', enabled: false, key: 'tool' },                // ADJUST: Button text & enabled state
        { text: 'SWAP', enabled: false, key: 'swap' },                // ADJUST: Button text & enabled state
        { text: 'CONCEDE', enabled: true, key: 'concede' }            // ADJUST: Button text & enabled state
    ];

    gameState.commandButtons = [];

    commands.forEach((cmd, i) => {
        const btnX = startX + (btnWidth + btnSpacing) * i;

        // Button background
        ctx.fillStyle = cmd.enabled ? 'rgba(78, 205, 196, 0.5)' : 'rgba(100, 100, 100, 0.3)';  // ADJUST: Button fill colors (enabled/disabled)
        ctx.fillRect(btnX, btnY, btnWidth, btnHeight);

        // Button border
        ctx.strokeStyle = cmd.enabled ? '#4ECDC4' : '#666';            // ADJUST: Button border colors (enabled/disabled)
        ctx.lineWidth = 3;                                             // ADJUST: Button border thickness
        ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

        // Button text
        drawPixelText(cmd.text, btnX + btnWidth / 2, btnY + 33, 16, cmd.enabled ? '#FFFFFF' : '#666', 'center', true);  // ADJUST: Text position & size & colors

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

    ctx.fillStyle = 'rgba(0, 0, 0, 0.93)';                             // ADJUST: Panel background color (R, G, B, opacity)
    ctx.fillRect(panelX, 0, panelWidth, canvas.height);
    ctx.strokeStyle = '#4ECDC4';                                       // ADJUST: Panel border color
    ctx.lineWidth = 5;                                                 // ADJUST: Panel border thickness
    ctx.strokeRect(panelX, 0, panelWidth, canvas.height);

    // Panel title
    drawPixelText('SELECT FUNCTION', panelX + panelWidth / 2, 45, 16, '#4ECDC4', 'center', true);  // ADJUST: Title position & size & color

    // ============================================================================
    // MOVE BUTTONS LAYOUT
    // ============================================================================
    const moves = battle.player.moves;
    const btnWidth = 460;                                              // ADJUST: Move button width
    const btnHeight = 90;                                              // ADJUST: Move button height
    const startY = 90;                                                 // ADJUST: First button Y position from top
    const spacing = 15;                                                // ADJUST: Vertical space between move buttons

    gameState.moveButtons = [];

    moves.forEach((move, i) => {
        const btnX = panelX + 20;                                      // ADJUST: Button X offset from panel edge
        const btnY = startY + (btnHeight + spacing) * i;

        // Button background
        ctx.fillStyle = 'rgba(78, 205, 196, 0.25)';                    // ADJUST: Move button fill color
        ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
        ctx.strokeStyle = '#4ECDC4';                                   // ADJUST: Move button border color
        ctx.lineWidth = 3;                                             // ADJUST: Move button border thickness
        ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

        // Move text (left side)
        drawPixelText(move.name, btnX + 15, btnY + 28, 14, '#FFD700', 'left', true);              // ADJUST: Move name position & size & color
        drawPixelText(`[${move.slot}]`, btnX + 15, btnY + 50, 9, '#888', 'left', false);          // ADJUST: Slot text position & size & color
        drawPixelText(move.description, btnX + 15, btnY + 70, 9, '#CCC', 'left', false);          // ADJUST: Description position & size & color

        // Move stats (right side)
        drawPixelText(`DMG:${move.compute}`, btnX + btnWidth - 15, btnY + 35, 10, '#FF6B6B', 'right', false);           // ADJUST: Damage stat
        drawPixelText(`HEAT:${move.heat > 0 ? '+' : ''}${move.heat}`, btnX + btnWidth - 15, btnY + 55, 10, '#FF8C00', 'right', false);  // ADJUST: Heat stat
        drawPixelText(`ACC:${move.accuracy}%`, btnX + btnWidth - 15, btnY + 75, 10, '#4ECDC4', 'right', false);         // ADJUST: Accuracy stat

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

    drawPixelText('BACK', backBtnX + backBtnW / 2, backBtnY + 30, 13, '#FFFFFF', 'center', true);  // ADJUST: Back text position & size & color

    gameState.backButton = { x: backBtnX, y: backBtnY, w: backBtnW, h: backBtnH };
}

// ============================================================================
// POST-BATTLE RESULT SCREEN
// ============================================================================
function drawPostBattle(winner) {
    // Background overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.96)';                             // ADJUST: Background overlay color (R, G, B, opacity)
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
    drawPixelText('BATTLE SUMMARY', canvas.width / 2, 250, 18, '#FFD700', 'center', true);  // ADJUST: Title position & size & color

    const summaryX = canvas.width / 2 - 300;                           // ADJUST: Summary text X position (offset from center)
    let summaryY = 310;                                                // ADJUST: Starting Y position for summary items

    // Rewards list
    drawPixelText(`Data Packets: ${battle.rewards.dataPackets}`, summaryX, summaryY, 14, '#CCC', 'left', false);  // ADJUST: Data packets line
    summaryY += 40;                                                    // ADJUST: Line spacing
    drawPixelText(`XP Gained: ${battle.rewards.xp}`, summaryX, summaryY, 14, '#CCC', 'left', false);              // ADJUST: XP line
    summaryY += 40;                                                    // ADJUST: Line spacing
    drawPixelText(`PMP: +${battle.rewards.pmp}`, summaryX, summaryY, 14, '#CCC', 'left', false);                  // ADJUST: PMP line
    summaryY += 40;                                                    // ADJUST: Line spacing
    drawPixelText(`Parts: ${battle.rewards.partsGained.length > 0 ? battle.rewards.partsGained.join(', ') : 'None'}`, summaryX, summaryY, 12, '#CCC', 'left', false);  // ADJUST: Parts line
    summaryY += 60;                                                    // ADJUST: Extra spacing before integrity line

    // Integrity status
    drawPixelText(`Player: ${battle.player.integrity}%  Enemy: ${battle.enemy.integrity}%`, summaryX, summaryY, 11, '#888', 'left', false);  // ADJUST: Integrity line

    // Return prompt - ANCHORED BOTTOM
    drawPixelText('Click to return to menu', canvas.width / 2, canvas.height - 60, 16, '#4ECDC4', 'center', true);  // ADJUST: Prompt position & size & color
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

function executeTurn(playerMove) {
    const battle = gameState.battle;
    battle.turnCount++;

    const enemyMove = battle.enemy.moves[Math.floor(Math.random() * battle.enemy.moves.length)];
    battle.addLog(`\n--- TURN ${battle.turnCount} ---`);

    const firstAttacker = battle.determineTurnOrder(playerMove, enemyMove);

    if (firstAttacker === 'player') {
        executePlayerAttack(playerMove, () => {
            if (battle.player.hits >= 9) {
                endBattle('player');
            } else {
                setTimeout(() => {
                    executeEnemyAttack(enemyMove, () => {
                        if (battle.enemy.hits >= 9) {
                            endBattle('enemy');
                        } else {
                            setTimeout(() => {
                                gameState.scene = 'TURN_SELECT';
                                drawBattle();
                            }, 1000);
                        }
                    });
                }, 1000);
            }
        });
    } else {
        executeEnemyAttack(enemyMove, () => {
            if (battle.enemy.hits >= 9) {
                endBattle('enemy');
            } else {
                setTimeout(() => {
                    executePlayerAttack(playerMove, () => {
                        if (battle.player.hits >= 9) {
                            endBattle('player');
                        } else {
                            setTimeout(() => {
                                gameState.scene = 'TURN_SELECT';
                                drawBattle();
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
            // Regular hit - increment hit counter
            battle.player.hits++;
            battle.enemy.integrity -= result.damage;

            if (result.critical) {
                battle.addLog(`CRITICAL DATA HIT! ${result.damage} damage! [${battle.player.hits}/9 hits]`);
                showHitMissSprite(ASSETS.directHitLanded);
            } else {
                battle.addLog(`Hit! ${result.damage} damage dealt. [${battle.player.hits}/9 hits]`);
            }
            playSound('hit');
            battle.playerSprites.tabia = ASSETS.tabia.jumpPoint;
            battle.enemySprite = ASSETS.enemy.hit;

            if (battle.player.hits >= 9) {
                battle.addLog(`${battle.player.name} WINS WITH 9 HITS!`);
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

        if (!result.hit) {
            battle.addLog('Enemy missed!');
            playSound('miss');
            battle.playerSprites.tabia = ASSETS.tabia.surprised;
            showHitMissSprite(ASSETS.miss);
        } else {
            // Enemy hit - increment enemy hit counter
            battle.enemy.hits++;
            battle.player.integrity -= result.damage;

            if (result.critical) {
                battle.addLog(`ENEMY CRITICAL HIT! ${result.damage} damage! [${battle.enemy.hits}/9 hits]`);
                showHitMissSprite(ASSETS.directHitReceived);
            } else {
                battle.addLog(`Enemy hit! ${result.damage} damage received. [${battle.enemy.hits}/9 hits]`);
            }
            playSound('hit');
            battle.playerSprites.tabia = ASSETS.tabia.surprised;

            if (battle.enemy.hits >= 9) {
                battle.addLog(`${battle.enemy.name} WINS WITH 9 HITS!`);
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
    if (gameState.scene === 'MENU') {
        drawMainMenu();
    } else if (gameState.scene === 'CHALLENGE') {
        drawChallengeScreen();
    } else if (gameState.scene === 'BATTLE_START' || gameState.scene === 'TURN_SELECT' || gameState.scene === 'MOVE_SELECT' || gameState.scene === 'TURN_EXECUTE') {
        drawBattle();
    } else if (gameState.scene === 'POST_BATTLE') {
        // Post battle screen handled separately
    }

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
    loadAllAssets();
    gameLoop(); // Start continuous render loop
});
