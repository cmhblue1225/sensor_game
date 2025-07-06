class SensorShooterGame {
    constructor() {
        console.log('🎮 SensorShooterGame 생성자 시작');
        
        try {
            console.log('GameEngine 생성 중...');
            this.gameEngine = new GameEngine('gameCanvas');
            
            console.log('Context 및 Canvas 가져오는 중...');
            this.ctx = this.gameEngine.getContext();
            this.canvas = this.gameEngine.getCanvas();
            
            console.log('SensorManager 생성 중...');
            this.sensorManager = new SensorManager();
            
            console.log('PlayerTurret 생성 중...');
            this.playerTurret = new PlayerTurret(this.canvas.width / 2, this.canvas.height / 2, 30, 'white');
            
            this.enemies = [];
            this.projectiles = [];

            this.score = 0;
            this.gameStarted = false;
            this.gameFinished = false;

            this.enemySpawnTimer = 0;
            this.enemySpawnInterval = 1.5; // seconds
            this.maxEnemies = 10;

            this.autoShootTimer = 0;
            this.autoShootInterval = 0.2; // Auto-shoot every 0.2 seconds

            console.log('모든 컴포넌트 생성 완료, init() 호출');
            this.init();
        } catch (error) {
            console.error('❌ SensorShooterGame 생성자에서 오류:', error);
            throw error;
        }
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

        // 조준만 처리
        this.playerTurret.update(0, tiltInput); 
    }

    update(deltaTime) {
        console.log('Updating game...');
        if (!this.gameStarted || this.gameFinished) return;

        // Update player turret (aiming and cooldowns)
        this.playerTurret.update(deltaTime, this.sensorManager.getTiltInput());

        // Auto-shoot logic
        this.autoShootTimer += deltaTime;
        if (this.autoShootTimer >= this.autoShootInterval) {
            if (this.playerTurret.canShoot()) {
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
            this.autoShootTimer = 0;
        }

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
    console.log('DOM 로드 완료, 게임 초기화 시작');
    
    // 필수 클래스들이 로드되었는지 확인
    const requiredClasses = ['GameEngine', 'SensorManager', 'PlayerTurret', 'Enemy', 'Projectile'];
    const missingClasses = requiredClasses.filter(className => typeof window[className] === 'undefined');
    
    if (missingClasses.length > 0) {
        console.error('❌ 필수 클래스 누락:', missingClasses);
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.innerHTML = 
                `<h1>🚫 게임 로드 실패</h1><p>누락된 파일: ${missingClasses.join(', ')}</p>`;
        }
        return;
    }
    
    try {
        window.sensorShooterGame = new SensorShooterGame();
        console.log('✅ 센서 슈터 게임 초기화 성공');
    } catch (error) {
        console.error('❌ 게임 초기화 실패:', error);
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.innerHTML = 
                `<h1>🚫 게임 초기화 실패</h1><p>오류: ${error.message}</p>`;
        }
    }
});
