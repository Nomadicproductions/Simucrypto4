// Platformer Game Engine for Crypto Simulator
class PlatformerGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.level = 1;
        this.coins = [];
        this.platforms = [];
        this.enemies = [];
        
        // Player
        this.player = {
            x: 50,
            y: 300,
            width: 30,
            height: 30,
            velocityX: 0,
            velocityY: 0,
            speed: 5,
            jumpPower: 15,
            onGround: false,
            color: '#FFD700'
        };
        
        // Controls
        this.keys = {};
        this.setupControls();
        
        // Initialize level
        this.initLevel();
        
        // Game loop
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    initLevel() {
        // Reset arrays
        this.coins = [];
        this.platforms = [];
        this.enemies = [];
        
        // Ground platform
        this.platforms.push({
            x: 0,
            y: 350,
            width: 800,
            height: 50,
            color: '#8B4513'
        });
        
        // Level-specific platforms
        if (this.level === 1) {
            this.platforms.push(
                { x: 200, y: 280, width: 100, height: 20, color: '#654321' },
                { x: 400, y: 220, width: 100, height: 20, color: '#654321' },
                { x: 600, y: 160, width: 100, height: 20, color: '#654321' }
            );
            
            // Coins
            this.coins.push(
                { x: 230, y: 250, width: 20, height: 20, collected: false, type: 'NeuraX' },
                { x: 430, y: 190, width: 20, height: 20, collected: false, type: 'Solvex' },
                { x: 630, y: 130, width: 20, height: 20, collected: false, type: 'CoreChain' }
            );
        } else if (this.level === 2) {
            this.platforms.push(
                { x: 150, y: 300, width: 80, height: 20, color: '#654321' },
                { x: 300, y: 250, width: 80, height: 20, color: '#654321' },
                { x: 450, y: 200, width: 80, height: 20, color: '#654321' },
                { x: 600, y: 150, width: 80, height: 20, color: '#654321' }
            );
            
            this.coins.push(
                { x: 170, y: 270, width: 20, height: 20, collected: false, type: 'NeuraX' },
                { x: 320, y: 220, width: 20, height: 20, collected: false, type: 'Solvex' },
                { x: 470, y: 170, width: 20, height: 20, collected: false, type: 'CoreChain' },
                { x: 620, y: 120, width: 20, height: 20, collected: false, type: 'NeuraX' }
            );
        }
        
        // Reset player position
        this.player.x = 50;
        this.player.y = 300;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Player movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.velocityX = -this.player.speed;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.velocityX = this.player.speed;
        } else {
            this.player.velocityX *= 0.8; // Friction
        }
        
        if ((this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Space']) && this.player.onGround) {
            this.player.velocityY = -this.player.jumpPower;
            this.player.onGround = false;
        }
        
        // Apply gravity
        this.player.velocityY += 0.8;
        
        // Update player position
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // Screen boundaries
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) {
            this.player.x = this.canvas.width - this.player.width;
        }
        
        // Platform collision
        this.player.onGround = false;
        for (let platform of this.platforms) {
            if (this.checkCollision(this.player, platform)) {
                if (this.player.velocityY > 0 && this.player.y < platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.onGround = true;
                }
            }
        }
        
        // Coin collection
        for (let coin of this.coins) {
            if (!coin.collected && this.checkCollision(this.player, coin)) {
                coin.collected = true;
                this.score += 10;
                
                // Add to bank account based on coin type
                const accountData = JSON.parse(localStorage.getItem('cryptosimBankAccount') || "null");
                if (accountData) {
                    accountData.balance += 5; // $5 per coin
                    localStorage.setItem('cryptosimBankAccount', JSON.stringify(accountData));
                    
                    // Update bank display if visible
                    if (document.getElementById('bank').style.display !== 'none') {
                        window.showBankAccountPage(accountData);
                    }
                }
            }
        }
        
        // Check level completion
        if (this.coins.every(coin => coin.collected)) {
            this.level++;
            if (this.level > 2) {
                this.gameState = 'gameOver';
            } else {
                this.initLevel();
            }
        }
        
        // Check if player fell off screen
        if (this.player.y > this.canvas.height) {
            this.gameState = 'gameOver';
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'menu') {
            this.renderMenu();
        } else if (this.gameState === 'playing') {
            this.renderGame();
        } else if (this.gameState === 'gameOver') {
            this.renderGameOver();
        }
    }
    
    renderMenu() {
        this.ctx.fillStyle = '#000';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Crypto Platformer', this.canvas.width / 2, 150);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Collect crypto coins and earn real money!', this.canvas.width / 2, 200);
        this.ctx.fillText('Use Arrow Keys or WASD to move', this.canvas.width / 2, 240);
        this.ctx.fillText('Press Space to start', this.canvas.width / 2, 280);
        
        if (this.keys['Space']) {
            this.gameState = 'playing';
        }
    }
    
    renderGame() {
        // Render platforms
        for (let platform of this.platforms) {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
        
        // Render coins
        for (let coin of this.coins) {
            if (!coin.collected) {
                this.ctx.fillStyle = this.getCoinColor(coin.type);
                this.ctx.beginPath();
                this.ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Coin type label
                this.ctx.fillStyle = '#000';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(coin.type, coin.x + coin.width/2, coin.y - 5);
            }
        }
        
        // Render player
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // UI
        this.ctx.fillStyle = '#000';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Level: ${this.level}`, 10, 55);
        
        // Instructions
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Arrow Keys/WASD: Move | Space: Jump', 10, this.canvas.height - 10);
    }
    
    renderGameOver() {
        this.ctx.fillStyle = '#000';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, 150);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, 200);
        this.ctx.fillText(`You earned $${this.score * 0.5} in your bank account!`, this.canvas.width / 2, 240);
        this.ctx.fillText('Press Space to play again', this.canvas.width / 2, 280);
        
        if (this.keys['Space']) {
            this.resetGame();
        }
    }
    
    getCoinColor(type) {
        switch(type) {
            case 'NeuraX': return '#FF6B6B';
            case 'Solvex': return '#4ECDC4';
            case 'CoreChain': return '#45B7D1';
            default: return '#FFD700';
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    resetGame() {
        this.score = 0;
        this.level = 1;
        this.gameState = 'menu';
        this.initLevel();
    }
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    start() {
        this.gameLoop(0);
    }
}

// Initialize platformer when section is shown
let platformerGame = null;

function initPlatformer() {
    if (!platformerGame) {
        platformerGame = new PlatformerGame('platformerCanvas');
        platformerGame.start();
    }
}

function showPlatformerSection() {
    showSection('platformer');
    setTimeout(initPlatformer, 100);
}
