// Game variables - optimized for performance
let canvas, ctx, player, platforms = [], spikes = [], movingPlatforms = [], goal, particles = [], deathCount = 0, startTime = 0, currentTime = 0, gameRunning = false, gamePaused = false, lastTime = 0, level = 1, achievements = [], gameWon = false;
const keys = { left: false, right: false, up: false, space: false };
const touchControls = { left: false, right: false, up: false };

// FIXED: Enhanced initialization
function init() {
    console.log('Game initializing...');
    
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas not found!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Canvas context not available!');
        return;
    }
    
    console.log('Canvas and context found, resizing...');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    createPlayer();
    createSimpleLevel();
    setupTouchControls();
    setupKeyboardControls();
    setupSaveSystem();
    
    console.log('Game initialized successfully!');
    // Start render loop immediately for character visibility
    gameLoop();
}

// FIXED: Enhanced player creation with better visibility
function createPlayer() {
    player = {
        x: 50,
        y: canvas.height - 150,
        width: 25,
        height: 35,
        color: '#000000',
        velocityX: 0,
        velocityY: 0,
        speed: 8,
        jumpForce: 18,
        isJumping: false,
        gravity: 0.45,
        maxSpeed: 8,
        friction: 0.85,
        direction: 1
    };
    console.log('Player created:', player);
}

// FIXED: Enhanced level creation
function createSimpleLevel() {
    platforms = [];
    spikes = [];
    movingPlatforms = [];
    particles = [];
    
    // Ground
    platforms.push({
        x: 0,
        y: canvas.height - 40,
        width: canvas.width,
        height: 40,
        color: '#333333',
        type: 'ground'
    });
    
    // Start platform (green)
    platforms.push({
        x: 50,
        y: canvas.height - 150,
        width: 120,
        height: 20,
        color: '#44aa44',
        type: 'start'
    });
    
    // Practice section
    platforms.push({
        x: 220,
        y: canvas.height - 150,
        width: 80,
        height: 20,
        color: '#555555',
        type: 'practice1'
    });
    
    platforms.push({
        x: 340,
        y: canvas.height - 150,
        width: 80,
        height: 20,
        color: '#555555',
        type: 'practice2'
    });
    
    // Challenge section
    platforms.push({
        x: 480,
        y: canvas.height - 180,
        width: 80,
        height: 20,
        color: '#666666',
        type: 'challenge1'
    });
    
    platforms.push({
        x: 600,
        y: canvas.height - 210,
        width: 80,
        height: 20,
        color: '#666666',
        type: 'challenge2'
    });
    
    // More platforms
    platforms.push({
        x: 740,
        y: canvas.height - 180,
        width: 80,
        height: 20,
        color: '#777777',
        type: 'challenge3'
    });
    
    // Goal platform
    platforms.push({
        x: canvas.width - 200,
        y: canvas.height - 150,
        width: 150,
        height: 20,
        color: '#444444',
        type: 'goal-platform'
    });
    
    // Spikes
    spikes.push({
        x: 320,
        y: canvas.height - 60,
        width: 80,
        height: 20,
        color: '#cc0000',
        type: 'guard'
    });
    
    // Goal
    goal = {
        x: canvas.width - 150,
        y: canvas.height - 190,
        width: 30,
        height: 30,
        pulse: 0
    };
    
    console.log('Level created:', { platforms: platforms.length, spikes: spikes.length });
}

// Canvas resize
function resizeCanvas() {
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log('Canvas resized to:', canvas.width, 'x', canvas.height);
    
    if (player) {
        player.x = Math.min(player.x, canvas.width - player.width);
        player.y = Math.min(player.y, canvas.height - player.height);
    }
}

// FIXED: Enhanced touch controls setup
function setupTouchControls() {
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const jumpBtn = document.getElementById('jump-btn');
    
    if (!leftBtn || !rightBtn || !jumpBtn) {
        console.error('Mobile buttons not found!');
        return;
    }
    
    console.log('Setting up mobile controls...');
    
    // Prevent default touch behaviors
    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    // Helper function to set button state
    const setButtonState = (btn, control, active) => {
        touchControls[control] = active;
        if (active) {
            btn.classList.add('active');
            btn.style.transform = 'scale(0.9)';
            console.log(`${control} button pressed`);
        } else {
            btn.classList.remove('active');
            btn.style.transform = 'scale(1)';
        }
    };
    
    // Setup movement buttons
    const setupButton = (btn, control) => {
        // Touch events
        btn.addEventListener('touchstart', (e) => {
            preventDefaults(e);
            setButtonState(btn, control, true);
        }, { passive: false });
        
        btn.addEventListener('touchend', (e) => {
            preventDefaults(e);
            setButtonState(btn, control, false);
        }, { passive: false });
        
        btn.addEventListener('touchcancel', (e) => {
            preventDefaults(e);
            setButtonState(btn, control, false);
        }, { passive: false });
        
        // Mouse events for desktop
        btn.addEventListener('mousedown', (e) => {
            preventDefaults(e);
            setButtonState(btn, control, true);
        });
        
        btn.addEventListener('mouseup', (e) => {
            preventDefaults(e);
            setButtonState(btn, control, false);
        });
        
        btn.addEventListener('mouseleave', (e) => {
            preventDefaults(e);
            setButtonState(btn, control, false);
        });
        
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
        
        console.log(`${control} button initialized`);
    };
    
    setupButton(leftBtn, 'left');
    setupButton(rightBtn, 'right');
    
    // Jump button with enhanced handling
    const setupJumpButton = (btn) => {
        const executeJump = () => {
            console.log('Jump button activated!');
            if (!player.isJumping) {
                player.velocityY = -player.jumpForce;
                player.isJumping = true;
                touchControls.up = true;
                
                // Visual feedback
                btn.style.transform = 'scale(0.9)';
                
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                }, 150);
            }
        };
        
        // Touch events
        btn.addEventListener('touchstart', (e) => {
            preventDefaults(e);
            executeJump();
        }, { passive: false });
        
        // Mouse events for desktop
        btn.addEventListener('mousedown', (e) => {
            preventDefaults(e);
            executeJump();
        });
        
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
        
        console.log('Jump button initialized');
    };
    
    setupJumpButton(jumpBtn);
}

// Enhanced keyboard controls
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                keys.left = true;
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                keys.right = true;
                e.preventDefault();
                break;
            case 'ArrowUp':
            case 'KeyW':
            case 'Space':
                if (!player.isJumping) {
                    player.velocityY = -player.jumpForce;
                    player.isJumping = true;
                }
                keys.up = true;
                keys.space = true;
                e.preventDefault();
                break;
            case 'KeyP':
                togglePause();
                e.preventDefault();
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
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
            case 'KeyW':
            case 'Space':
                keys.up = false;
                keys.space = false;
                break;
        }
    });
}

// FIXED: Game update with better physics
function update(deltaTime) {
    // Handle input
    if (keys.left || touchControls.left) {
        player.velocityX = -player.speed;
        player.direction = -1;
    } else if (keys.right || touchControls.right) {
        player.velocityX = player.speed;
        player.direction = 1;
    } else {
        player.velocityX *= player.friction;
        if (Math.abs(player.velocityX) < 0.1) {
            player.velocityX = 0;
        }
    }
    
    // Apply gravity
    player.velocityY += player.gravity;
    
    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Boundary checking
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    
    // Platform collision
    let onGround = false;
    
    platforms.forEach(platform => {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y) {
            
            // Landing on platform
            if (player.velocityY > 0 && player.y + player.height - player.velocityY <= platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isJumping = false;
                onGround = true;
            }
        }
    });
    
    // Spike collision
    spikes.forEach(spike => {
        if (player.x < spike.x + spike.width &&
            player.x + player.width > spike.x &&
            player.y < spike.y + spike.height &&
            player.y + player.height > spike.y) {
            die();
        }
    });
    
    // Goal collision
    if (goal && 
        player.x < goal.x + goal.width &&
        player.x + player.width > goal.x &&
        player.y < goal.y + goal.height &&
        player.y + player.height > goal.y) {
        winGame();
    }
    
    // Goal pulse animation
    if (goal) {
        goal.pulse += 0.1;
    }
    
    // Update time
    currentTime = Date.now() - startTime;
    
    // Update particles
    particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

// FIXED: Enhanced rendering with character visibility
function render() {
    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Goal
    if (goal) {
        ctx.save();
        const pulse = Math.sin(goal.pulse) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0,255,0,${pulse})`;
        ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 20;
        ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
        ctx.shadowBlur = 0;
        ctx.restore();
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GOAL', goal.x + goal.width / 2, goal.y - 10);
    }
    
    // Platforms
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
    
    movingPlatforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
    
    // Spikes
    spikes.forEach(spike => {
        ctx.fillStyle = spike.color;
        ctx.fillRect(spike.x, spike.y, spike.width, spike.height);
    });
    
    // FIXED: Enhanced character drawing
    if (player) {
        drawCharacter();
    }
    
    // Particles
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    
    // UI
    drawUI();
}

// FIXED: Enhanced character drawing with better visibility
function drawCharacter() {
    if (!player) return;
    
    ctx.save();
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(player.x + player.width / 2, player.y + player.height, player.width / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body - larger and more visible
    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x, player.y + 8, player.width, player.height - 8);
    
    // Head - larger and more visible
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + 6, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes - white with red glow for visibility
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2 - 3, player.y + 4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2 + 3, player.y + 4, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Direction indicator
    if (player.velocityX !== 0) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(player.x + (player.direction > 0 ? player.width - 3 : 0), player.y + 15, 3, 8);
    }
    
    ctx.restore();
}

function drawUI() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    
    const timeSeconds = Math.floor(currentTime / 1000);
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = timeSeconds % 60;
    
    ctx.fillText(`Deaths: ${deathCount}`, 20, 30);
    ctx.fillText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, 55);
    
    if (currentTime < 5000 && !gameWon) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('← → to move, Space to jump', canvas.width / 2, 50);
        ctx.fillText('Reach the GREEN GOAL!', canvas.width / 2, 75);
    }
    
    if (gameWon) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2);
    }
}

// FIXED: Game loop with better control
function gameLoop() {
    if (!gameRunning) {
        // Still render for character visibility
        render();
        requestAnimationFrame(gameLoop);
        return;
    }
    
    const now = Date.now();
    const deltaTime = now - lastTime;
    lastTime = now;
    
    if (!gamePaused) {
        update(deltaTime);
        render();
    }
    
    requestAnimationFrame(gameLoop);
    
    // Debug output (occasionally)
    if (Math.random() < 0.001) {
        console.log('Game running:', gameRunning, 'Player position:', player.x, player.y);
    }
}

// Game control functions
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        startTime = Date.now();
        lastTime = startTime;
        gameLoop();
        console.log('Game started!');
    }
}

function resetGame() {
    deathCount = 0;
    gameWon = false;
    currentTime = 0;
    createSimpleLevel();
    createPlayer();
    
    // Update UI
    document.getElementById('deaths-counter').textContent = 'Deaths: 0';
    document.getElementById('time-counter').textContent = 'Time: 0:00';
}

function die() {
    deathCount++;
    
    // Blood particles
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            color: '#ff0000',
            size: Math.random() * 4 + 2,
            life: 60
        });
    }
    
    // Show death screen
    const deathScreen = document.getElementById('death-screen');
    if (deathScreen) {
        deathScreen.classList.remove('hidden');
    }
    
    // Update UI
    document.getElementById('death-count').textContent = deathCount;
    const timeSeconds = Math.floor(currentTime / 1000);
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = timeSeconds % 60;
    document.getElementById('death-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Show ad if AdSense is loaded
    if (typeof adsManager !== 'undefined') {
        adsManager.showDeathAd();
    }
    
    // Stop game
    gameRunning = false;
}

function winGame() {
    gameWon = true;
    
    // Victory particles
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: goal.x + goal.width / 2,
            y: goal.y + goal.height / 2,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            color: ['#00ff00', '#ffff00', '#ffffff'][Math.floor(Math.random() * 3)],
            size: Math.random() * 6 + 3,
            life: 120
        });
    }
    
    // Show victory screen
    const victoryScreen = document.getElementById('victory-screen');
    if (victoryScreen) {
        victoryScreen.classList.remove('hidden');
    }
    
    // Update UI
    const timeSeconds = Math.floor(currentTime / 1000);
    document.getElementById('final-time').textContent = timeSeconds;
    document.getElementById('final-deaths').textContent = deathCount;
    
    // Show ad if AdSense is loaded
    if (typeof adsManager !== 'undefined') {
        adsManager.showVictoryAd();
    }
    
    // Stop game
    gameRunning = false;
}

function togglePause() {
    if (gamePaused) {
        gamePaused = false;
        document.getElementById('pause-screen').classList.add('hidden');
    } else {
        gamePaused = true;
        document.getElementById('pause-screen').classList.remove('hidden');
    }
}

// FIXED: Enhanced button event setup
function setupButtonEvents() {
    // Start button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            console.log('Start button clicked');
            const startScreen = document.getElementById('start-screen');
            if (startScreen) startScreen.classList.add('hidden');
            startGame();
            if (canvas) canvas.focus();
            
            // Show home page ad after delay
            setTimeout(() => {
                if (typeof adsManager !== 'undefined') {
                    adsManager.showHomePageAd();
                }
            }, 2000);
        });
    }
    
    // Retry button (death screen)
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            console.log('Retry button clicked');
            const deathScreen = document.getElementById('death-screen');
            if (deathScreen) deathScreen.classList.add('hidden');
            resetGame();
            startGame();
            if (canvas) canvas.focus();
        });
    }
    
    // Pause button
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            console.log('Pause button clicked');
            togglePause();
        });
    }
    
    // Resume button
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            console.log('Resume button clicked');
            togglePause();
        });
    }
    
    // Quit button
    const quitBtn = document.getElementById('quit-btn');
    if (quitBtn) {
        quitBtn.addEventListener('click', () => {
            console.log('Quit button clicked');
            const pauseScreen = document.getElementById('pause-screen');
            const startScreen = document.getElementById('start-screen');
            if (pauseScreen) pauseScreen.classList.add('hidden');
            if (startScreen) startScreen.classList.remove('hidden');
            gameRunning = false;
            gamePaused = false;
            resetGame();
        });
    }
    
    // Play again button
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            console.log('Play again button clicked');
            const victoryScreen = document.getElementById('victory-screen');
            if (victoryScreen) victoryScreen.classList.add('hidden');
            resetGame();
            startGame();
            if (canvas) canvas.focus();
        });
    }
    
    // Victory main menu button
    const victoryMainMenuBtn = document.getElementById('victory-main-menu-btn');
    if (victoryMainMenuBtn) {
        victoryMainMenuBtn.addEventListener('click', () => {
            console.log('Victory main menu button clicked');
            const victoryScreen = document.getElementById('victory-screen');
            const startScreen = document.getElementById('start-screen');
            if (victoryScreen) victoryScreen.classList.add('hidden');
            if (startScreen) startScreen.classList.remove('hidden');
            gameRunning = false;
            gamePaused = false;
            resetGame();
        });
    }
    
    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            console.log('Save button clicked');
            if (typeof saveSystem !== 'undefined') {
                saveSystem.saveGame({
                    player: { x: player.x, y: player.y },
                    stats: { deathCount, currentTime },
                    achievements
                });
            }
        });
    }
}

// Save system placeholder
let saveSystem = {
    saveGame: function(data) {
        localStorage.setItem('hellsGauntletSave', JSON.stringify(data));
        console.log('Game saved!', data);
    },
    loadGame: function() {
        const saved = localStorage.getItem('hellsGauntletSave');
        return saved ? JSON.parse(saved) : null;
    }
};

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Device detection
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('Device detected:', isMobile ? 'Mobile' : 'Desktop');
    
    // Add canvas focus for keyboard input
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.setAttribute('tabindex', '0');
    }
    
    // Setup all button events
    setupButtonEvents();
    
    // Initialize game
    init();
    
    // Add canvas click to focus for keyboard input
    if (canvas) {
        canvas.addEventListener('click', () => {
            console.log('Canvas clicked - focusing');
            canvas.focus();
        });
    }
    
    // Prevent default touch behaviors that might interfere
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchend', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    console.log('Game setup complete!');
});
