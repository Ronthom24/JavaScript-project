$(document).ready(function() {
    // Game variables
    let gameRunning = false;
    let score = 0;
    let lives = 3;
    let level = 1;
    let playerSpeed = 5;
    let bulletSpeed = 8;
    let enemySpeed = 1;
    let enemySpawnRate = 3000;
    let powerupSpawnRate = 5000;
    let gameLoopId = null;
    let enemySpawnLoopId = null;
    let powerupSpawnLoopId = null;
    
    // Game elements
    let $gameCanvas = $('#game-canvas');
    let $player = null;
    let bullets = [];
    let enemies = [];
    let enemyBullets = [];
    let powerups = [];
    let explosions = [];
    
    // Player position
    let playerX = 0;
    let playerY = 0;
    
    // Input handling
    let keys = {};
    let lastShot = 0;
    let shotCooldown = 200; // milliseconds
    
    // Initialize game
    function initGame() {
        createPlayer();
        setupEventListeners();
        updateScore();
        updateLives();
        updateLevel();
    }
    
    // Create player ship
    function createPlayer() {
        $player = $('<div class="player"></div>');
        $gameCanvas.append($player);
        
        // Position player at bottom center
        playerX = $gameCanvas.width() / 2 - 20;
        playerY = $gameCanvas.height() - 60;
        updatePlayerPosition();
    }
    
    // Update player position
    function updatePlayerPosition() {
        if ($player) {
            $player.css({
                left: playerX + 'px',
                top: playerY + 'px'
            });
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Keyboard events
        $(document).on('keydown', function(e) {
            keys[e.key.toLowerCase()] = true;
            
            // Prevent default for game keys
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
        
        $(document).on('keyup', function(e) {
            keys[e.key.toLowerCase()] = false;
        });
        
        // Button events
        $('#start-button').on('click', startGame);
        $('#restart-button').on('click', restartGame);
    }
    
    // Start game
    function startGame() {
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }
        if (enemySpawnLoopId) {
            clearTimeout(enemySpawnLoopId);
            enemySpawnLoopId = null;
        }
        if (powerupSpawnLoopId) {
            clearTimeout(powerupSpawnLoopId);
            powerupSpawnLoopId = null;
        }

        gameRunning = true;
        score = 0;
        lives = 3;
        level = 1;
        enemySpeed = 1;
        enemySpawnRate = 3000;
        
        updateScore();
        updateLives();
        updateLevel();
        
        $('#game-overlay').hide();
        
        // Start game loops
        gameLoop();
        enemySpawnLoop();
        powerupSpawnLoop();
    }
    
    // Restart game
    function restartGame() {
        // Stop all game loops
        gameRunning = false;
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }
        if (enemySpawnLoopId) {
            clearTimeout(enemySpawnLoopId);
            enemySpawnLoopId = null;
        }
        if (powerupSpawnLoopId) {
            clearTimeout(powerupSpawnLoopId);
            powerupSpawnLoopId = null;
        }

        // Remove all existing game elements
        if ($player) {
            $player.remove();
            $player = null;
        }
        clearGame();
        
        // Start fresh game
        initGame();
        startGame();
    }
    
    // Clear all game elements
    function clearGame() {
        bullets.forEach(bullet => bullet.element.remove());
        enemies.forEach(enemy => enemy.element.remove());
        enemyBullets.forEach(bullet => bullet.element.remove());
        powerups.forEach(powerup => powerup.element.remove());
        explosions.forEach(explosion => explosion.remove());
        
        bullets = [];
        enemies = [];
        enemyBullets = [];
        powerups = [];
        explosions = [];
    }
    
    // Game over
    function gameOver() {
        gameRunning = false;
        
        // Stop all game loops
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }
        if (enemySpawnLoopId) {
            clearTimeout(enemySpawnLoopId);
            enemySpawnLoopId = null;
        }
        if (powerupSpawnLoopId) {
            clearTimeout(powerupSpawnLoopId);
            powerupSpawnLoopId = null;
        }

        $('#overlay-title').text('Game Over!');
        $('#overlay-message').text('Your final score: ' + score);
        $('#start-button').hide();
        $('#restart-button').show();
        $('#game-overlay').show();
    }
    
    // Main game loop
    function gameLoop() {
        if (!gameRunning) return;
        
        handleInput();
        updateBullets();
        updateEnemies();
        updateEnemyBullets();
        updatePowerups();
        checkCollisions();
        
        gameLoopId = requestAnimationFrame(gameLoop);
    }
    
    // Handle player input
    function handleInput() {
        // Movement
        if (keys['w'] || keys['arrowup']) {
            playerY = Math.max(0, playerY - playerSpeed);
        }
        if (keys['s'] || keys['arrowdown']) {
            playerY = Math.min($gameCanvas.height() - 40, playerY + playerSpeed);
        }
        if (keys['a'] || keys['arrowleft']) {
            playerX = Math.max(0, playerX - playerSpeed);
        }
        if (keys['d'] || keys['arrowright']) {
            playerX = Math.min($gameCanvas.width() - 40, playerX + playerSpeed);
        }
        
        updatePlayerPosition();
        
        // Shooting
        if ((keys[' '] || keys['space']) && Date.now() - lastShot > shotCooldown) {
            shoot();
            lastShot = Date.now();
        }
    }
    
    // Player shooting
    function shoot() {
        const bullet = $('<div class="bullet"></div>');
        $gameCanvas.append(bullet);
        
        const bulletX = playerX + 18; // Center of player
        const bulletY = playerY - 10;
        
        bullet.css({
            left: bulletX + 'px',
            top: bulletY + 'px'
        });
        
        bullets.push({
            element: bullet,
            x: bulletX,
            y: bulletY
        });
    }
    
    // Update bullets
    function updateBullets() {
        bullets.forEach((bullet, index) => {
            bullet.y -= bulletSpeed;
            bullet.element.css('top', bullet.y + 'px');
            
            // Remove bullets that go off screen
            if (bullet.y < -20) {
                bullet.element.remove();
                bullets.splice(index, 1);
            }
        });
    }
    
    // Enemy spawn loop
    function enemySpawnLoop() {
        if (!gameRunning) return;
        
        spawnEnemy();
        
        enemySpawnLoopId = setTimeout(enemySpawnLoop, enemySpawnRate);
    }
    
    // Spawn enemy
    function spawnEnemy() {
        const enemy = $('<div class="enemy"></div>');
        $gameCanvas.append(enemy);
        
        const enemyX = Math.random() * ($gameCanvas.width() - 30);
        const enemyY = -30;
        
        enemy.css({
            left: enemyX + 'px',
            top: enemyY + 'px'
        });
        
        enemies.push({
            element: enemy,
            x: enemyX,
            y: enemyY,
            health: 1,
            lastShot: 0
        });
    }
    
    // Update enemies
    function updateEnemies() {
        enemies.forEach((enemy, index) => {
            enemy.y += enemySpeed;
            enemy.element.css('top', enemy.y + 'px');
            
            // Enemy shooting
            if (Date.now() - enemy.lastShot > 2000 && Math.random() < 0.01) {
                enemyShoot(enemy);
                enemy.lastShot = Date.now();
            }
            
            // Remove enemies that go off screen
            if (enemy.y > $gameCanvas.height()) {
                enemy.element.remove();
                enemies.splice(index, 1);
                loseLife();
            }
        });
    }
    
    // Enemy shooting
    function enemyShoot(enemy) {
        const bullet = $('<div class="enemy-bullet"></div>');
        $gameCanvas.append(bullet);
        
        const bulletX = enemy.x + 13; // Center of enemy
        const bulletY = enemy.y + 30;
        
        bullet.css({
            left: bulletX + 'px',
            top: bulletY + 'px'
        });
        
        enemyBullets.push({
            element: bullet,
            x: bulletX,
            y: bulletY
        });
    }
    
    // Update enemy bullets
    function updateEnemyBullets() {
        enemyBullets.forEach((bullet, index) => {
            bullet.y += bulletSpeed;
            bullet.element.css('top', bullet.y + 'px');
            
            // Remove bullets that go off screen
            if (bullet.y > $gameCanvas.height()) {
                bullet.element.remove();
                enemyBullets.splice(index, 1);
            }
        });
    }
    
    // Powerup spawn loop
    function powerupSpawnLoop() {
        if (!gameRunning) return;
        
        if (Math.random() < 0.3) {
            spawnPowerup();
        }
        
        powerupSpawnLoopId = setTimeout(powerupSpawnLoop, powerupSpawnRate);
    }
    
    // Spawn powerup
    function spawnPowerup() {
        const powerupType = Math.random() < 0.5 ? 'life' : 'destroy';
        const powerup = $(`<div class="powerup ${powerupType}"></div>`);
        $gameCanvas.append(powerup);
        
        const powerupX = Math.random() * ($gameCanvas.width() - 25);
        const powerupY = -25;
        
        powerup.css({
            left: powerupX + 'px',
            top: powerupY + 'px'
        });
        
        powerups.push({
            element: powerup,
            x: powerupX,
            y: powerupY,
            type: powerupType
        });
    }
    
    // Update powerups
    function updatePowerups() {
        powerups.forEach((powerup, index) => {
            powerup.y += 2;
            powerup.element.css('top', powerup.y + 'px');
            
            // Remove powerups that go off screen
            if (powerup.y > $gameCanvas.height()) {
                powerup.element.remove();
                powerups.splice(index, 1);
            }
        });
    }
    
    // Check collisions
    function checkCollisions() {
        // Player bullets vs enemies
        bullets.forEach((bullet, bulletIndex) => {
            enemies.forEach((enemy, enemyIndex) => {
                if (isColliding(bullet, enemy, 4, 30)) {
                    // Enemy hit
                    enemy.health--;
                    bullet.element.remove();
                    bullets.splice(bulletIndex, 1);
                    
                    if (enemy.health <= 0) {
                        createExplosion(enemy.x, enemy.y);
                        enemy.element.remove();
                        enemies.splice(enemyIndex, 1);
                        score += 100;
                        updateScore();
                        
                        // Level up every 1000 points
                        if (score % 1000 === 0) {
                            levelUp();
                        }
                    }
                }
            });
        });
        
        // Enemy bullets vs player
        enemyBullets.forEach((bullet, index) => {
            if (isColliding(bullet, {x: playerX, y: playerY}, 4, 40)) {
                bullet.element.remove();
                enemyBullets.splice(index, 1);
                loseLife();
            }
        });
        
        // Enemies vs player
        enemies.forEach((enemy, index) => {
            if (isColliding(enemy, {x: playerX, y: playerY}, 30, 40)) {
                createExplosion(enemy.x, enemy.y);
                enemy.element.remove();
                enemies.splice(index, 1);
                loseLife();
            }
        });
        
        // Powerups vs player
        powerups.forEach((powerup, index) => {
            if (isColliding(powerup, {x: playerX, y: playerY}, 25, 40)) {
                powerup.element.remove();
                powerups.splice(index, 1);
                collectPowerup(powerup.type);
            }
        });
    }
    
    // Collision detection
    function isColliding(obj1, obj2, size1, size2) {
        return obj1.x < obj2.x + size2 &&
               obj1.x + size1 > obj2.x &&
               obj1.y < obj2.y + size2 &&
               obj1.y + size1 > obj2.y;
    }
    
    // Create explosion effect
    function createExplosion(x, y) {
        const explosion = $('<div class="explosion"></div>');
        $gameCanvas.append(explosion);
        
        explosion.css({
            left: (x - 25) + 'px',
            top: (y - 25) + 'px'
        });
        
        explosions.push(explosion);
        
        // Remove explosion after animation
        setTimeout(() => {
            explosion.remove();
            const index = explosions.indexOf(explosion);
            if (index > -1) {
                explosions.splice(index, 1);
            }
        }, 500);
    }
    
    // Lose life
    function loseLife() {
        lives--;
        updateLives();
        
        if (lives <= 0) {
            gameOver();
        } else {
            // Brief invulnerability
            $player.css('opacity', '0.5');
            setTimeout(() => {
                $player.css('opacity', '1');
            }, 2000);
        }
    }
    
    // Collect powerup
    function collectPowerup(type) {
        if (type === 'life') {
            lives++;
            updateLives();
            // Visual feedback for life powerup
            $('body').css('background', 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #00ff00 100%)');
            setTimeout(() => {
                $('body').css('background', 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)');
            }, 300);
        } else if (type === 'destroy') {
            // Destroy all enemies
            enemies.forEach(enemy => {
                createExplosion(enemy.x, enemy.y);
                enemy.element.remove();
                score += 50; // Bonus points for each destroyed enemy
            });
            enemies = [];
            updateScore();
            
            // Visual feedback for destroy powerup
            $('body').css('background', 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #ff4444 100%)');
            setTimeout(() => {
                $('body').css('background', 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)');
            }, 300);
        }
    }
    
    // Level up
    function levelUp() {
        level++;
        updateLevel();
        
        // Increase difficulty more gradually
        enemySpeed += 0.3;
        enemySpawnRate = Math.max(1000, enemySpawnRate - 150);
        
        // Visual feedback
        $('body').css('background', 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)');
        setTimeout(() => {
            $('body').css('background', 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)');
        }, 200);
    }
    
    // Update score display
    function updateScore() {
        $('#score').text(score);
    }
    
    // Update lives display
    function updateLives() {
        $('#lives').text(lives);
    }
    
    // Update level display
    function updateLevel() {
        $('#level').text(level);
    }
    
    // Handle window resize
    $(window).on('resize', function() {
        if ($player) {
            // Keep player in bounds
            playerX = Math.min(Math.max(0, playerX), $gameCanvas.width() - 40);
            playerY = Math.min(Math.max(0, playerY), $gameCanvas.height() - 40);
            updatePlayerPosition();
        }
    });
    
    // Initialize the game
    initGame();
}); 