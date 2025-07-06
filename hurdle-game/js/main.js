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

        this.countdown = 3; // Initial countdown value
        this.countdownInterval = null;

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
        this.startCountdown();
    }

    startCountdown() {
        document.getElementById('countdownScreen').style.display = 'flex';
        document.getElementById('countdownNumber').innerText = this.countdown;

        this.countdownInterval = setInterval(() => {
            this.countdown--;
            if (this.countdown > 0) {
                document.getElementById('countdownNumber').innerText = this.countdown;
            } else if (this.countdown === 0) {
                document.getElementById('countdownNumber').innerText = 'GO!';
                document.getElementById('countdownNumber').classList.add('go-text');
            } else {
                clearInterval(this.countdownInterval);
                document.getElementById('countdownScreen').style.display = 'none';
                this.gameStarted = true;
                console.log('게임 시작!');
            }
        }, 1000);
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
                        this.showGameOverScreen(this.allRacers.filter(r => r.finished).sort((a, b) => a.rank - b.rank));
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

        // Draw sky (background)
        this.ctx.fillStyle = '#87CEEB'; // Sky blue
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw distant hills/mountains (simple shapes)
        this.ctx.fillStyle = '#6B8E23'; // Olive green
        this.ctx.beginPath();
        this.ctx.moveTo(0 - cameraOffset * 0.1, 400);
        this.ctx.bezierCurveTo(100 - cameraOffset * 0.1, 300, 300 - cameraOffset * 0.1, 350, 400 - cameraOffset * 0.1, 400);
        this.ctx.bezierCurveTo(500 - cameraOffset * 0.1, 300, 700 - cameraOffset * 0.1, 350, 800 - cameraOffset * 0.1, 400);
        this.ctx.lineTo(this.canvas.width, 400);
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw clouds (simple circles, moving slower than foreground)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const cloudSpeed = 0.05; // Slower than player
        this.ctx.beginPath();
        this.ctx.arc(100 - cameraOffset * cloudSpeed, 100, 40, 0, Math.PI * 2);
        this.ctx.arc(150 - cameraOffset * cloudSpeed, 80, 50, 0, Math.PI * 2);
        this.ctx.arc(200 - cameraOffset * cloudSpeed, 110, 45, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(500 - cameraOffset * cloudSpeed, 150, 60, 0, Math.PI * 2);
        this.ctx.arc(560 - cameraOffset * cloudSpeed, 130, 40, 0, Math.PI * 2);
        this.ctx.arc(620 - cameraOffset * cloudSpeed, 160, 55, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw ground (track)
        this.ctx.fillStyle = '#5cb85c';
        this.ctx.fillRect(0, 500, this.canvas.width, 100);

        // Draw track lanes
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        const laneHeight = 30;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, 500 + (i + 1) * laneHeight);
            this.ctx.lineTo(this.canvas.width, 500 + (i + 1) * laneHeight);
            this.ctx.stroke();
        }

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

        // Update racer track overview
        const racerMarkersContainer = document.getElementById('racerMarkers');
        if (racerMarkersContainer) {
            // Clear existing markers
            racerMarkersContainer.innerHTML = '';
            console.log('racerMarkersContainer found.');

            this.allRacers.forEach(racer => {
                const marker = document.createElement('div');
                marker.className = 'racer-marker';
                marker.style.backgroundColor = racer.color;

                // Calculate position based on distance relative to finish line
                const trackLength = this.finishLineX; // Assuming track starts at 0
                let positionPercentage = (racer.distance / trackLength) * 100;
                positionPercentage = Math.max(0, Math.min(100, positionPercentage)); // Clamp between 0 and 100

                marker.style.left = `${positionPercentage}%`;
                racerMarkersContainer.appendChild(marker);
                console.log(`Racer ${racer.color} marker created at ${positionPercentage}%`);
            });
        } else {
            console.log('racerMarkersContainer not found!');
        }
    }

    showGameOverScreen(finalRanks) {
        document.getElementById('gameOverScreen').style.display = 'flex';
        
        const rankList = document.getElementById('finalRankList');
        rankList.innerHTML = '';
        finalRanks.forEach(racer => {
            const listItem = document.createElement('li');
            listItem.innerText = `${racer.rank}위: ${racer.color} 선수`;
            rankList.appendChild(listItem);
        });
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
