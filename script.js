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

// Player creation
function createPlayer(){
    player={x:50,y:canvas.height-100,width:20,height:30,color:'#000000',velocityX:0,velocityY:0,speed:5,jumpForce:12,isJumping:false,gravity:0.8,maxSpeed:6,friction:0.85,direction:1};
}

// Level creation - simple but challenging like Level Devil
function createSimpleLevel(){
    platforms=[];spikes=[];movingPlatforms=[];particles=[];
    
    // Ground
    platforms.push({x:0,y:canvas.height-40,width:canvas.width,height:40,color:'#333333',type:'ground'});
    
    // Start area
    platforms.push({x:0,y:canvas.height-200,width:200,height:20,color:'#555555',type:'start'});
    
    // Stepping stones path
    const steps=8,stepWidth=80,stepHeight=20,gap=150;
    for(let i=0;i<steps;i++){
        const x=300+(i*gap),y=canvas.height-200-(i*40);
        if(i!==3&&i!==6){
            platforms.push({x:x,y:y,width:stepWidth,height:stepHeight,color:'#555555',type:'step'});
        }
        if(i===2||i===4||i===7){
            spikes.push({x:x+stepWidth/2-15,y:y-25,width:30,height:25,color:'#cc0000',type:'spike'});
        }
    }
    
    // Moving platform section
    platforms.push({x:300,y:canvas.height-320,width:100,height:15,color:'#666666',type:'static'});
    movingPlatforms.push({x:450,y:canvas.height-280,width:80,height:15,color:'#777777',speed:2,direction:1,minX:450,maxX:700,type:'moving'});
    platforms.push({x:750,y:canvas.height-360,width:100,height:15,color:'#666666',type:'static'});
    platforms.push({x:900,y:canvas.height-440,width:120,height:15,color:'#666666',type:'goal_platform'});
    
    // Goal
    goal={x:1050,y:canvas.height-500,width:40,height:60,color:'#00ff00',type:'goal',pulse:0};
    
    // Guard spikes
    spikes.push({x:1000,y:canvas.height-25,width:40,height:25,color:'#cc0000',type:'guard'});
    spikes.push({x:1100,y:canvas.height-25,width:40,height:25,color:'#cc0000',type:'guard'});
}

// Canvas resize
function resizeCanvas(){
    canvas.width=window.innerWidth;canvas.height=window.innerHeight;
    if(player){player.x=Math.min(player.x,canvas.width-player.width);player.y=Math.min(player.y,canvas.height-player.height);}
}

// Touch controls setup
function setupTouchControls(){
    const leftBtn=document.getElementById('left-btn'),rightBtn=document.getElementById('right-btn'),jumpBtn=document.getElementById('jump-btn');
    if(!leftBtn||!rightBtn||!jumpBtn)return;
    
    // Helper function to prevent default touch behavior
    const preventDefaults=(e)=>{e.preventDefault();e.stopPropagation();};
    
    // Left button
    const setupButton=(btn,control)=>{
        // Touch events with better handling
        btn.addEventListener('touchstart',(e)=>{preventDefaults(e);touchControls[control]=true;btn.classList.add('active')},{passive:false});
        btn.addEventListener('touchend',(e)=>{preventDefaults(e);touchControls[control]=false;btn.classList.remove('active')},{passive:false});
        btn.addEventListener('touchcancel',(e)=>{preventDefaults(e);touchControls[control]=false;btn.classList.remove('active')},{passive:false});
        
        // Mouse events for desktop testing
        btn.addEventListener('mousedown',(e)=>{preventDefaults(e);touchControls[control]=true;btn.classList.add('active')});
        btn.addEventListener('mouseup',(e)=>{preventDefaults(e);touchControls[control]=false;btn.classList.remove('active')});
        btn.addEventListener('mouseleave',(e)=>{preventDefaults(e);touchControls[control]=false;btn.classList.remove('active')});
        
        // Prevent context menu
        btn.addEventListener('contextmenu',(e)=>e.preventDefault());
    };
    
    setupButton(leftBtn,'left');
    setupButton(rightBtn,'right');
    
    // Jump button with special handling
    jumpBtn.addEventListener('touchstart',(e)=>{preventDefaults(e);if(!player.isJumping){touchControls.up=true;setTimeout(()=>{touchControls.up=false},100)}},{passive:false});
    jumpBtn.addEventListener('touchend',(e)=>{preventDefaults(e);touchControls.up=false},{passive:false});
    jumpBtn.addEventListener('touchcancel',(e)=>{preventDefaults(e);touchControls.up=false},{passive:false});
    
    jumpBtn.addEventListener('mousedown',(e)=>{preventDefaults(e);if(!player.isJumping){touchControls.up=true;setTimeout(()=>{touchControls.up=false},100)}});
    jumpBtn.addEventListener('mouseup',(e)=>{preventDefaults(e);touchControls.up=false});
    jumpBtn.addEventListener('mouseleave',(e)=>{preventDefaults(e);touchControls.up=false});
    jumpBtn.addEventListener('contextmenu',(e)=>e.preventDefault());
    
    // Debug mobile controls
    console.log('Mobile controls initialized');
    if(!/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
        console.log('Desktop detected - mobile controls may not be visible');
    }
}

// Keyboard controls
function setupKeyboardControls(){
    // Handle keydown events
    document.addEventListener('keydown',(e)=>{
        const key=e.code.toLowerCase();
        if(key==='arrowleft'||key==='keya'){keys.left=true;e.preventDefault();}
        if(key==='arrowright'||key==='keyd'){keys.right=true;e.preventDefault();}
        if((key==='arrowup'||key==='keyw'||key==='space')&&!player.isJumping){keys.up=true;setTimeout(()=>{keys.up=false},100);e.preventDefault();}
        if(key==='escape'){togglePause();e.preventDefault();}
    });
    
    // Handle keyup events
    document.addEventListener('keyup',(e)=>{
        const key=e.code.toLowerCase();
        if(key==='arrowleft'||key==='keya'){keys.left=false;e.preventDefault();}
        if(key==='arrowright'||key==='keyd'){keys.right=false;e.preventDefault();}
    });
    
    // Add debug toggle (press D to enable debug logging)
    document.addEventListener('keydown',(e)=>{
        if(e.code==='KeyD' && e.shiftKey){window.debugMode=!window.debugMode;console.log('Debug mode:',window.debugMode);}
    });
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
}

// Player update
function updatePlayer(){
    // Horizontal movement
    if(keys.left||touchControls.left){player.velocityX=-player.speed;player.direction=-1;}
    else if(keys.right||touchControls.right){player.velocityX=player.speed;player.direction=1;}
    else{player.velocityX*=player.friction;if(Math.abs(player.velocityX)<0.1)player.velocityX=0;}
    
    // Jump
    if((keys.up||touchControls.up)&&!player.isJumping){player.velocityY=-player.jumpForce;player.isJumping=true;playJumpSound();}
    
    // Physics
    player.velocityY+=player.gravity;
    player.x+=player.velocityX;player.y+=player.velocityY;
    
    // Boundaries
    if(player.x<0)player.x=0;
    if(player.x+player.width>canvas.width)player.x=canvas.width-player.width;
    
    // Death check
    if(player.y>canvas.height+100){playerDie();}
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
            if(player.velocityY>0&&player.y+player.height-player.velocityY<=platform.y+5){
                player.y=platform.y-player.height;player.velocityY=0;player.isJumping=false;onGround=true;
                if(typeof SoundSystem!=='undefined'){SoundSystem.play('landing');}
            }
            else if(player.velocityY<0&&player.y-player.velocityY>=platform.y+platform.height-5){
                player.y=platform.y+platform.height;player.velocityY=0;
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

// Win condition
function checkWinCondition(){
    if(goal&&rectCollide(player,goal)&&!gameWon){gameWon=true;showVictoryScreen();}
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
        
        // Respawn player
        player.x=50;player.y=canvas.height-100;player.velocityX=0;player.velocityY=0;player.isJumping=false;
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
function startGame(){if(!gameRunning){gameRunning=true;gamePaused=false;startTime=Date.now();lastTime=startTime;gameLoop();}}
function resetGame(){deathCount=0;gameWon=false;currentTime=0;createSimpleLevel();createPlayer();if(typeof saveSystem!=='undefined'){saveSystem.setCheckpoint(player.x,player.y);}}

// Initialize on load
document.addEventListener('DOMContentLoaded',()=>{
    // Debug information
    const isMobile=/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('Device detected:',isMobile ? 'Mobile' : 'Desktop');
    
    // Add canvas focus for keyboard input
    const canvas=document.getElementById('gameCanvas');
    if(canvas){canvas.setAttribute('tabindex', '0');}
    
    // Debug mobile controls
    const mobileControls=document.getElementById('mobile-controls');
    if(mobileControls){console.log('Mobile controls element found');}else{console.log('Mobile controls element NOT found');}
    
    // Start button
    const startBtn=document.getElementById('start-btn');
    if(startBtn){startBtn.addEventListener('click',()=>{
        console.log('Start button clicked');
        const startScreen=document.getElementById('start-screen');
        if(startScreen)startScreen.classList.add('hidden');
        startGame(); 
        if(canvas)canvas.focus();
    });}
    
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
    init();
    
    // Add canvas click to focus for keyboard input
    if(canvas){canvas.addEventListener('click',()=>{console.log('Canvas clicked - focusing');canvas.focus();});}
    
    // Prevent default touch behaviors that might interfere
    document.addEventListener('touchstart',(e)=>{if(e.target.tagName!=='BUTTON' && e.target.tagName!=='CANVAS'){e.preventDefault();}},{passive:false});
    document.addEventListener('touchmove',(e)=>{if(e.target.tagName!=='BUTTON' && e.target.tagName!=='CANVAS'){e.preventDefault();}},{passive:false});
    
    // Auto-focus canvas when game starts
    setTimeout(()=>{if(canvas && gameRunning){console.log('Auto-focusing canvas');canvas.focus();}},200);
});
