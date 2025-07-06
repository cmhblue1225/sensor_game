class SensorShooterGame {
    constructor() {
        this.gameEngine = new GameEngine('gameCanvas');
        this.ctx = this.gameEngine.getContext();
        this.canvas = this.gameEngine.getCanvas();

        this.sensorManager = new SensorManager();

        this.playerTurret = new PlayerTurret(this.canvas.width / 2, this.canvas.height / 2, 30, 'white');
        this.enemies = [];
        this.projectiles = [];

        this.score = 0;
        this.gameStarted = false;
        this.gameFinished = false;

        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 1.5; // seconds
        this.maxEnemies = 10;

        this.init();
    }

    init() {
        console.log('🎮 [SensorShooterGame] 게임 초기화 시작');

        this.sensorManager.onSensorData((tiltInput, sensorData) => {
            this.handleSensorInput(tiltInput, sensorData);
        });

        this.gameEngine.onUpdate(this.update.bind(this));
        this.gameEngine.start();

        this.setupEventListeners();

        document.getElementById('loadingScreen').style.display = 'none';
        this.startCountdown();
        console.log('🎮 [SensorShooterGame] 게임 초기화 완료');
    }

    startCountdown() {
        let countdown = 3;
        const countdownScreen = document.getElementById('countdownScreen');
        const countdownNumber = document.getElementById('countdownNumber');

        countdownScreen.style.display = 'flex';
        countdownNumber.innerText = countdown;

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                countdownNumber.innerText = countdown;
            } else if (countdown === 0) {
                countdownNumber.innerText = 'GO!';
                countdownNumber.classList.add('go-text');
            } else {
                clearInterval(countdownInterval);
                countdownScreen.style.display = 'none';
                this.gameStarted = true;
                console.log('게임 시작!');
            }
        }, 1000);
    }

    handleSensorInput(tiltInput, sensorData) {
        if (!this.gameStarted || this.gameFinished) return;

        // playerTurret.update는 이제 update(deltaTime)에서 호출됩니다.
        // 여기서는 발사 입력만 처리합니다.
        if (tiltInput.shoot && this.playerTurret.canShoot()) {
            const projectileProps = this.playerTurret.shoot();
            this.projectiles.push(new Projectile(
                projectileProps.x, 
                projectileProps.y, 
                projectileProps.angle, 
                500, // Projectile speed
                5,   // Projectile radius
                'yellow' // Projectile color
            ));
        }
    }

    update(deltaTime) {
        console.log('Updating game...');
        if (!this.gameStarted || this.gameFinished) return;

        // Update player turret (aiming and cooldowns)
        this.playerTurret.update(deltaTime, this.sensorManager.getTiltInput());

        // Spawn enemies
        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer >= this.enemySpawnInterval && this.enemies.length < this.maxEnemies) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }

        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);
            if (enemy.hasReachedCenter()) {
                this.playerTurret.takeDamage(10); // Player takes damage
                enemy.isAlive = false; // Remove enemy
            }
        });

        // Update projectiles
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime);
        });

        // Collision detection (Projectiles vs Enemies)
        this.projectiles.forEach(projectile => {
            if (!projectile.isAlive) return;
            this.enemies.forEach(enemy => {
                if (enemy.isAlive && projectile.checkCollision(enemy)) {
                    enemy.takeDamage(1); // Each hit deals 1 damage
                    projectile.isAlive = false; // Projectile disappears on hit
                    if (!enemy.isAlive) {
                        this.score += 10; // Score for destroying enemy
                    }
                }
            });
        });

        // Remove dead enemies and projectiles
        this.enemies = this.enemies.filter(enemy => enemy.isAlive);
        this.projectiles = this.projectiles.filter(projectile => projectile.isAlive);

        // Update UI
        this.updateUI();

        // Check game over condition
        if (this.playerTurret.health <= 0) {
            this.gameFinished = true;
            this.showGameOverScreen();
        }

        this.render(); // Add this line to call render after update
    }

    render() {
        console.log('Rendering game...');
        // Render player turret
        if (this.playerTurret) {
            console.log(`Drawing player turret at (${this.playerTurret.x}, ${this.playerTurret.y})`);
            this.playerTurret.draw(this.ctx);
        }

        // Render enemies
        if (this.enemies.length > 0) {
            console.log(`Drawing ${this.enemies.length} enemies.`);
            this.enemies.forEach(enemy => {
                enemy.draw(this.ctx);
            });
        }

        // Render projectiles
        if (this.projectiles.length > 0) {
            console.log(`Drawing ${this.projectiles.length} projectiles.`);
            this.projectiles.forEach(projectile => {
                projectile.draw(this.ctx);
            });
        }
    }

    spawnEnemy() {
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;
        const radius = 20 + Math.random() * 10; // Random size
        const speed = 50 + Math.random() * 50; // Random speed
        const color = `hsl(${Math.random() * 360}, 70%, 50%)`; // Random color

        switch (side) {
            case 0: // Top
                x = Math.random() * this.canvas.width;
                y = -radius;
                break;
            case 1: // Right
                x = this.canvas.width + radius;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // Bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + radius;
                break;
            case 3: // Left
                x = -radius;
                y = Math.random() * this.canvas.height;
                break;
        }
        this.enemies.push(new Enemy(x, y, radius, color, speed));
    }

    updateUI() {
        document.getElementById('scoreDisplay').innerText = this.score;
        document.getElementById('healthDisplay').innerText = this.playerTurret.health;
    }

    showGameOverScreen() {
        document.getElementById('gameOverScreen').style.display = 'flex';
        document.getElementById('finalScore').innerText = this.score;
    }

    setupEventListeners() {
        // No specific event listeners for now, handled by SensorManager
    }
}

// Global functions for hub compatibility
function restartGame() {
    location.reload(); // Simple reload for now
}

function goToMain() {
    window.location.href = '/';
}

// Initialize the game when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.sensorShooterGame = new SensorShooterGame();
});
