// Sound effects using Web Audio API (completely free!)
class SoundEffects {
    constructor() {
        this.audioContext = null;
        this.initialized = false;
    }
    
    init() {
        if (!this.initialized) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        }
    }
    
    // Death sound effect
    playDeath() {
        this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.type = 'sawtooth';
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    // Jump sound effect
    playJump() {
        this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.type = 'square';
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    // Achievement sound
    playAchievement() {
        this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.type = 'sine';
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    // Landing sound
    playLanding() {
        this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.type = 'triangle';
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    // Screen shake sound (subtle)
    playScreenShake() {
        this.init();
        const noise = this.audioContext.createBufferSource();
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const gainNode = this.audioContext.createGain();
        noise.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        noise.buffer = buffer;
        noise.start();
        noise.stop(this.audioContext.currentTime + 0.1);
    }
}

// Save system using localStorage (completely free!)
class SaveSystem {
    constructor() {
        this.saveKey = 'hellsGauntletSave';
        this.loadGame();
    }
    
    // Save game state
    saveGame() {
        const saveData = {
            deathCount: deathCount,
            totalDeaths: stats.totalDeaths,
            longestSurvival: stats.longestSurvival,
            bestTime: stats.bestTime,
            achievements: achievements,
            level: level,
            playerPosition: {
                x: player.x,
                y: player.y
            },
            lastPlayed: Date.now(),
            gameSettings: {
                soundEnabled: this.soundEnabled || true,
                difficulty: difficultyMultiplier
            }
        };
        
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
        } catch (e) {
            console.log('Save failed:', e);
        }
    }
    
    // Load game state
    loadGame() {
        try {
            const saved = localStorage.getItem(this.saveKey);
            if (saved) {
                const saveData = JSON.parse(saved);
                deathCount = saveData.deathCount || 0;
                stats.totalDeaths = saveData.totalDeaths || 0;
                stats.longestSurvival = saveData.longestSurvival || 0;
                stats.bestTime = saveData.bestTime || Infinity;
                achievements = saveData.achievements || [];
                level = saveData.level || 1;
                this.soundEnabled = saveData.gameSettings?.soundEnabled !== false;
            }
        } catch (e) {
            console.log('Load failed:', e);
            this.resetGame();
        }
    }
    
    // Reset save
    resetGame() {
        localStorage.removeItem(this.saveKey);
        deathCount = 0;
        stats.totalDeaths = 0;
        stats.longestSurvival = 0;
        stats.bestTime = Infinity;
        achievements = [];
        level = 1;
    }
    
    // Auto-save periodically
    startAutoSave() {
        setInterval(() => {
            if (gameRunning) {
                this.saveGame();
            }
        }, 5000); // Save every 5 seconds
    }
    
    // Checkpoint system
    setCheckpoint(x, y) {
        this.lastCheckpoint = { x, y, timestamp: Date.now() };
    }
    
    getCheckpoint() {
        return this.lastCheckpoint;
    }
}

// Google AdSense integration
class AdManager {
    constructor() {
        this.ads = [];
        this.adCount = 0;
        this.init();
    }
    
    init() {
        // Create ad slots
        this.createAdSlots();
        this.loadAdScript();
    }
    
    loadAdScript() {
        // Replace YOUR_ADSENSE_ID with your actual AdSense publisher ID
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ADSENSE_ID';
        script.crossOrigin = 'anonymous';
        script.async = true;
        document.head.appendChild(script);
    }
    
    createAdSlots() {
        // Create ad slot in death screen
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) {
            const adContainer = document.createElement('div');
            adContainer.id = 'death-ad';
            adContainer.innerHTML = `
                <div class="bg-gray-900 p-4 rounded-lg max-w-sm text-center my-4">
                    <p class="text-yellow-400 font-bold text-sm mb-2">🎮 SUPPORT THE DEVELOPER</p>
                    <div id="adsbygoogle" style="display:block;" data-ad-client="ca-pub-YOUR_ADSENSE_ID" data-ad-slot="YOUR_SLOT_ID" data-ad-format="auto" data-full-width-responsive="true"></div>
                    <p class="text-xs text-gray-400 mt-2">Ad helps keep the game free!</p>
                </div>
            `;
            deathScreen.insertBefore(adContainer, deathScreen.lastElementChild);
        }
        
        // Create banner ad
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            const bannerAd = document.createElement('div');
            bannerAd.id = 'banner-ad';
            bannerAd.className = 'absolute top-16 left-0 right-0 z-10 flex justify-center';
            bannerAd.innerHTML = `
                <div class="bg-black bg-opacity-80 p-2 rounded">
                    <div id="adsbygoogle" style="display:block;" data-ad-client="ca-pub-YOUR_ADSENSE_ID" data-ad-slot="YOUR_BANNER_SLOT_ID" data-ad-format="auto" data-full-width-responsive="true"></div>
                </div>
            `;
            gameContainer.insertBefore(bannerAd, gameContainer.firstChild);
        }
    }
    
    // Show interstitial ad after certain deaths
    maybeShowInterstitial() {
        this.adCount++;
        if (this.adCount % 5 === 0) { // Show every 5 deaths
            this.showInterstitial();
        }
    }
    
    showInterstitial() {
        // This would require a more complex implementation
        // For now, we'll just use banner and inline ads
        console.log('Ad would be shown here');
    }
    
    // Track ad performance
    trackAdImpression(adSlot) {
        if (window.adsbygoogle) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
    }
}

// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.startMonitoring();
    }
    
    startMonitoring() {
        setInterval(() => {
            const currentTime = performance.now();
            const deltaTime = currentTime - this.lastTime;
            this.fps = Math.round((this.frameCount / deltaTime) * 1000);
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // Adaptive quality based on FPS
            if (this.fps < 30) {
                this.reduceQuality();
            }
        }, 1000);
    }
    
    reduceQuality() {
        // Reduce particle count if FPS is low
        if (particles.length > 20) {
            particles = particles.slice(0, 20);
        }
        
        // Reduce glow effects
        ctx.shadowBlur = 0;
    }
}

// Global instances
let soundEffects = new SoundEffects();
let saveSystem = new SaveSystem();
let adManager = new AdManager();
let performanceMonitor = new PerformanceMonitor();