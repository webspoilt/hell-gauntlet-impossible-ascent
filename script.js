// Game variables
let canvas, ctx;
let player;
let platforms = [];
let spikes = [];
let movingPlatforms = [];
let goal; // End point
let particles = [];
let deathCount = 0;
let startTime = 0;
let currentTime = 0;
let gameRunning = false;
let gamePaused = false;
let lastTime = 0;
let level = 1;
let achievements = [];
let gameWon = false;

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
    
    // Create simple level
    createSimpleLevel();
    
    // Setup touch controls
    setupTouchControls();
    
    // Setup keyboard controls
    setupKeyboardControls();
    
    // Setup save system
    setupSaveSystem();
    
    // Start game loop
    gameLoop();
}

// Create player character
function createPlayer() {
    player = {
        x: 50,
        y: canvas.height - 100,
        width: 20,
        height: 30,
        color: '#000000', // Black character
        velocityX: 0,
        velocityY: 0,
        speed: 5,
        jumpForce: 12,
        isJumping: false,
        gravity: 0.8,
        maxSpeed: 6,
        friction: 0.85,
        direction: 1 // 1 = right, -1 = left
    };
}

// Create a simple, clear level like Level Devil
function createSimpleLevel() {
    platforms = [];
    spikes = [];
    movingPlatforms = [];
    particles = [];
    
    // Ground platform
    platforms.push({
        x: 0,
        y: canvas.height - 40,
        width: canvas.width,
        height: 40,
        color: '#333333',
        type: 'ground'
    });
    
    // Clear pathway with simple obstacles
    const platformHeight = canvas.height - 200;
    
    // Starting platform area (clear of obstacles)
    platforms.push({
        x: 0,
        y: platformHeight,
        width: 200,
        height: 20,
        color: '#555555',
        type: 'start'
    });
    
    // Simple stepping stones path
    const steps = 8;
    const stepWidth = 80;
    const stepHeight = 20;
    const gap = 150;
    
    for (let i = 0; i < steps; i++) {
        const x = 300 + (i * gap);
        const y = platformHeight - (i * 40); // Gradually higher
        
        // Skip some steps to create gaps
        if (i !== 3 && i !== 6) {
            platforms.push({
                x: x,
                y: y,
                width: stepWidth,
                height: stepHeight,
                color: '#555555',
                type: 'step'
            });
        }
        
        // Add spikes on dangerous areas
        if (i === 2 || i === 4 || i === 7) {
            spikes.push({
                x: x + stepWidth / 2 - 15,
                y: y - 25,
                width: 30,
                height: 25,
                color: '#cc0000',
                type: 'spike'
            });
        }
    }
    
    // Moving platform section
    platforms.push({
        x: 300,
        y: platformHeight - 120,
        width: 100,
        height: 15,
        color: '#666666',
        type: 'static'
    });
    
    movingPlatforms.push({
        x: 450,
        y: platformHeight - 80,
        width: 80,
        height: 15,
        color: '#777777',
        speed: 2,
        direction: 1,
        minX: 450,
        maxX: 700,
        type: 'moving'
    });
    
    platforms.push({
        x: 750,
        y: platformHeight - 160,
        width: 100,
        height: 15,
        color: '#666666',
        type: 'static'
    });
    
    // Final approach to goal
    platforms.push({
        x: 900,
        y: platformHeight - 240,
        width: 120,
        height: 15,
        color: '#666666',
        type: 'goal_platform'
    });
    
    // Goal (end point) - bright and clear
    goal = {
        x: 1050,
        y: platformHeight - 300,
        width: 40,
        height: 60,
        color: '#00ff00', // Bright green
        type: 'goal',
        pulse: 0
    };
    
    // Clear the area around the goal
    spikes.push({
        x: 1000,
        y: platformHeight - 25,
        width: 40,
        height: 25,
        color: '#cc0000',
        type: 'guard'
    });
    
    spikes.push({
        x: 1100,
        y: platformHeight - 25,
        width: 40,
        height: 25,
        color: '#cc0000',
        type: 'guard'
    });
}

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (player) {
        player.x = Math.min(player.x, canvas.width - player.width);
        player.y = Math.min(player.y, canvas.height - player.height);
    }
}

// Setup touch controls
function setupTouchControls() {
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const jumpBtn = document.getElementById('jump-btn');
    
    if (!leftBtn || !rightBtn || !jumpBtn) return;
    
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
    
    // Mouse events
    leftBtn.addEventListener('mousedown', () => { touchControls.left = true; leftBtn.classList.add('active'); });
    leftBtn.addEventListener('mouseup', () => { touchControls.left = false; leftBtn.classList.remove('active'); });
    leftBtn.addEventListener('mouseleave', () => { touchControls.left = false; leftBtn.classList.remove('active'); });
    
    rightBtn.addEventListener('mousedown', () => { touchControls.right = true; rightBtn.classList.add('active'); });
    rightBtn.addEventListener('mouseup', () => { touchControls.right = false; rightBtn.classList.remove('active'); });
    rightBtn.addEventListener('mouseleave', () => { touchControls.right = false; rightBtn.classList.remove('active'); });
}

// Setup keyboard controls
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
            if (!player.isJumping) {
                keys.up = true;
                setTimeout(() => { keys.up = false; }, 100);
            }
        }
        if (e.code === 'Escape') togglePause();
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    });
}

// Setup save system
function setupSaveSystem() {
    if (typeof saveSystem !== 'undefined') {
        // Load saved data
        const savedData = saveSystem.loadGame();
        if (savedData && savedData.player) {
            player.x = savedData.player.x;
            player.y = savedData.player.y;
            deathCount = savedData.stats.deathCount || 0;
        }
    }
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    const now = Date.now();
    const deltaTime = now - lastTime;
    lastTime = now;
    
    if (!gamePaused) {
        update(deltaTime);
        render();
    }
    
    requestAnimationFrame(gameLoop);
}

// Update game state
function update(deltaTime) {
    // Update player
    updatePlayer();
    
    // Update moving platforms
    updateMovingPlatforms();
    
    // Update particles
    updateParticles();
    
    // Update goal animation
    if (goal) {
        goal.pulse += deltaTime * 0.01;
    }
    
    // Check collisions
    checkCollisions();
    
    // Check win condition
    checkWinCondition();
    
    currentTime = Date.now() - startTime;
}

// Update player
function updatePlayer() {
    // Horizontal movement
    if (keys.left || touchControls.left) {
        player.velocityX = -player.speed;
        player.direction = -1;
    } else if (keys.right || touchControls.right) {
        player.velocityX = player.speed;
        player.direction = 1;
    } else {
        player.velocityX *= player.friction;
        if (Math.abs(player.velocityX) < 0.1) player.velocityX = 0;
    }
    
    // Vertical movement
    if ((keys.up || touchControls.up) && !player.isJumping) {
        player.velocityY = -player.jumpForce;
        player.isJumping = true;
        playJumpSound();
    }
    
    // Apply gravity
    player.velocityY += player.gravity;
    
    // Apply velocity
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    
    // Check if player fell off the map
    if (player.y > canvas.height + 100) {
        playerDie();
    }
}

// Update moving platforms
function updateMovingPlatforms() {
    movingPlatforms.forEach(platform => {
        platform.x += platform.speed * platform.direction;
        
        if (platform.x <= platform.minX || platform.x + platform.width >= platform.maxX) {
            platform.direction *= -1;
        }
    });
}

// Update particles
function updateParticles() {
    particles = particles.filter(particle => {
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.life -= 1;
        particle.size *= 0.98;
        
        return particle.life > 0 && particle.size > 0.5;
    });
}

// Check collisions
function checkCollisions() {
    let onGround = false;
    
    // Platform collisions
    [...platforms, ...movingPlatforms].forEach(platform => {
        if (rectCollide(player, platform)) {
            // Vertical collision (landing on platform)
            if (player.velocityY > 0 && player.y + player.height - player.velocityY <= platform.y + 5) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isJumping = false;
                onGround = true;
                
                // Land sound
                if (typeof SoundSystem !== 'undefined') {
                    SoundSystem.play('landing');
                }
            }
            // Vertical collision (hitting platform from below)
            else if (player.velocityY < 0 && player.y - player.velocityY >= platform.y + platform.height - 5) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
            // Horizontal collision
            else if (player.velocityX > 0) {
                player.x = platform.x - player.width;
            } else if (player.velocityX < 0) {
                player.x = platform.x + platform.width;
            }
        }
    });
    
    // Spike collisions
    spikes.forEach(spike => {
        if (rectCollide(player, spike)) {
            playerDie();
        }
    });
    
    // Moving platform riding
    if (!onGround) {
        movingPlatforms.forEach(platform => {
            if (player.y + player.height >= platform.y &&
                player.y + player.height <= platform.y + 10 &&
                player.x + player.width > platform.x &&
                player.x < platform.x + platform.width &&
                player.velocityY >= 0) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isJumping = false;
                player.x += platform.speed * platform.direction * 0.5;
            }
        });
    }
}

// Check win condition
function checkWinCondition() {
    if (goal && rectCollide(player, goal) && !gameWon) {
        gameWon = true;
        showVictoryScreen();
    }
}

// Rectangle collision detection
function rectCollide(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Player death
function playerDie() {
    deathCount++;
    stats.totalDeaths++;
    
    // Death sound
    if (typeof SoundSystem !== 'undefined') {
        SoundSystem.play('death');
    }
    
    // Blood particles
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            velocityX: (Math.random() - 0.5) * 10,
            velocityY: (Math.random() - 0.5) * 10,
            size: 3 + Math.random() * 5,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            color: '#cc0000'
        });
    }
    
    // Respawn
    setTimeout(() => {
        player.x = 50;
        player.y = canvas.height - 100;
        player.velocityX = 0;
        player.velocityY = 0;
        player.isJumping = false;
        
        if (typeof saveSystem !== 'undefined') {
            saveSystem.setCheckpoint(player.x, player.y);
        }
    }, 100);
}

// Show victory screen
function showVictoryScreen() {
    const victoryScreen = document.getElementById('victory-screen');
    const finalTime = Math.floor(currentTime / 1000);
    
    document.getElementById('final-time').textContent = finalTime + 's';
    document.getElementById('final-deaths').textContent = deathCount;
    
    if (typeof SoundSystem !== 'undefined') {
        SoundSystem.play('achievement');
    }
    
    // Achievement
    if (!achievements.includes('victory')) {
        achievements.push('victory');
    }
    
    if (victoryScreen) {
        victoryScreen.classList.remove('hidden');
    }
}

// Render game
function render() {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a'; // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw goal (bright and pulsing)
    if (goal) {
        ctx.save();
        const pulse = Math.sin(goal.pulse) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0, 255, 0, ${pulse})`;
        ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
        
        // Goal glow
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 20;
        ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
        ctx.shadowBlur = 0;
        ctx.restore();
        
        // Goal text
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GOAL', goal.x + goal.width/2, goal.y - 10);
    }
    
    // Draw platforms
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
    
    // Draw moving platforms
    movingPlatforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
    
    // Draw spikes
    spikes.forEach(spike => {
        ctx.fillStyle = spike.color;
        
        // Draw triangular spike
        ctx.beginPath();
        ctx.moveTo(spike.x, spike.y + spike.height);
        ctx.lineTo(spike.x + spike.width / 2, spike.y);
        ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
        ctx.closePath();
        ctx.fill();
    });
    
    // Draw 2D character
    draw2DCharacter();
    
    // Draw particles
    particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color.replace('cc', Math.floor(alpha * 204));
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw UI
    drawUI();
}

// Draw 2D character
function draw2DCharacter() {
    ctx.save();
    
    // Character shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(player.x + player.width/2, player.y + player.height, player.width/2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    ctx.fillStyle = '#000000'; // Black character
    ctx.fillRect(player.x, player.y + 8, player.width, player.height - 8);
    
    // Head
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(player.x + player.width/2, player.y + 6, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Simple face details (eyes)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x + player.width/2 - 3, player.y + 4, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + player.width/2 + 3, player.y + 4, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Draw UI
function drawUI() {
    // Death counter
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Deaths: ${deathCount}`, 20, 30);
    
    // Timer
    const timeSeconds = Math.floor(currentTime / 1000);
    ctx.fillText(`Time: ${timeSeconds}s`, 20, 55);
    
    // Instructions (only show at start)
    if (currentTime < 5000 && !gameWon) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('← → to move, Space to jump', canvas.width / 2, 50);
        ctx.fillText('Reach the GREEN GOAL!', canvas.width / 2, 75);
    }
    
    // Win message
    if (gameWon) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '18px Arial';
        ctx.fillText(`Time: ${Math.floor(currentTime / 1000)}s | Deaths: ${deathCount}`, canvas.width / 2, canvas.height / 2 + 10);
    }
}

// Toggle pause
function togglePause() {
    gamePaused = !gamePaused;
    const pauseScreen = document.getElementById('pause-screen');
    if (pauseScreen) {
        if (gamePaused) {
            pauseScreen.classList.remove('hidden');
        } else {
            pauseScreen.classList.add('hidden');
        }
    }
}

// Play sounds
function playJumpSound() {
    if (typeof SoundSystem !== 'undefined') {
        SoundSystem.play('jump');
    }
}

// Start game
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        startTime = Date.now();
        lastTime = startTime;
        gameLoop();
    }
}

// Reset game
function resetGame() {
    deathCount = 0;
    gameWon = false;
    currentTime = 0;
    createSimpleLevel();
    createPlayer();
    
    if (typeof saveSystem !== 'undefined') {
        saveSystem.setCheckpoint(player.x, player.y);
    }
}

// Save system integration
let saveSystem;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Start button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const startScreen = document.getElementById('start-screen');
            if (startScreen) startScreen.classList.add('hidden');
            startGame();
        });
    }
    
    // Restart button
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            const deathScreen = document.getElementById('death-screen');
            if (deathScreen) deathScreen.classList.add('hidden');
            resetGame();
            startGame();
        });
    }
    
    // Resume button
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', togglePause);
    }
    
    // Main menu button
    const mainMenuBtn = document.getElementById('main-menu-btn');
    if (mainMenuBtn) {
        mainMenuBtn.addEventListener('click', () => {
            const pauseScreen = document.getElementById('pause-screen');
            const deathScreen = document.getElementById('death-screen');
            const victoryScreen = document.getElementById('victory-screen');
            
            [pauseScreen, deathScreen, victoryScreen].forEach(screen => {
                if (screen) screen.classList.add('hidden');
            });
            
            const startScreen = document.getElementById('start-screen');
            if (startScreen) startScreen.classList.remove('hidden');
            
            gameRunning = false;
            gamePaused = false;
            resetGame();
        });
    }
    
    // Victory screen buttons
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            const victoryScreen = document.getElementById('victory-screen');
            if (victoryScreen) victoryScreen.classList.add('hidden');
            resetGame();
            startGame();
        });
    }
    
    const victoryMainMenuBtn = document.getElementById('victory-main-menu-btn');
    if (victoryMainMenuBtn) {
        victoryMainMenuBtn.addEventListener('click', () => {
            const victoryScreen = document.getElementById('victory-screen');
            if (victoryScreen) victoryScreen.classList.add('hidden');
            
            const startScreen = document.getElementById('start-screen');
            if (startScreen) startScreen.classList.remove('hidden');
            
            gameRunning = false;
            gamePaused = false;
            resetGame();
        });
    }
    
    // Save/Load buttons
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (typeof saveSystem !== 'undefined') {
                saveSystem.saveGame({
                    player: { x: player.x, y: player.y },
                    stats: { deathCount, currentTime },
                    achievements
                });
                alert('Game saved!');
            }
        });
    }
    
    const loadBtn = document.getElementById('load-btn');
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            if (typeof saveSystem !== 'undefined') {
                const saved = saveSystem.loadGame();
                if (saved) {
                    player.x = saved.player.x;
                    player.y = saved.player.y;
                    deathCount = saved.stats.deathCount || 0;
                    achievements = saved.achievements || [];
                    alert('Game loaded!');
                } else {
                    alert('No saved game found!');
                }
            }
        });
    }
    
    // Mute button
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            if (typeof SoundSystem !== 'undefined') {
                SoundSystem.toggleMute();
                muteBtn.textContent = SoundSystem.muted ? '🔊' : '🔇';
            }
        });
    }
    
    // Initialize game
    init();
});
