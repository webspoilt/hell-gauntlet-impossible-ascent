// Game variables
let canvas, ctx;
let player;
let platforms = [];
let spikes = [];
let movingPlatforms = [];
let sawBlades = [];
let particles = [];
let deathCount = 0;
let startTime = 0;
let currentTime = 0;
let gameRunning = false;
let gamePaused = false;
let lastTime = 0;
let difficultyMultiplier = 1;
let level = 1;
let achievements = [];
let stats = {
    totalDeaths: 0,
    longestSurvival: 0,
    bestTime: Infinity,
    levelsCompleted: 0
};

// Input handling
const keys = {
    left: false,
    right: false,
    up: false,
    space: false
};

// Touch controls
let touchControls = {
    left: false,
    right: false,
    up: false
};

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create player
    createPlayer();
    
    // Create initial level
    createHellishLevel();
    
    // Event listeners
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('retry-btn').addEventListener('click', restartGame);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('resume-btn').addEventListener('click', togglePause);
    document.getElementById('quit-btn').addEventListener('click', quitGame);
    document.getElementById('save-btn').addEventListener('click', saveCheckpoint);
    
    // Keyboard controls
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    
    // Touch controls for mobile
    setupTouchControls();
    
    // Initialize audio on first user interaction
    document.addEventListener('click', initializeAudio, { once: true });
    document.addEventListener('touchstart', initializeAudio, { once: true });
    
    // Start auto-save
    saveSystem.startAutoSave();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Initialize audio
function initializeAudio() {
    soundEffects.init();
    console.log('Audio initialized');
}

// Create player
function createPlayer() {
    player = {
        x: canvas.width / 2 - 15,
        y: canvas.height - 100,
        width: 25,
        height: 25,
        color: '#ff0000',
        velocityX: 0,
        velocityY: 0,
        speed: 6,
        jumpForce: 13,
        isJumping: false,
        gravity: 0.6,
        maxSpeed: 8,
        friction: 0.8
    };
}

// Resize canvas to window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (player) {
        player.x = Math.min(player.x, canvas.width - player.width);
        player.y = Math.min(player.y, canvas.height - player.height);
    }
}

// Create an extremely difficult level
function createHellishLevel() {
    platforms = [];
    spikes = [];
    movingPlatforms = [];
    sawBlades = [];
    particles = [];
    
    // Starting platform (smaller on mobile)
    const startWidth = window.innerWidth < 640 ? window.innerWidth - 40 : window.width;
    platforms.push({
        x: 20,
        y: canvas.height - 40,
        width: startWidth,
        height: 20,
        color: '#333',
        type: 'start'
    });
    
    // Base obstacles
    const obstacleCount = Math.floor(canvas.width * canvas.height / 50000) + 50;
    
    for (let i = 0; i < obstacleCount; i++) {
        const random = Math.random();
        
        if (random > 0.1) {
            // Random platforms (even more frequent)
            const platformWidth = 15 + Math.random() * 40;
            const platformHeight = 3 + Math.random() * 8;
            platforms.push({
                x: Math.random() * (canvas.width - platformWidth - 40) + 20,
                y: Math.random() * (canvas.height - 200),
                width: platformWidth,
                height: platformHeight,
                color: '#555',
                type: 'static'
            });
        }
        
        if (random > 0.3) {
            // Spikes (more aggressive placement)
            spikes.push({
                x: Math.random() * (canvas.width - 30) + 15,
                y: Math.random() * (canvas.height - 100),
                width: 20,
                height: 20,
                color: '#ff0000',
                type: 'spike'
            });
        }
        
        if (random > 0.4) {
            // Moving platforms (faster and smaller)
            const platformWidth = 20 + Math.random() * 40;
            const platformHeight = 4 + Math.random() * 8;
            const speed = 4 + Math.random() * 8;
            movingPlatforms.push({
                x: Math.random() * (canvas.width - platformWidth - 80) + 40,
                y: Math.random() * (canvas.height - 200),
                width: platformWidth,
                height: platformHeight,
                color: '#777',
                speed: speed,
                direction: Math.random() > 0.5 ? 1 : -1,
                minX: Math.random() * (canvas.width / 3),
                maxX: canvas.width / 3 + Math.random() * (canvas.width / 2),
                type: 'moving'
            });
        }
        
        if (random > 0.5) {
            // Saw blades (larger and faster)
            sawBlades.push({
                x: Math.random() * (canvas.width - 60) + 30,
                y: Math.random() * (canvas.height - 60) + 30,
                radius: 8 + Math.random() * 25,
                speed: 4 + Math.random() * 12,
                angle: 0,
                color: '#ff0000',
                type: 'saw'
            });
        }
    }
    
    // Create the nearly impossible path to the top
    createImpossiblePath();
    
    // Add death traps
    addBrutalDeathTraps();
}

// Create the main path (intentionally nearly impossible)
function createImpossiblePath() {
    const pathWidth = 15; // Made platforms even narrower
    const pathHeight = 8;
    const steps = Math.floor(canvas.height / 20); // More steps
    const stepHeight = (canvas.height - 120) / steps;
    
    let currentX = canvas.width / 2 - pathWidth / 2;
    
    for (let i = 0; i < steps; i++) {
        // Add tiny platforms with massive gaps
        platforms.push({
            x: Math.max(10, Math.min(currentX, canvas.width - pathWidth - 10)),
            y: canvas.height - 80 - (i * stepHeight),
            width: pathWidth,
            height: pathHeight,
            color: '#444',
            type: 'path'
        });
        
        // Randomly shift position drastically
        const shift = (Math.random() * 300 - 150) * (1 + level * 0.1);
        currentX += shift;
        currentX = Math.max(10, Math.min(currentX, canvas.width - pathWidth - 10));
        
        // Add spikes everywhere (more aggressive)
        const spikeCount = Math.floor(Math.random() * 3) + 2;
        for (let j = 0; j < spikeCount; j++) {
            spikes.push({
                x: currentX - 40 + Math.random() * 20,
                y: canvas.height - 80 - (i * stepHeight) - 35 + Math.random() * 20,
                width: 25,
                height: 25,
                color: '#ff0000',
                type: 'trap'
            });
            
            spikes.push({
                x: currentX + pathWidth + 15 + Math.random() * 20,
                y: canvas.height - 80 - (i * stepHeight) - 35 + Math.random() * 20,
                width: 25,
                height: 25,
                color: '#ff0000',
                type: 'trap'
            });
        }
        
        // Add moving obstacles frequently (more aggressive)
        if (i % Math.max(1, Math.floor(3 - level * 0.1)) === 0) {
            sawBlades.push({
                x: currentX + pathWidth / 2,
                y: canvas.height - 80 - (i * stepHeight) - 60,
                radius: 20 + Math.random() * 15,
                speed: 8 + Math.random() * 8,
                angle: 0,
                color: '#ff0000',
                type: 'path_saw'
            });
        }
        
        // Add moving platforms to block the way
        if (i % Math.max(1, Math.floor(4 - level * 0.1)) === 0) {
            const blockWidth = 25 + Math.random() * 20;
            movingPlatforms.push({
                x: currentX - 80 + Math.random() * 160,
                y: canvas.height - 80 - (i * stepHeight) - 80,
                width: blockWidth,
                height: 6,
                color: '#999',
                speed: 6 + Math.random() * 6,
                direction: Math.random() > 0.5 ? 1 : -1,
                minX: currentX - 120,
                maxX: currentX + 120,
                type: 'blocker'
            });
        }
    }
}

// Add brutal death traps
function addBrutalDeathTraps() {
    // Narrow passages with death
    for (let i = 0; i < 8 + level; i++) {
        const x = Math.random() * (canvas.width - 120);
        const y = Math.random() * (canvas.height - 250);
        
        // Create narrow passage
        platforms.push({
            x: x,
            y: y,
            width: 15,
            height: 120,
            color: '#444',
            type: 'passage'
        });
        
        // Surround with spikes (more aggressive)
        for (let j = 0; j < 8; j++) {
            spikes.push({
                x: x - 35,
                y: y + j * 15,
                width: 25,
                height: 25,
                color: '#ff0000',
                type: 'passage_trap'
            });
            
            spikes.push({
                x: x + 35,
                y: y + j * 15,
                width: 25,
                height: 25,
                color: '#ff0000',
                type: 'passage_trap'
            });
        }
    }
    
    // Flying saw blade corridors
    for (let i = 0; i < 3 + level; i++) {
        const startX = Math.random() * canvas.width;
        const endX = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height - 200);
        
        for (let j = 0; j < 4; j++) {
            sawBlades.push({
                x: startX + j * (Math.abs(endX - startX) / 4),
                y: y + Math.random() * 100 - 50,
                radius: 15 + Math.random() * 20,
                speed: 6 + Math.random() * 8,
                angle: 0,
                color: '#ff0000',
                startX: Math.min(startX, endX),
                endX: Math.max(startX, endX),
                direction: Math.random() > 0.5 ? 1 : -1,
                type: 'corridor'
            });
        }
    }
    
    // Vertical moving saws
    for (let i = 0; i < 5 + level; i++) {
        const x = Math.random() * canvas.width;
        const topY = 50;
        const bottomY = canvas.height - 100;
        
        for (let j = 0; j < 2; j++) {
            sawBlades.push({
                x: x + j * 40,
                y: (topY + bottomY) / 2,
                radius: 12 + Math.random() * 18,
                speed: 3 + Math.random() * 5,
                angle: 0,
                color: '#ff0000',
                startY: topY,
                endY: bottomY,
                direction: Math.random() > 0.5 ? 1 : -1,
                vertical: true,
                type: 'vertical'
            });
        }
    }
}

// Setup touch controls
function setupTouchControls() {
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const jumpBtn = document.getElementById('jump-btn');
    
    // Touch events
    leftBtn.addEventListener('touchstart', () => { touchControls.left = true; leftBtn.classList.add('active'); });
    leftBtn.addEventListener('touchend', () => { touchControls.left = false; leftBtn.classList.remove('active'); });
    
    rightBtn.addEventListener('touchstart', () => { touchControls.right = true; rightBtn.classList.add('active'); });
    rightBtn.addEventListener('touchend', () => { touchControls.right = false; rightBtn.classList.remove('active'); });
    
    jumpBtn.addEventListener('touchstart', () => { 
        if (!player.isJumping) {
            touchControls.up = true;
            setTimeout(() => { touchControls.up = false; }, 100);
        }
    });
    
    // Mouse events (for testing on desktop)
    leftBtn.addEventListener('mousedown', () => { touchControls.left = true; leftBtn.classList.add('active'); });
    leftBtn.addEventListener('mouseup', () => { touchControls.left = false; leftBtn.classList.remove('active'); });
    leftBtn.addEventListener('mouseleave', () => { touchControls.left = false; leftBtn.classList.remove('active'); });
    
    rightBtn.addEventListener('mousedown', () => { touchControls.right = true; rightBtn.classList.add('active'); });
    rightBtn.addEventListener('mouseup', () => { touchControls.right = false; rightBtn.classList.remove('active'); });
    rightBtn.addEventListener('mouseleave', () => { touchControls.right = false; rightBtn.classList.remove('active'); });
    
    jumpBtn.addEventListener('mousedown', () => { 
        if (!player.isJumping) {
            touchControls.up = true;
            setTimeout(() => { touchControls.up = false; }, 100);
        }
    });
}

// Keyboard event handlers
function keyDownHandler(e) {
    switch(e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = true;
            break;
        case 'ArrowUp':
        case 'Space':
        case 'KeyW':
            if (!player.isJumping) {
                keys.up = true;
                keys.space = true;
            }
            break;
    }
}

function keyUpHandler(e) {
    switch(e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = false;
            break;
        case 'ArrowUp':
        case 'Space':
        case 'KeyW':
            keys.up = false;
            keys.space = false;
            break;
    }
}

// Game loop
function gameLoop(timestamp) {
    if (!gamePaused && gameRunning) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        update(deltaTime);
        currentTime = Date.now();
        updateTimer();
        checkAchievements();
    }
    
    render();
    requestAnimationFrame(gameLoop);
}

// Update game state
function update(deltaTime) {
    // Handle input
    handleInput();
    
    // Apply gravity
    player.velocityY += player.gravity;
    
    // Apply friction
    if (!keys.left && !keys.right && !touchControls.left && !touchControls.right) {
        player.velocityX *= player.friction;
    }
    
    // Limit speed
    player.velocityX = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.velocityX));
    
    // Update player position
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Check platform collisions
    let onGround = false;
    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            // Top collision
            if (player.velocityY > 0 && player.y + player.height - player.velocityY <= platform.y + 5) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isJumping = false;
                onGround = true;
                if (player.velocityY > 5) { // Play landing sound if falling fast
                    soundEffects.playLanding();
                }
            }
            // Bottom collision
            else if (player.velocityY < 0 && player.y - player.velocityY >= platform.y + platform.height - 5) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
            // Side collisions (still kill)
            else {
                playerDie();
            }
        }
    });
    
    // Update moving platforms
    movingPlatforms.forEach(platform => {
        platform.x += platform.speed * platform.direction;
        
        if (platform.x <= platform.minX || platform.x + platform.width >= platform.maxX) {
            platform.direction *= -1;
        }
        
        if (checkCollision(player, platform)) {
            if (player.velocityY > 0 && player.y + player.height - player.velocityY <= platform.y + 5) {
                player.y = platform.y - player.height;
                player.x += platform.speed * platform.direction;
                player.velocityY = 0;
                player.isJumping = false;
                onGround = true;
            } else {
                playerDie();
            }
        }
    });
    
    // Update flying saw blades
    sawBlades.forEach(saw => {
        if (saw.vertical) {
            saw.y += saw.speed * saw.direction;
            if (saw.y <= saw.startY || saw.y >= saw.endY) {
                saw.direction *= -1;
            }
        } else {
            if (saw.startX !== undefined && saw.endX !== undefined) {
                saw.x += saw.speed * saw.direction;
                if ((saw.direction > 0 && saw.x > saw.endX) || 
                    (saw.direction < 0 && saw.x < saw.startX)) {
                    saw.direction *= -1;
                }
            }
        }
        saw.angle += saw.speed * 3;
    });
    
    // Check collisions with deadly objects
    spikes.forEach(spike => {
        if (checkCollision(player, spike)) {
            playerDie();
        }
    });
    
    sawBlades.forEach(saw => {
        const distance = Math.sqrt(
            Math.pow(player.x + player.width / 2 - saw.x, 2) + 
            Math.pow(player.y + player.height / 2 - saw.y, 2)
        );
        
        if (distance < saw.radius + player.width / 2) {
            playerDie();
        }
    });
    
    // Update particles
    updateParticles();
    
    // Death conditions
    if (player.y > canvas.height + 50) {
        playerDie();
    }
    
    // Make it nearly impossible to win
    if (player.y < 50 && Math.random() > 0.01) {
        playerDie();
    }
    
    // Increase difficulty
    difficultyMultiplier = 1 + (currentTime - startTime) / 30000;
    
    movingPlatforms.forEach(platform => {
        platform.speed = Math.min(platform.speed * (1 + difficultyMultiplier * 0.01), 20);
    });
    
    sawBlades.forEach(saw => {
        saw.speed = Math.min(saw.speed * (1 + difficultyMultiplier * 0.01), 25);
    });
}

// Handle player input
function handleInput() {
    // Horizontal movement
    const currentLeft = keys.left || touchControls.left;
    const currentRight = keys.right || touchControls.right;
    const currentUp = keys.up || touchControls.up;
    
    if (currentLeft && !currentRight) {
        player.velocityX -= 0.8;
    } else if (currentRight && !currentLeft) {
        player.velocityX += 0.8;
    }
    
    // Jump
    if (currentUp && !player.isJumping) {
        player.velocityY = -player.jumpForce;
        player.isJumping = true;
        soundEffects.playJump();
    }
    
    // Keep player in bounds
    if (player.x < 0) {
        player.x = 0;
        player.velocityX = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
        player.velocityX = 0;
    }
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Player death
function playerDie() {
    // Play death sound
    soundEffects.playDeath();
    soundEffects.playScreenShake();
    
    // Update stats
    stats.totalDeaths++;
    const survivalTime = (currentTime - startTime) / 1000;
    if (survivalTime > stats.longestSurvival) {
        stats.longestSurvival = survivalTime;
    }
    
    // Save game immediately on death
    saveSystem.saveGame();
    
    // Show interstitial ad every 5 deaths
    adManager.maybeShowInterstitial();
    
    // Create death particles
    createDeathParticles();
    
    // Screen flash
    canvas.classList.add('flash');
    setTimeout(() => canvas.classList.remove('flash'), 200);
    
    deathCount++;
    updateUI();
    
    // Show death screen after delay
    setTimeout(() => {
        showDeathScreen();
        gameRunning = false;
    }, 500);
}

// Create death particles
function createDeathParticles() {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            velocityX: (Math.random() - 0.5) * 10,
            velocityY: (Math.random() - 0.5) * 10,
            life: 60,
            maxLife: 60,
            size: 2 + Math.random() * 4,
            color: '#ff0000'
        });
    }
}

// Update particles
function updateParticles() {
    particles = particles.filter(particle => {
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.velocityY += 0.2; // Gravity
        particle.life--;
        return particle.life > 0;
    });
}

// Check achievements
function checkAchievements() {
    const newAchievements = [];
    
    if (deathCount >= 10 && !achievements.includes('died_10_times')) {
        achievements.push('died_10_times');
        newAchievements.push('🎯 DIED 10 TIMES');
    }
    
    if (deathCount >= 50 && !achievements.includes('died_50_times')) {
        achievements.push('died_50_times');
        newAchievements.push('💀 DIED 50 TIMES');
    }
    
    if (deathCount >= 100 && !achievements.includes('died_100_times')) {
        achievements.push('died_100_times');
        newAchievements.push('🔥 DIED 100 TIMES');
    }
    
    if (stats.totalDeaths >= 500 && !achievements.includes('total_500_deaths')) {
        achievements.push('total_500_deaths');
        newAchievements.push('👹 DEATH MASTER');
    }
    
    // Show new achievements
    newAchievements.forEach((achievement, index) => {
        setTimeout(() => {
            showAchievement(achievement);
        }, index * 2000);
    });
}

// Show achievement notification
function showAchievement(text) {
    // Play achievement sound
    soundEffects.playAchievement();
    
    const achievement = document.getElementById('achievement');
    achievement.textContent = `ACHIEVEMENT UNLOCKED: ${text}`;
    achievement.classList.remove('hidden');
    achievement.style.animation = 'none';
    setTimeout(() => {
        achievement.style.animation = 'achievementSlide 3s ease-in-out forwards';
    }, 10);
}

// Render game
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a0000');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw platforms
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Add glow effect for path platforms
        if (platform.type === 'path') {
            ctx.shadowColor = '#666';
            ctx.shadowBlur = 5;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            ctx.shadowBlur = 0;
        }
    });
    
    // Draw moving platforms
    movingPlatforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Add warning glow
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 3;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.shadowBlur = 0;
    });
    
    // Draw spikes
    spikes.forEach(spike => {
        ctx.fillStyle = spike.color;
        ctx.beginPath();
        ctx.moveTo(spike.x, spike.y + spike.height);
        ctx.lineTo(spike.x + spike.width / 2, spike.y);
        ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
        ctx.closePath();
        ctx.fill();
        
        // Add glow
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    
    // Draw saw blades
    sawBlades.forEach(saw => {
        ctx.save();
        ctx.translate(saw.x, saw.y);
        ctx.rotate(saw.angle * Math.PI / 180);
        
        // Draw saw blade
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(0, 0, saw.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw teeth
        ctx.fillStyle = '#888';
        const teethCount = 8;
        for (let i = 0; i < teethCount; i++) {
            const angle = (i / teethCount) * Math.PI * 2;
            const x1 = Math.cos(angle) * (saw.radius - 5);
            const y1 = Math.sin(angle) * (saw.radius - 5);
            const x2 = Math.cos(angle) * (saw.radius + 8);
            const y2 = Math.sin(angle) * (saw.radius + 8);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(Math.cos(angle + 0.3) * (saw.radius + 5), Math.sin(angle + 0.3) * (saw.radius + 5));
            ctx.closePath();
            ctx.fill();
        }
        
        // Center
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(0, 0, saw.radius / 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Add glow
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(saw.x, saw.y, saw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff0000';
        ctx.stroke();
        ctx.shadowBlur = 0;
    });
    
    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Add player glow
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;
    
    // Draw particles
    particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw level indicator on mobile
    if (window.innerWidth < 640) {
        const levelIndicator = document.getElementById('level-indicator');
        levelIndicator.textContent = `Level: ${level}`;
        levelIndicator.classList.remove('hidden');
    }
}

// Update UI
function updateUI() {
    document.getElementById('deaths-counter').textContent = `Deaths: ${deathCount}`;
    document.getElementById('death-count').textContent = deathCount;
    document.getElementById('level-indicator').textContent = `Level: ${level}`;
}

// Update timer
function updateTimer() {
    const elapsed = Math.floor((currentTime - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('time-counter').textContent = `Time: ${timeString}`;
    document.getElementById('death-time').textContent = timeString;
}

// Game state management
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('death-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    
    gameRunning = true;
    gamePaused = false;
    startTime = Date.now();
    currentTime = startTime;
    
    // Reset player position
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 100;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isJumping = false;
    
    createPlayer();
    createHellishLevel();
    lastTime = performance.now();
}

function restartGame() {
    document.getElementById('death-screen').classList.add('hidden');
    startGame();
}

function togglePause() {
    if (gamePaused) {
        gamePaused = false;
        document.getElementById('pause-screen').classList.add('hidden');
        lastTime = performance.now();
    } else {
        gamePaused = true;
        document.getElementById('pause-screen').classList.remove('hidden');
    }
}

function quitGame() {
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    gameRunning = false;
    gamePaused = false;
    deathCount = 0;
    level = 1;
    updateUI();
}

// Save checkpoint function
function saveCheckpoint() {
    saveSystem.setCheckpoint(player.x, player.y);
    saveSystem.saveGame();
    
    // Show save confirmation
    const saveBtn = document.getElementById('save-btn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✅ SAVED!';
    saveBtn.style.backgroundColor = '#16a34a';
    
    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.backgroundColor = '';
    }, 1500);
}

function showDeathScreen() {
    document.getElementById('death-screen').classList.remove('hidden');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Prevent page scroll on spacebar
window.addEventListener('keydown', function(e) {
    if(e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
    }
});