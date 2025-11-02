// Game variables - optimized for performance
let canvas,ctx,player,platforms=[],spikes=[],movingPlatforms=[],goal,particles=[],deathCount=0,startTime=0,currentTime=0,gameRunning=false,gamePaused=false,lastTime=0,level=1,achievements=[],gameWon=false;
const keys={left:false,right:false,up:false,space:false};
const touchControls={left:false,right:false,up:false};

// Optimized initialization
function init(){
    canvas=document.getElementById('gameCanvas');ctx=canvas.getContext('2d');
    resizeCanvas();window.addEventListener('resize',resizeCanvas);
    createPlayer();createSimpleLevel();setupTouchControls();setupKeyboardControls();setupSaveSystem();
    gameLoop();
}

// Player creation - FIXED JUMP PHYSICS
function createPlayer(){
    player={x:50,y:canvas.height-150,width:20,height:30,color:'#000000',velocityX:0,velocityY:0,speed:8,jumpForce:18,isJumping:false,gravity:0.45,maxSpeed:8,friction:0.85,direction:1};
    console.log('Player created with jumpForce:', player.jumpForce, 'gravity:', player.gravity);
}

// Level creation - IMPROVED for better gameplay
function createSimpleLevel(){
    platforms=[];spikes=[];movingPlatforms=[];particles=[];
    
    // Ground
    platforms.push({x:0,y:canvas.height-40,width:canvas.width,height:40,color:'#333333',type:'ground'});
    
    // START SECTION - Safe starting area
    platforms.push({x:0,y:canvas.height-150,width:200,height:20,color:'#44aa44',type:'start'}); // Start platform (green)
    platforms.push({x:250,y:canvas.height-150,width:120,height:20,color:'#555555',type:'practice1'}); // Easy first jump
    
    // EASY stepping section with smaller gaps
    let currentX = 420;
    let currentY = canvas.height - 150;
    
    // Step 1 - 2
    platforms.push({x:currentX,y:currentY,width:80,height:20,color:'#555555',type:'step1'});
    currentX += 140; // Reduced gap from 120 to 140 for better jump
    
    // Step 2 - 3  
    platforms.push({x:currentX,y:currentY-20,width:80,height:20,color:'#555555',type:'step2'});
    currentX += 140;
    currentY -= 20;
    
    // Step 3 - 4 (with safe spike)
    platforms.push({x:currentX,y:currentY-20,width:80,height:20,color:'#555555',type:'step3'});
    spikes.push({x:currentX+25,y:currentY-45,width:30,height:25,color:'#cc0000',type:'spike'});
    currentX += 140;
    currentY -= 20;
    
    // Step 4 - 5 (bigger gap, but achievable)
    platforms.push({x:currentX,y:currentY-25,width:80,height:20,color:'#555555',type:'step4'});
    currentX += 160; // Slightly bigger gap
    currentY -= 25;
    
    // Step 5 - 6
    platforms.push({x:currentX,y:currentY-25,width:80,height:20,color:'#555555',type:'step5'});
    spikes.push({x:currentX+25,y:currentY-45,width:30,height:25,color:'#cc0000',type:'spike'});
    currentX += 140;
    currentY -= 25;
    
    // Step 6 - 7
    platforms.push({x:currentX,y:currentY-25,width:80,height:20,color:'#555555',type:'step6'});
    currentX += 140;
    currentY -= 25;
    
    // Step 7 - 8 (final step before goal)
    platforms.push({x:currentX,y:currentY-25,width:80,height:20,color:'#555555',type:'step7'});
    currentX += 160;
    currentY -= 25;
    
    // Step 8 - 9 (goal platform)
    platforms.push({x:currentX,y:currentY-25,width:100,height:20,color:'#666666',type:'goal_platform'});
    
    // Goal - IMPROVED positioning for accessibility
    const goalPlatform = platforms.find(p => p.type === 'goal_platform');
    if(goalPlatform){
        goal={x:goalPlatform.x + goalPlatform.width/2 - 20,y:goalPlatform.y - 70,width:40,height:60,color:'#00ff00',type:'goal',pulse:0};
    }else{
        goal={x:800,y:canvas.height-400,width:40,height:60,color:'#00ff00',type:'goal',pulse:0};
    }
    
    // Ground guard spikes (bottom of screen)
    spikes.push({x:600,y:canvas.height-25,width:40,height:25,color:'#cc0000',type:'guard'});
    spikes.push({x:900,y:canvas.height-25,width:40,height:25,color:'#cc0000',type:'guard'});
    
    console.log('Level created with goal at:', goal.x, goal.y);
}

// Canvas resize
function resizeCanvas(){
    canvas.width=window.innerWidth;canvas.height=window.innerHeight;
    if(player){player.x=Math.min(player.x,canvas.width-player.width);player.y=Math.min(player.y,canvas.height-player.height);}
}

// Touch controls setup - FIXED for better responsiveness
function setupTouchControls(){
    const leftBtn=document.getElementById('left-btn'),rightBtn=document.getElementById('right-btn'),jumpBtn=document.getElementById('jump-btn');
    if(!leftBtn||!rightBtn||!jumpBtn){
        console.error('Mobile buttons not found!');
        return;
    }
    
    console.log('Setting up mobile controls...');
    
    // Helper function to prevent default touch behavior
    const preventDefaults=(e)=>{e.preventDefault();e.stopPropagation();};
    
    // Helper function to set button state
    const setButtonState=(btn,control,active)=>{
        touchControls[control]=active;
        if(active){
            btn.classList.add('active','bg-red-600');
            btn.style.transform='scale(0.95)';
            console.log(`${control} button pressed`);
        }else{
            btn.classList.remove('active','bg-red-600');
            btn.style.transform='scale(1)';
        }
    };
    
    // Setup left button
    const setupButton=(btn,control)=>{
        // Touch events with better handling
        btn.addEventListener('touchstart',(e)=>{
            preventDefaults(e);
            setButtonState(btn,control,true);
        },{passive:false});
        
        btn.addEventListener('touchend',(e)=>{
            preventDefaults(e);
            setButtonState(btn,control,false);
        },{passive:false});
        
        btn.addEventListener('touchcancel',(e)=>{
            preventDefaults(e);
            setButtonState(btn,control,false);
        },{passive:false});
        
        // Mouse events for desktop testing
        btn.addEventListener('mousedown',(e)=>{
            preventDefaults(e);
            setButtonState(btn,control,true);
        });
        
        btn.addEventListener('mouseup',(e)=>{
            preventDefaults(e);
            setButtonState(btn,control,false);
        });
        
        btn.addEventListener('mouseleave',(e)=>{
            preventDefaults(e);
            setButtonState(btn,control,false);
        });
        
        // Prevent context menu
        btn.addEventListener('contextmenu',(e)=>e.preventDefault());
        
        console.log(`${control} button initialized`);
    };
    
    setupButton(leftBtn,'left');
    setupButton(rightBtn,'right');
    
    // Jump button with IMPROVED handling
    const setupJumpButton=(btn)=>{
        const executeJump=()=>{
            console.log('Jump button activated!');
            if(!player.isJumping){
                player.velocityY=-player.jumpForce;
                player.isJumping=true;
                touchControls.up=true;
                setTimeout(()=>{touchControls.up=false},150);
                console.log('Jump executed! VelocityY:', player.velocityY);
                
                // Visual feedback
                btn.style.transform='scale(0.95)';
                setTimeout(()=>{btn.style.transform='scale(1)'},100);
            }else{
                console.log('Already jumping!');
            }
        };
        
        // Touch events
        btn.addEventListener('touchstart',(e)=>{
            preventDefaults(e);
            executeJump();
        },{passive:false});
        
        btn.addEventListener('touchend',(e)=>{
            preventDefaults(e);
            touchControls.up=false;
            btn.style.transform='scale(1)';
        },{passive:false});
        
        btn.addEventListener('touchcancel',(e)=>{
            preventDefaults(e);
            touchControls.up=false;
            btn.style.transform='scale(1)';
        },{passive:false});
        
        // Mouse events for desktop testing
        btn.addEventListener('mousedown',(e)=>{
            preventDefaults(e);
            executeJump();
        });
        
        btn.addEventListener('mouseup',(e)=>{
            preventDefaults(e);
            touchControls.up=false;
            btn.style.transform='scale(1)';
        });
        
        btn.addEventListener('mouseleave',(e)=>{
            preventDefaults(e);
            touchControls.up=false;
            btn.style.transform='scale(1)';
        });
        
        btn.addEventListener('contextmenu',(e)=>e.preventDefault());
        
        console.log('Jump button initialized');
    };
    
    setupJumpButton(jumpBtn);
    
    // Debug mobile controls
    console.log('Mobile controls initialized successfully');
    console.log('Touch controls state:', touchControls);
    
    // Log mobile controls status (removed force display)
    const mobileControls=document.getElementById('mobile-controls');
    if(mobileControls){
        console.log('Mobile controls element found');
        console.log('Mobile controls display style:', window.getComputedStyle(mobileControls).display);
    }else{
        console.error('Mobile controls element NOT found');
    }
}

// Keyboard controls - FIXED
function setupKeyboardControls(){
    // Handle keydown events
    document.addEventListener('keydown',(e)=>{
        const key=e.code.toLowerCase();
        if(key==='arrowleft'||key==='keya'){keys.left=true;e.preventDefault();console.log('Left key pressed');}
        if(key==='arrowright'||key==='keyd'){keys.right=true;e.preventDefault();console.log('Right key pressed');}
        if((key==='arrowup'||key==='keyw'||key==='space')&&!player.isJumping){
            keys.up=true;
            player.velocityY=-player.jumpForce;
            player.isJumping=true;
            setTimeout(()=>{keys.up=false},150);
            console.log('Keyboard jump executed! VelocityY:', player.velocityY);
            e.preventDefault();
        }
        if(key==='escape'){togglePause();e.preventDefault();}
        if(key==='f1'){ // F1 for debug toggle
            const debugInfo = document.getElementById('debug-info');
            if(debugInfo){
                debugInfo.classList.toggle('hidden');
            }
            e.preventDefault();
        }
    });
    
    // Handle keyup events
    document.addEventListener('keyup',(e)=>{
        const key=e.code.toLowerCase();
        if(key==='arrowleft'||key==='keya'){keys.left=false;e.preventDefault();console.log('Left key released');}
        if(key==='arrowright'||key==='keyd'){keys.right=false;e.preventDefault();console.log('Right key released');}
    });
    
    // Add debug toggle (press D to enable debug logging)
    document.addEventListener('keydown',(e)=>{
        if(e.code==='KeyD' && e.shiftKey){window.debugMode=!window.debugMode;console.log('Debug mode:',window.debugMode);}
    });
    
    console.log('Keyboard controls initialized');
}

// Save system setup
function setupSaveSystem(){
    if(typeof saveSystem!=='undefined'){
        const savedData=saveSystem.loadGame();
        if(savedData&&savedData.player){
            player.x=savedData.player.x;player.y=savedData.player.y;
            deathCount=savedData.stats.deathCount||0;
        }
    }
}

// Game loop
function gameLoop(){
    if(!gameRunning)return;
    const now=Date.now(),deltaTime=now-lastTime;lastTime=now;
    if(!gamePaused){update(deltaTime);render();}
    requestAnimationFrame(gameLoop);
    
    // Debug: Check if controls are working
    if(typeof window.debugMode==='undefined'){window.debugMode=false;}
    if(window.debugMode && Math.random()<0.01){
        console.log('Game running:',gameRunning,'Paused:',gamePaused,'Keys:',keys,'Touch:',touchControls);
    }
}

// Update game state
function update(deltaTime){
    updatePlayer();updateMovingPlatforms();updateParticles();
    if(goal)goal.pulse+=deltaTime*0.01;
    checkCollisions();checkWinCondition();
    currentTime=Date.now()-startTime;
    
    // Debug: Log control states periodically
    if(Math.random() < 0.005) { // Every ~200 frames
        console.log('Control States:', {
            keys: {...keys},
            touch: {...touchControls},
            player: {
                x: player.x.toFixed(1),
                y: player.y.toFixed(1),
                velocityY: player.velocityY.toFixed(2),
                isJumping: player.isJumping
            }
        });
    }
}

// Player update - IMPROVED with better physics
function updatePlayer(){
    // Horizontal movement with better controls
    const movingLeft = keys.left || touchControls.left;
    const movingRight = keys.right || touchControls.right;
    
    if(movingLeft){player.velocityX=-player.speed;player.direction=-1;}
    else if(movingRight){player.velocityX=player.speed;player.direction=1;}
    else{
        player.velocityX*=player.friction;
        if(Math.abs(player.velocityX)<0.1)player.velocityX=0;
    }
    
    // Jump - IMPROVED with direct assignment
    const jumpPressed = keys.up || touchControls.up;
    if(jumpPressed && !player.isJumping){
        player.velocityY=-player.jumpForce;
        player.isJumping=true;
        playJumpSound();
        console.log('Jump triggered! VelocityY:', player.velocityY, 'isJumping:', player.isJumping);
        
        // Clear the jump input to prevent double jumps
        setTimeout(()=>{keys.up=false; touchControls.up=false;}, 50);
    }
    
    // Apply gravity
    player.velocityY+=player.gravity;
    
    // Update position
    player.x+=player.velocityX;
    player.y+=player.velocityY;
    
    // Debug position every 2 seconds
    if(Math.random()<0.005){ // Reduced frequency
        console.log('Player status:', {
            x: player.x.toFixed(1),
            y: player.y.toFixed(1), 
            velocityY: player.velocityY.toFixed(2), 
            isJumping: player.isJumping,
            onGround: player.y >= canvas.height - 70 // Near ground
        });
    }
    
    // Update debug info display
    const debugInfo = document.getElementById('debug-info');
    if(debugInfo){
        debugInfo.textContent = `JUMP:${player.jumpForce} | SPD:${player.speed} | Y:${player.velocityY.toFixed(1)}`;
    }
    
    // Boundaries
    if(player.x<0){player.x=0; player.velocityX=0;}
    if(player.x+player.width>canvas.width){player.x=canvas.width-player.width; player.velocityX=0;}
    
    // Death check (fallen off screen)
    if(player.y>canvas.height+100){
        console.log('Player fell off screen, dying...');
        playerDie();
    }
}

// Moving platforms update
function updateMovingPlatforms(){
    movingPlatforms.forEach(platform=>{
        platform.x+=platform.speed*platform.direction;
        if(platform.x<=platform.minX||platform.x+platform.width>=platform.maxX){platform.direction*=-1;}
    });
}

// Particles update
function updateParticles(){
    particles=particles.filter(particle=>{
        particle.x+=particle.velocityX;particle.y+=particle.velocityY;particle.life-=1;particle.size*=0.98;
        return particle.life>0&&particle.size>0.5;
    });
}

// Collision detection
function checkCollisions(){
    let onGround=false;
    
    // Platform collisions
    [...platforms,...movingPlatforms].forEach(platform=>{
        if(rectCollide(player,platform)){
            // Landing on platform (from above)
            if(player.velocityY>0&&player.y+player.height-player.velocityY<=platform.y+5){
                player.y=platform.y-player.height;
                player.velocityY=0;
                player.isJumping=false;
                onGround=true;
                console.log('Landed on platform! isJumping set to false');
                if(typeof SoundSystem!=='undefined'){SoundSystem.play('landing');}
            }
            // Hitting platform from below
            else if(player.velocityY<0&&player.y-player.velocityY>=platform.y+platform.height-5){
                player.y=platform.y+platform.height;
                player.velocityY=0;
                console.log('Hit platform from below!');
            }
            else if(player.velocityX>0){player.x=platform.x-player.width;}
            else if(player.velocityX<0){player.x=platform.x+platform.width;}
        }
    });
    
    // Spike collisions
    spikes.forEach(spike=>{if(rectCollide(player,spike)){playerDie();}});
    
    // Moving platform riding
    if(!onGround){
        movingPlatforms.forEach(platform=>{
            if(player.y+player.height>=platform.y&&player.y+player.height<=platform.y+10&&player.x+player.width>platform.x&&player.x<platform.x+platform.width&&player.velocityY>=0){
                player.y=platform.y-player.height;player.velocityY=0;player.isJumping=false;player.x+=platform.speed*platform.direction*0.5;
            }
        });
    }
}

// Win condition - IMPROVED with debugging
function checkWinCondition(){
    if(goal && !gameWon){
        const playerRect = {x: player.x, y: player.y, width: player.width, height: player.height};
        const goalRect = {x: goal.x, y: goal.y, width: goal.width, height: goal.height};
        
        if(rectCollide(playerRect, goalRect)){
            console.log('WIN! Player collided with goal!');
            gameWon=true;
            showVictoryScreen();
        } else {
            // Debug: Show distance to goal periodically
            if(Math.random() < 0.01){ // Every ~100 frames
                const distanceX = Math.abs(player.x - goal.x);
                const distanceY = Math.abs(player.y - goal.y);
                console.log(`Distance to goal: X=${distanceX.toFixed(1)}, Y=${distanceY.toFixed(1)}`);
            }
        }
    }
}

// Collision helper
function rectCollide(rect1,rect2){
    return rect1.x<rect2.x+rect2.width&&rect1.x+rect1.width>rect2.x&&rect1.y<rect2.y+rect2.height&&rect1.y+rect1.height>rect2.y;
}

// Death
let deathTimeout=null;
function playerDie(){
    deathCount++;stats.totalDeaths++;
    
    if(typeof SoundSystem!=='undefined'){SoundSystem.play('death');}
    
    // Clear any existing death timeout
    if(deathTimeout){clearTimeout(deathTimeout);}
    
    // Blood particles
    for(let i=0;i<15;i++){
        particles.push({x:player.x+player.width/2,y:player.y+player.height/2,velocityX:(Math.random()-0.5)*10,velocityY:(Math.random()-0.5)*10,size:3+Math.random()*5,life:30+Math.random()*20,maxLife:50,color:'#cc0000'});
    }
    
    // Stop game temporarily
    gamePaused=true;
    
    // Update death screen
    const deathCountDisplay=document.getElementById('death-count');
    const deathTimeDisplay=document.getElementById('death-time');
    if(deathCountDisplay)deathCountDisplay.textContent=deathCount;
    if(deathTimeDisplay)deathTimeDisplay.textContent=Math.floor(currentTime/1000)+'s';
    
    // Show death screen immediately
    const deathScreen=document.getElementById('death-screen');
    if(deathScreen){deathScreen.classList.remove('hidden');}
    
    // Enhanced AdSense integration for maximum revenue
    if(typeof adSenseManager!=='undefined'){
        setTimeout(()=>{adSenseManager.showDeathScreenAd();}, 1000);
    }
    
    // Respawn after 1.5 seconds
    deathTimeout=setTimeout(()=>{
        // Hide death screen
        if(deathScreen){deathScreen.classList.add('hidden');}
        
        // Respawn player on start platform
        const startPlatform = platforms.find(p => p.type === 'start');
        if(startPlatform){
            player.x = startPlatform.x + 50;
            player.y = startPlatform.y - player.height;
        }else{
            player.x=50;player.y=canvas.height-150;
        }
        player.velocityX=0;player.velocityY=0;player.isJumping=false;
        console.log('Player died and respawned at:', player.x, player.y);
        if(typeof saveSystem!=='undefined'){saveSystem.setCheckpoint(player.x,player.y);}
        
        // Resume game
        gamePaused=false;
        
        // Focus canvas for controls
        setTimeout(()=>{const canvas=document.getElementById('gameCanvas'); if(canvas)canvas.focus();},100);
    },1500);
}

// Victory screen
function showVictoryScreen(){
    const victoryScreen=document.getElementById('victory-screen');
    const finalTime=Math.floor(currentTime/1000);
    
    document.getElementById('final-time').textContent=finalTime+'s';
    document.getElementById('final-deaths').textContent=deathCount;
    
    if(typeof SoundSystem!=='undefined'){SoundSystem.play('achievement');}
    
    if(!achievements.includes('victory')){achievements.push('victory');}
    if(victoryScreen){victoryScreen.classList.remove('hidden');}
    
    // Enhanced AdSense integration for victory celebration
    if(typeof adSenseManager!=='undefined'){
        setTimeout(()=>{adSenseManager.showVictoryScreenAd();}, 2000);
    }
}

// Rendering
function render(){
    // Clear
    ctx.fillStyle='#1a1a1a';ctx.fillRect(0,0,canvas.width,canvas.height);
    
    // Goal
    if(goal){
        ctx.save();const pulse=Math.sin(goal.pulse)*0.3+0.7;
        ctx.fillStyle=`rgba(0,255,0,${pulse})`;ctx.fillRect(goal.x,goal.y,goal.width,goal.height);
        ctx.shadowColor='#00ff00';ctx.shadowBlur=20;ctx.fillRect(goal.x,goal.y,goal.width,goal.height);ctx.shadowBlur=0;ctx.restore();
        ctx.fillStyle='#ffffff';ctx.font='16px Arial';ctx.textAlign='center';ctx.fillText('GOAL',goal.x+goal.width/2,goal.y-10);
    }
    
    // Platforms
    platforms.forEach(platform=>{ctx.fillStyle=platform.color;ctx.fillRect(platform.x,platform.y,platform.width,platform.height);});
    movingPlatforms.forEach(platform=>{ctx.fillStyle=platform.color;ctx.fillRect(platform.x,platform.y,platform.width,platform.height);});
    
    // Spikes
    spikes.forEach(spike=>{ctx.fillStyle=spike.color;
        ctx.beginPath();ctx.moveTo(spike.x,spike.y+spike.height);ctx.lineTo(spike.x+spike.width/2,spike.y);ctx.lineTo(spike.x+spike.width,spike.y+spike.height);ctx.closePath();ctx.fill();});
    
    // Character
    draw2DCharacter();
    
    // Particles
    particles.forEach(particle=>{const alpha=particle.life/particle.maxLife;ctx.fillStyle=particle.color.replace('cc',Math.floor(alpha*204));ctx.beginPath();ctx.arc(particle.x,particle.y,particle.size,0,Math.PI*2);ctx.fill();});
    
    // UI
    drawUI();
}

// Character drawing
function draw2DCharacter(){
    ctx.save();
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.3)';ctx.beginPath();ctx.ellipse(player.x+player.width/2,player.y+player.height,player.width/2,5,0,0,Math.PI*2);ctx.fill();
    // Body
    ctx.fillStyle='#000000';ctx.fillRect(player.x,player.y+8,player.width,player.height-8);
    // Head
    ctx.fillStyle='#000000';ctx.beginPath();ctx.arc(player.x+player.width/2,player.y+6,8,0,Math.PI*2);ctx.fill();
    // Eyes
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(player.x+player.width/2-3,player.y+4,1.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(player.x+player.width/2+3,player.y+4,1.5,0,Math.PI*2);ctx.fill();
    ctx.restore();
}

// UI rendering
function drawUI(){
    ctx.fillStyle='#ffffff';ctx.font='20px Arial';ctx.textAlign='left';
    ctx.fillText(`Deaths: ${deathCount}`,20,30);
    const timeSeconds=Math.floor(currentTime/1000);ctx.fillText(`Time: ${timeSeconds}s`,20,55);
    
    if(currentTime<5000&&!gameWon){
        ctx.fillStyle='#ffffff';ctx.font='16px Arial';ctx.textAlign='center';
        ctx.fillText('← → to move, Space to jump',canvas.width/2,50);
        ctx.fillText('Reach the GREEN GOAL!',canvas.width/2,75);
    }
    
    if(gameWon){
        ctx.fillStyle='#00ff00';ctx.font='32px Arial';ctx.textAlign='center';
        ctx.fillText('YOU WIN!',canvas.width/2,canvas.height/2-20);
        ctx.font='18px Arial';
        ctx.fillText(`Time: ${Math.floor(currentTime/1000)}s | Deaths: ${deathCount}`,canvas.width/2,canvas.height/2+10);
    }
}

// Controls
function togglePause(){gamePaused=!gamePaused;const pauseScreen=document.getElementById('pause-screen');if(pauseScreen){if(gamePaused){pauseScreen.classList.remove('hidden')}else{pauseScreen.classList.add('hidden')}}}
function playJumpSound(){if(typeof SoundSystem!=='undefined'){SoundSystem.play('jump');}}
function startGame(){
    console.log('startGame called. Current gameRunning:', gameRunning);
    if(!gameRunning){
        gameRunning=true;gamePaused=false;startTime=Date.now();lastTime=startTime;
        console.log('Game started successfully!');
        // Focus canvas for keyboard controls
        setTimeout(()=>{
            const canvas=document.getElementById('gameCanvas');
            if(canvas){canvas.focus();console.log('Canvas focused for keyboard input');}
        },100);
        gameLoop();
    }else{
        console.log('Game is already running');
    }
}
function resetGame(){
    console.log('resetGame called');
    deathCount=0;gameWon=false;currentTime=0;createSimpleLevel();createPlayer();
    // Place player on start platform
    const startPlatform = platforms.find(p => p.type === 'start');
    if(startPlatform){
        player.x = startPlatform.x + 50; // Place on start platform
        player.y = startPlatform.y - player.height;
        player.velocityY = 0;
        player.isJumping = false;
        console.log('Player respawned at:', player.x, player.y);
    }
    if(typeof saveSystem!=='undefined'){saveSystem.setCheckpoint(player.x,player.y);}
}

// Initialize on load
document.addEventListener('DOMContentLoaded',()=>{
    // Debug information
    const isMobile=/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('Device detected:',isMobile ? 'Mobile' : 'Desktop');
    console.log('DOM loaded, starting initialization...');
    
    // Add canvas focus for keyboard input
    const canvas=document.getElementById('gameCanvas');
    if(canvas){
        canvas.setAttribute('tabindex', '0');
        console.log('Canvas found and configured for keyboard input');
    }else{
        console.error('Canvas not found!');
    }
    
    // Enhanced debug for mobile controls
    const mobileControls=document.getElementById('mobile-controls');
    if(mobileControls){
        console.log('Mobile controls element found');
        console.log('Left button:', document.getElementById('left-btn'));
        console.log('Right button:', document.getElementById('right-btn'));
        console.log('Jump button:', document.getElementById('jump-btn'));
    }else{
        console.error('Mobile controls element NOT found');
    }
    
    // Start button - FIXED
    const startBtn=document.getElementById('start-btn');
    if(startBtn){
        console.log('Start button found, adding event listener');
        startBtn.addEventListener('click',(e)=>{
            e.preventDefault();
            console.log('Start button clicked! Hiding start screen and starting game');
            const startScreen=document.getElementById('start-screen');
            if(startScreen){
                startScreen.classList.add('hidden');
                console.log('Start screen hidden');
            }
            startGame(); 
            if(canvas){
                canvas.focus();
                console.log('Canvas focused for keyboard controls');
            }
        });
        console.log('Start button event listener added successfully');
    }else{
        console.error('Start button not found!');
    }
    
    // Retry button (death screen)
    const retryBtn=document.getElementById('retry-btn');
    if(retryBtn){retryBtn.addEventListener('click',()=>{
        console.log('Retry button clicked');
        const deathScreen=document.getElementById('death-screen');
        if(deathScreen)deathScreen.classList.add('hidden');
        resetGame();startGame();
        if(canvas)canvas.focus();
    });}
    
    // Pause button
    const pauseBtn=document.getElementById('pause-btn');
    if(pauseBtn){pauseBtn.addEventListener('click',()=>{console.log('Pause button clicked');togglePause();});}
    
    // Resume button
    const resumeBtn=document.getElementById('resume-btn');
    if(resumeBtn){resumeBtn.addEventListener('click',()=>{console.log('Resume button clicked');togglePause(); if(canvas)canvas.focus();});}
    
    // Give up button
    const quitBtn=document.getElementById('quit-btn');
    if(quitBtn){quitBtn.addEventListener('click',()=>{
        console.log('Quit button clicked');
        const pauseScreen=document.getElementById('pause-screen');
        if(pauseScreen)pauseScreen.classList.add('hidden');
        const startScreen=document.getElementById('start-screen');
        if(startScreen)startScreen.classList.remove('hidden');
        gameRunning=false;gamePaused=false;resetGame();
    });}
    
    // Main menu button (multiple locations)
    const mainMenuBtns=['main-menu-btn','victory-main-menu-btn'];
    mainMenuBtns.forEach(btnId=>{
        const mainMenuBtn=document.getElementById(btnId);
        if(mainMenuBtn){mainMenuBtn.addEventListener('click',()=>{
            console.log('Main menu button clicked:',btnId);
            const pauseScreen=document.getElementById('pause-screen'),deathScreen=document.getElementById('death-screen'),victoryScreen=document.getElementById('victory-screen');
            [pauseScreen,deathScreen,victoryScreen].forEach(screen=>{if(screen)screen.classList.add('hidden');});
            const startScreen=document.getElementById('start-screen');if(startScreen)startScreen.classList.remove('hidden');
            gameRunning=false;gamePaused=false;resetGame();
        });}
    });
    
    // Victory screen buttons
    const playAgainBtn=document.getElementById('play-again-btn');
    if(playAgainBtn){playAgainBtn.addEventListener('click',()=>{
        console.log('Play again button clicked');
        const victoryScreen=document.getElementById('victory-screen');
        if(victoryScreen)victoryScreen.classList.add('hidden');
        resetGame();startGame();
        if(canvas)canvas.focus();
    });}
    
    // Save button
    const saveBtn=document.getElementById('save-btn');
    if(saveBtn){saveBtn.addEventListener('click',()=>{
        console.log('Save button clicked');
        if(typeof saveSystem!=='undefined'){
            saveSystem.saveGame({player:{x:player.x,y:player.y},stats:{deathCount,currentTime},achievements});
            alert('Game saved!');
        }
    });}
    
    // Initialize game
    console.log('Calling init()...');
    init();
    console.log('init() completed');
    
    // Add canvas click to focus for keyboard input
    if(canvas){canvas.addEventListener('click',()=>{console.log('Canvas clicked - focusing');canvas.focus();});}
    
    // Prevent default touch behaviors that might interfere
    document.addEventListener('touchstart',(e)=>{if(e.target.tagName!=='BUTTON' && e.target.tagName!=='CANVAS'){e.preventDefault();}},{passive:false});
    document.addEventListener('touchmove',(e)=>{if(e.target.tagName!=='BUTTON' && e.target.tagName!=='CANVAS'){e.preventDefault();}},{passive:false});
    
    // Auto-focus canvas when game starts
    setTimeout(()=>{if(canvas && gameRunning){console.log('Auto-focusing canvas');canvas.focus();}},200);
});
