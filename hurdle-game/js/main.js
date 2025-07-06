class HurdleGame {
    constructor() {
        this.gameEngine = new GameEngine('gameCanvas');
        this.ctx = this.gameEngine.getContext();
        this.canvas = this.gameEngine.getCanvas();

        this.sensorManager = new SensorManager();

        this.player = new Player(50, 420, 'blue');
        this.aiPlayers = [
            new AIPlayer(50, 420, 'red', null),
            new AIPlayer(50, 420, 'green', null)
        ];
        this.allRacers = [this.player, ...this.aiPlayers];

        this.hurdles = [];
        this.finishLineX = 5000; // Distance to finish line
        this.gameStarted = false;
        this.gameFinished = false;
        this.rank = 0;

        this.init();
    }

    init() {
        console.log('🎮 [HurdleGame] 게임 초기화');

        this.sensorManager.onSensorData((tiltInput, sensorData) => {
            this.handleSensorInput(tiltInput, sensorData);
        });

        this.gameEngine.onUpdate(this.update.bind(this));
        this.gameEngine.start();

        this.setupEventListeners();
        this.generateHurdles();

        document.getElementById('loadingScreen').style.display = 'none';
        this.gameStarted = true; // Start game immediately after loading
    }

    generateHurdles() {
        let currentX = 500; // Start hurdles after some initial run
        const minDistance = 300;
        const maxDistance = 600;
        const hurdleWidth = 20;
        const hurdleHeight = 50;
        const groundY = 500; // Ground level

        while (currentX < this.finishLineX - 200) {
            const distance = minDistance + Math.random() * (maxDistance - minDistance);
            this.hurdles.push(new Hurdle(currentX + distance, groundY - hurdleHeight, hurdleWidth, hurdleHeight));
            currentX += distance;
        }
    }

    handleSensorInput(tiltInput, sensorData) {
        if (!this.gameStarted || this.gameFinished) return;

        if (tiltInput.jump) {
            this.player.jump();
        }
    }

    update(deltaTime) {
        if (!this.gameStarted || this.gameFinished) return;

        // Update all racers
        this.allRacers.forEach(racer => {
            if (!racer.finished) {
                racer.update(deltaTime, this.hurdles); // Pass hurdles for AI logic

                // Check for hurdle collisions
                this.hurdles.forEach(hurdle => {
                    if (racer.checkCollision(hurdle) && !racer.isJumping) {
                        // Simple penalty: slow down or reset position slightly
                        racer.speed *= 0.8; // Slow down by 20%
                        setTimeout(() => racer.speed /= 0.8, 500); // Recover speed after 0.5s
                    }
                });

                // Check if racer crossed finish line
                if (racer.x >= this.finishLineX && !racer.finished) {
                    racer.finished = true;
                    this.rank++;
                    racer.rank = this.rank;
                    console.log(`${racer.color} racer finished at rank ${racer.rank}`);

                    if (racer === this.player) {
                        this.gameFinished = true;
                        this.showGameOverScreen();
                    }
                }
            }
        });

        // Sort racers by distance for ranking
        this.allRacers.sort((a, b) => b.distance - a.distance);
        this.updateUI();

        this.render();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const cameraOffset = this.player.x - 150; // Keep player around x=150

        // Draw ground
        this.ctx.fillStyle = '#5cb85c';
        this.ctx.fillRect(0, 500, this.canvas.width, 100);

        // Draw finish line
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.finishLineX - cameraOffset, 0, 10, this.canvas.height);

        // Draw hurdles
        this.hurdles.forEach(hurdle => {
            hurdle.draw(this.ctx, cameraOffset);
        });

        // Draw racers
        this.allRacers.forEach(racer => {
            racer.draw(this.ctx, cameraOffset);
        });
    }

    updateUI() {
        document.getElementById('rankDisplay').innerText = this.player.rank === 0 ? '-' : this.player.rank;
        document.getElementById('distanceDisplay').innerText = Math.floor(this.player.distance);
    }

    showGameOverScreen() {
        document.getElementById('gameOverScreen').style.display = 'flex';
        document.getElementById('finalRank').innerText = this.player.rank;
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
    window.hurdleGame = new HurdleGame();
});
